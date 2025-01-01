import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";

const CHUNK_SIZE = 100 * 1024 * 1024; // 100MB chunks for Pro plan
const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB (Pro plan limit)
const MAX_RETRIES = 3;
const CONCURRENT_UPLOADS = 3;

interface UploadProgress {
  bytesUploaded: number;
  totalBytes: number;
  percentage: number;
  currentChunk: number;
  totalChunks: number;
  status: 'preparing' | 'uploading' | 'processing' | 'completed' | 'error';
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
        .from('videos')
        .upload(fileName, chunk, {
          upsert: true,
          contentType: 'application/octet-stream'
        });

      if (error) throw error;
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
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

      // Initialize metadata in videos table
      const { error: metadataError } = await supabase
        .from('videos')
        .insert({
          title: file.name,
          file_path: finalFileName,
          content_type: file.type,
          size: file.size,
          user_id: session.user.id
        });

      if (metadataError) throw metadataError;

      setUploadProgress(prev => ({ 
        ...prev, 
        totalBytes: file.size,
        totalChunks,
        status: 'uploading'
      }));

      // Upload chunks in parallel with concurrency control
      const chunksArray = [...chunks];
      while (chunksArray.length > 0) {
        const batch = chunksArray.splice(0, CONCURRENT_UPLOADS);
        await Promise.all(batch.map(async ({ index, blob }) => {
          const chunkFileName = `${baseFileName}_${index}`;
          await uploadChunk(blob, chunkFileName);

          setUploadProgress(prev => ({
            ...prev,
            bytesUploaded: prev.bytesUploaded + blob.size,
            percentage: ((prev.bytesUploaded + blob.size) / prev.totalBytes) * 100,
            currentChunk: prev.currentChunk + 1
          }));
        }));
      }

      // Upload final file
      const { error: finalizeError } = await supabase.storage
        .from('videos')
        .upload(finalFileName, file, {
          upsert: true,
          contentType: file.type
        });

      if (finalizeError) throw finalizeError;

      setUploadProgress(prev => ({ ...prev, status: 'completed' }));

      const { data } = supabase.storage
        .from('videos')
        .getPublicUrl(finalFileName);

      if (!data?.publicUrl) {
        throw new Error('Failed to get public URL');
      }

      return data.publicUrl;
    } catch (error) {
      setUploadProgress(prev => ({ ...prev, status: 'error' }));
      throw error;
    } finally {
      // Cleanup temporary chunks
      const cleanupPromises = Array(uploadProgress.totalChunks)
        .fill(0)
        .map((_, i) => 
          supabase.storage
            .from('videos')
            .remove([`${baseFileName}_${i}`])
            .catch(console.warn)
        );
      
      await Promise.all(cleanupPromises);
    }
  };

  return {
    isUploading,
    uploadProgress,
    uploadFile,
    setIsUploading
  };
};