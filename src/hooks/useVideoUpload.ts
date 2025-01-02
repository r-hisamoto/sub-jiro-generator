import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";

// チャンクサイズを1GBに増加
const CHUNK_SIZE = 1024 * 1024 * 1024; // 1GB chunks
const MAX_CONCURRENT_UPLOADS = 10; // 並列アップロード数を10に増加
const RETRY_DELAYS = [1000, 2000, 4000, 8000]; // リトライ間隔を指数的に増加
const UPLOAD_TIMEOUT = 30000; // 30秒のタイムアウト

interface UploadResult {
  error: Error | null;
  data: any;
}

export const useVideoUpload = () => {
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadChunk = async (
    chunk: Blob,
    chunkPath: string,
    retryCount = 0
  ): Promise<void> => {
    try {
      console.log(`Uploading chunk: ${chunkPath}, size: ${chunk.size / (1024 * 1024)}MB`);
      
      const timeoutPromise = new Promise<UploadResult>((_, reject) => {
        setTimeout(() => reject(new Error('Upload timeout')), UPLOAD_TIMEOUT);
      });

      const uploadPromise: Promise<UploadResult> = supabase.storage
        .from('temp-chunks')
        .upload(chunkPath, chunk, {
          upsert: true,
          contentType: 'application/octet-stream',
          cacheControl: '3600',
          duplex: 'half'
        });

      const result = await Promise.race([uploadPromise, timeoutPromise]);
      
      if (result.error) {
        throw result.error;
      }
      
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

      // 並列アップロードの実装（10個まで同時実行）
      const uploadQueue = [...chunks];
      const activeUploads = new Set<Promise<void>>();
      let completedChunks = 0;

      while (uploadQueue.length > 0 || activeUploads.size > 0) {
        // キューからチャンクを取り出してアップロード
        while (uploadQueue.length > 0 && activeUploads.size < MAX_CONCURRENT_UPLOADS) {
          const chunk = uploadQueue.shift()!;
          const chunkIndex = chunks.indexOf(chunk);
          const chunkPath = `${uploadPath}/chunk_${chunkIndex}`;
          
          const uploadPromise = uploadChunk(chunk, chunkPath)
            .then(() => {
              completedChunks++;
              const progress = Math.min((completedChunks / chunks.length) * 100, 100);
              setUploadProgress(progress);
              activeUploads.delete(uploadPromise);
            })
            .catch((error) => {
              console.error(`Failed to upload chunk ${chunkIndex}:`, error);
              uploadQueue.unshift(chunk); // リトライのためにキューに戻す
              activeUploads.delete(uploadPromise);
            });

          activeUploads.add(uploadPromise);
        }

        // アクティブなアップロードの完了を待つ
        if (activeUploads.size > 0) {
          await Promise.race(activeUploads);
        }
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