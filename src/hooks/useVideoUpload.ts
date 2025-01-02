import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";

// チャンクサイズを500MBに増やして、アップロード回数を削減
const CHUNK_SIZE = 500 * 1024 * 1024; // 500MB chunks
const MAX_CONCURRENT_UPLOADS = 5; // 並列アップロード数を5に増加
const RETRY_DELAYS = [1000, 2000, 4000]; // リトライ間隔を指数的に増加

export const useVideoUpload = () => {
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadChunk = async (
    chunk: Blob,
    chunkPath: string,
    retryCount = 0
  ): Promise<void> => {
    try {
      console.log(`Uploading chunk: ${chunkPath}, size: ${chunk.size / (1024 * 1024)}MB`);
      
      const { error } = await supabase.storage
        .from('temp-chunks')
        .upload(chunkPath, chunk, {
          upsert: true,
          contentType: 'application/octet-stream',
          cacheControl: '3600'
        });

      if (error) throw error;
      
      console.log(`Successfully uploaded chunk: ${chunkPath}`);
    } catch (error) {
      console.error(`Error uploading chunk ${chunkPath}:`, error);
      
      if (retryCount < RETRY_DELAYS.length) {
        const delay = RETRY_DELAYS[retryCount];
        console.log(`Retrying chunk upload after ${delay}ms (attempt ${retryCount + 1})`);
        await new Promise(resolve => setTimeout(resolve, delay));
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
    console.log('Creating video job:', { fileName, fileSize, uploadPath, userId });
    
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

    if (error) {
      console.error('Error creating video job:', error);
      throw error;
    }
    
    console.log('Video job created:', job);
    return job.id;
  };

  const uploadVideo = async (file: File): Promise<string> => {
    console.log('Starting video upload:', {
      fileName: file.name,
      fileSize: file.size,
      chunkSize: CHUNK_SIZE,
      maxConcurrentUploads: MAX_CONCURRENT_UPLOADS
    });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Authentication required');

    const userId = session.user.id;
    const fileId = crypto.randomUUID();
    const uploadPath = `${userId}/${fileId}`;
    let jobId: string;

    try {
      jobId = await createVideoJob(file.name, file.size, uploadPath, userId);

      // ファイルをチャンクに分割（効率的なバッファリング）
      const chunks: Blob[] = [];
      let offset = 0;
      while (offset < file.size) {
        const chunk = file.slice(offset, offset + CHUNK_SIZE);
        chunks.push(chunk);
        offset += CHUNK_SIZE;
      }

      console.log(`Divided file into ${chunks.length} chunks`);

      // 並列アップロードの実装（5つまで同時実行）
      for (let i = 0; i < chunks.length; i += MAX_CONCURRENT_UPLOADS) {
        const uploadPromises = chunks
          .slice(i, i + MAX_CONCURRENT_UPLOADS)
          .map((chunk, index) => {
            const chunkPath = `${uploadPath}/chunk_${i + index}`;
            return uploadChunk(chunk, chunkPath);
          });

        await Promise.all(uploadPromises);
        
        // プログレス更新（より正確な進捗表示）
        const progress = Math.min(((i + MAX_CONCURRENT_UPLOADS) / chunks.length) * 100, 100);
        setUploadProgress(progress);
        
        console.log(`Uploaded chunks ${i + 1} to ${Math.min(i + MAX_CONCURRENT_UPLOADS, chunks.length)} of ${chunks.length} (${progress.toFixed(1)}%)`);
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

      console.log('Video upload completed successfully');
      return jobId;
    } catch (error) {
      console.error('Upload failed:', error);
      
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