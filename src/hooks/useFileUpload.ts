import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks

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
    partNumber: number
  ): Promise<boolean> => {
    try {
      const { data: { signedUrl }, error: signedUrlError } = await supabase.storage
        .from('videos')
        .createSignedUploadUrl(`${fileName}.part${partNumber}`);

      if (signedUrlError) {
        console.error('Signed URL error:', signedUrlError);
        throw signedUrlError;
      }

      const response = await fetch(signedUrl, {
        method: 'PUT',
        body: chunk,
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      });

      if (!response.ok) {
        throw new Error(`Chunk upload failed: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error(`Chunk ${partNumber} upload failed:`, error);
      throw error;
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      throw new Error('ログインが必要です。');
    }

    try {
      const fileExt = file.name.split('.').pop();
      const baseFileName = `${session.user.id}/${crypto.randomUUID()}`;
      const finalFileName = `${baseFileName}.${fileExt}`;

      // Split file into chunks
      const chunks: Blob[] = [];
      let offset = 0;
      while (offset < file.size) {
        chunks.push(file.slice(offset, offset + CHUNK_SIZE));
        offset += CHUNK_SIZE;
      }

      // Upload chunks with progress tracking
      let bytesUploaded = 0;
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        await uploadChunk(chunk, baseFileName, i);
        
        bytesUploaded += chunk.size;
        const progress = (bytesUploaded / file.size) * 100;
        setUploadProgress(progress);
      }

      // Combine chunks into final file
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
      await Promise.all(
        chunks.map((_, i) =>
          supabase.storage
            .from('videos')
            .remove([`${baseFileName}.part${i}`])
        )
      );

      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(finalFileName);

      return publicUrl;
    } catch (error) {
      console.error('Upload process error:', error);
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