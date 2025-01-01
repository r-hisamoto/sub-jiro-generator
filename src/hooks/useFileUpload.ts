import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";

const CHUNK_SIZE = 50 * 1024 * 1024; // 50MB chunks
const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB
const MAX_RETRIES = 3;
const CONCURRENT_UPLOADS = 2;
const BATCH_DELAY = 500; // 500ms delay between batches

interface UploadProgress {
  bytesUploaded: number;
  totalBytes: number;
  percentage: number;
  currentChunk: number;
  totalChunks: number;
  status: string;
}

export const useFileUpload = (onFileSelect: (result: { file: File; url: string }) => void) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    bytesUploaded: 0,
    totalBytes: 0,
    percentage: 0,
    currentChunk: 0,
    totalChunks: 0,
    status: 'preparing'
  });

  const uploadChunk = async (
    chunk: Blob,
    fileName: string,
    attempt = 1
  ): Promise<void> => {
    try {
      const { error } = await supabase.storage
        .from('temp-chunks')
        .upload(fileName, chunk, {
          upsert: true,
          contentType: 'application/octet-stream',
          duplex: 'half'
        });

      if (error) throw error;
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        const delayMs = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return uploadChunk(chunk, fileName, attempt + 1);
      }
      throw error;
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds the maximum limit of 5GB`);
    }

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      throw new Error('Authentication required');
    }

    const fileExt = file.name.split('.').pop();
    const baseFileName = `${session.user.id}/${crypto.randomUUID()}`;
    const finalFileName = `${baseFileName}.${fileExt}`;

    try {
      setUploadProgress(prev => ({ ...prev, status: 'preparing' }));

      // Calculate total chunks
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      const chunks: { index: number; blob: Blob }[] = [];

      // Prepare chunks
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        chunks.push({
          index: i,
          blob: file.slice(start, end)
        });
      }

      setUploadProgress(prev => ({ 
        ...prev, 
        totalBytes: file.size,
        totalChunks,
        status: 'uploading'
      }));

      // Upload chunks with controlled concurrency
      const chunksArray = [...chunks];
      let bytesUploaded = 0;

      while (chunksArray.length > 0) {
        const batch = chunksArray.splice(0, CONCURRENT_UPLOADS);
        await Promise.all(batch.map(async ({ index, blob }) => {
          const chunkFileName = `${baseFileName}_${index}`;
          await uploadChunk(blob, chunkFileName);

          bytesUploaded += blob.size;
          setUploadProgress(prev => ({
            ...prev,
            bytesUploaded,
            percentage: (bytesUploaded / file.size) * 100,
            currentChunk: prev.currentChunk + 1
          }));
        }));

        if (chunksArray.length > 0) {
          await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
        }
      }

      setUploadProgress(prev => ({ ...prev, status: 'processing' }));

      // Trigger server-side processing
      const { data: processingResult, error: processingError } = await supabase
        .functions.invoke('process-video', {
          body: {
            baseFileName,
            fileExt,
            totalChunks,
            metadata: {
              contentType: file.type,
              originalName: file.name,
              size: file.size
            }
          }
        });

      if (processingError) throw processingError;

      onFileSelect({
        file,
        url: processingResult.publicUrl
      });

      return processingResult.publicUrl;
    } catch (error) {
      setUploadProgress(prev => ({ ...prev, status: 'error' }));
      throw error;
    }
  };

  return {
    isUploading,
    uploadProgress,
    uploadFile,
    setIsUploading
  };
};