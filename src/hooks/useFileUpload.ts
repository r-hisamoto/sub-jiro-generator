import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks (Supabase recommended size)

interface UploadProgress {
  loaded: number;
  total: number;
}

export const useFileUpload = (onFileSelect: (result: { file: File; url: string }) => void) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadChunk = async (
    chunk: Blob,
    fileName: string,
    partNumber: number,
    contentType: string
  ): Promise<void> => {
    const chunkName = `${fileName}.part${partNumber}`;
    
    const { error } = await supabase.storage
      .from('videos')
      .upload(chunkName, chunk, {
        contentType,
        upsert: true
      });

    if (error) {
      console.error('Chunk upload error:', error);
      throw new Error(`Failed to upload chunk ${partNumber}: ${error.message}`);
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      throw new Error('ログインが必要です。');
    }

    const fileExt = file.name.split('.').pop();
    const baseFileName = `${session.user.id}/${crypto.randomUUID()}`;
    const finalFileName = `${baseFileName}.${fileExt}`;

    try {
      // Split file into chunks
      const chunks: Blob[] = [];
      let offset = 0;
      while (offset < file.size) {
        chunks.push(file.slice(offset, offset + CHUNK_SIZE));
        offset += CHUNK_SIZE;
      }

      // Upload chunks sequentially
      let bytesUploaded = 0;
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        await uploadChunk(chunk, baseFileName, i, file.type);
        
        bytesUploaded += chunk.size;
        const progress = (bytesUploaded / file.size) * 100;
        setUploadProgress(progress);
      }

      // Upload final complete file
      const { error: finalizeError } = await supabase.storage
        .from('videos')
        .upload(finalFileName, file, {
          upsert: true,
          contentType: file.type
        });

      if (finalizeError) {
        throw finalizeError;
      }

      // Save metadata to database
      const { error: dbError } = await supabase.from('videos').insert({
        title: file.name,
        file_path: finalFileName,
        content_type: file.type,
        size: file.size,
        user_id: session.user.id
      });

      if (dbError) {
        throw dbError;
      }

      // Clean up chunk files
      try {
        await Promise.all(
          chunks.map((_, i) =>
            supabase.storage
              .from('videos')
              .remove([`${baseFileName}.part${i}`])
          )
        );
      } catch (cleanupError) {
        console.warn('Chunk cleanup warning:', cleanupError);
        // Continue execution even if cleanup fails
      }

      const { data } = supabase.storage
        .from('videos')
        .getPublicUrl(finalFileName);

      if (!data?.publicUrl) {
        throw new Error('Failed to get public URL');
      }

      return data.publicUrl;
    } catch (error) {
      console.error('Upload process error:', error);
      // Attempt to clean up the final file on error
      try {
        await supabase.storage
          .from('videos')
          .remove([finalFileName]);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
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