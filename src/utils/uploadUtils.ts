import { supabase } from "@/integrations/supabase/client";
import { UPLOAD_TIMEOUT, RETRY_DELAYS } from "@/config/uploadConfig";
import { UploadResult } from "@/types/upload";

export const uploadChunk = async (
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
        duplex: 'half'
      });

    const result = await Promise.race([uploadPromise, timeoutPromise]);
    
    if ('error' in result && result.error) {
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
  
  console.log('Video job created:', job);
  return job.id;
};

export const divideFileIntoChunks = (file: File, chunkSize: number): Blob[] => {
  const chunks: Blob[] = [];
  let offset = 0;
  while (offset < file.size) {
    const chunk = file.slice(offset, offset + chunkSize);
    chunks.push(chunk);
    offset += chunkSize;
  }
  return chunks;
};