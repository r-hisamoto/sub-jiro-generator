import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";

// チャンクサイズを100MBに増やして、アップロード回数を減らす
const CHUNK_SIZE = 100 * 1024 * 1024; // 100MB chunks
const MAX_CONCURRENT_UPLOADS = 3; // 並列アップロード数

export const useVideoUpload = () => {
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadChunk = async (
    chunk: Blob,
    chunkPath: string,
    retryCount = 0
  ): Promise<void> => {
    try {
      const { error } = await supabase.storage
        .from('temp-chunks')
        .upload(chunkPath, chunk, {
          upsert: true,
          contentType: 'application/octet-stream'
        });

      if (error) throw error;
    } catch (error) {
      // リトライロジックを実装
      if (retryCount < 3) {
        console.log(`Retrying chunk upload (attempt ${retryCount + 1})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return uploadChunk(chunk, chunkPath, retryCount + 1);
      }
      throw error;
    }
  };

  const createVideoJob = async (
    fileName: string,
    fileSize: number,
    uploadPath: string,
    userId: string
  ): Promise<string> => {
    const { data: job, error } = await supabase
      .from('video_jobs')
      .insert({
        user_id: userId,
        status: 'pending',
        metadata: {
          filename: fileName,
          filesize: fileSize
        },
        upload_path: uploadPath
      })
      .select()
      .single();

    if (error) throw error;
    return job.id;
  };

  const uploadVideo = async (file: File): Promise<string> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Authentication required');

    const userId = session.user.id;
    const fileId = crypto.randomUUID();
    const uploadPath = `${userId}/${fileId}`;
    let jobId: string;

    try {
      jobId = await createVideoJob(file.name, file.size, uploadPath, userId);

      // ファイルをチャンクに分割
      const chunks: Blob[] = [];
      let offset = 0;
      while (offset < file.size) {
        chunks.push(file.slice(offset, offset + CHUNK_SIZE));
        offset += CHUNK_SIZE;
      }

      console.log(`Uploading ${chunks.length} chunks with size ${CHUNK_SIZE / (1024 * 1024)}MB each`);

      // 並列アップロードの実装
      for (let i = 0; i < chunks.length; i += MAX_CONCURRENT_UPLOADS) {
        const uploadPromises = chunks
          .slice(i, i + MAX_CONCURRENT_UPLOADS)
          .map((chunk, index) => {
            const chunkPath = `${uploadPath}/chunk_${i + index}`;
            return uploadChunk(chunk, chunkPath);
          });

        await Promise.all(uploadPromises);
        
        // プログレス更新
        const progress = Math.min(((i + MAX_CONCURRENT_UPLOADS) / chunks.length) * 100, 100);
        setUploadProgress(progress);
        
        console.log(`Uploaded chunks ${i + 1} to ${Math.min(i + MAX_CONCURRENT_UPLOADS, chunks.length)} of ${chunks.length}`);
      }

      // 処理キューに追加
      const { error: queueError } = await supabase.functions.invoke('enqueue-video-processing', {
        body: {
          jobId,
          uploadPath,
          totalChunks: chunks.length,
          metadata: {
            filename: file.name,
            filesize: file.size,
            contentType: file.type
          }
        }
      });

      if (queueError) throw queueError;

      return jobId;
    } catch (error) {
      // エラー時のクリーンアップ
      if (jobId) {
        await supabase
          .from('video_jobs')
          .update({ 
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', jobId);
      }
      throw error;
    }
  };

  return { uploadVideo, uploadProgress };
};