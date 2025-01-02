import { supabase } from "@/integrations/supabase/client";
import { UPLOAD_TIMEOUT, RETRY_DELAYS } from "@/config/uploadConfig";
import { UploadResult } from "@/types/upload";

export const uploadChunk = async (
  chunk: Blob,
  chunkPath: string,
  retryCount = 0
): Promise<void> => {
  try {
    console.log(`Uploading chunk: ${chunkPath}, size: ${(chunk.size / (1024 * 1024)).toFixed(2)}MB`);
    
    const timeoutPromise = new Promise<UploadResult>((_, reject) => {
      setTimeout(() => {
        console.error(`Upload timeout for chunk: ${chunkPath}`);
        reject(new Error('Upload timeout'));
      }, UPLOAD_TIMEOUT * 2); // タイムアウト時間を2倍に延長
    });

    const uploadPromise: Promise<UploadResult> = supabase.storage
      .from('temp-chunks')
      .upload(chunkPath, chunk, {
        upsert: true,
        contentType: 'application/octet-stream',
        duplex: 'half'
      });

    const result = await Promise.race([uploadPromise, timeoutPromise]);
    
    if ('error' in result && result.error) {
      console.error(`Error in uploadChunk for ${chunkPath}:`, result.error);
      throw result.error;
    }
    
    console.log(`Successfully uploaded chunk: ${chunkPath}`);
  } catch (error) {
    console.error(`Error uploading chunk ${chunkPath}:`, error);
    
    if (retryCount < RETRY_DELAYS.length) {
      const delay = RETRY_DELAYS[retryCount] * 2; // リトライ間隔も2倍に延長
      console.log(`Retrying chunk upload after ${delay}ms (attempt ${retryCount + 1}/${RETRY_DELAYS.length})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return uploadChunk(chunk, chunkPath, retryCount + 1);
    }
    throw error;
  }
};

export const createVideoJob = async (
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
  
  console.log('Video job created successfully:', job);
  return job.id;
};

export const divideFileIntoChunks = (file: File, chunkSize: number): Blob[] => {
  console.log(`Dividing file (${file.name}, ${(file.size / (1024 * 1024)).toFixed(2)}MB) into chunks of ${(chunkSize / (1024 * 1024)).toFixed(2)}MB`);
  const chunks: Blob[] = [];
  let offset = 0;
  while (offset < file.size) {
    const chunk = file.slice(offset, offset + chunkSize);
    chunks.push(chunk);
    offset += chunkSize;
  }
  console.log(`Created ${chunks.length} chunks`);
  return chunks;
};