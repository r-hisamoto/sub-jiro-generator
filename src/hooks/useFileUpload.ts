import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UploadResult {
  file: File;
  url: string;
}

export const useFileUpload = (onFileSelect: (result: UploadResult) => void) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadChunk = async (
    chunk: Blob,
    filePath: string,
    chunkIndex: number,
    totalChunks: number
  ): Promise<void> => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      throw new Error('セッションが無効です。再度ログインしてください。');
    }

    const chunkPath = `${filePath}_part${chunkIndex}`;
    const { error: uploadError } = await supabase.storage
      .from('videos')
      .upload(chunkPath, chunk, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Chunk upload error:', uploadError);
      if (uploadError.message.includes('jwt expired') || uploadError.message.includes('Unauthorized')) {
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error('Session refresh error:', refreshError);
          throw new Error('セッションの更新に失敗しました。');
        }
        return uploadChunk(chunk, filePath, chunkIndex, totalChunks);
      }
      throw uploadError;
    }

    const progress = ((chunkIndex + 1) / totalChunks) * 100;
    setUploadProgress(Math.min(progress, 95));
  };

  const combineChunks = async (filePath: string, totalChunks: number): Promise<void> => {
    console.log('Combining chunks:', { filePath, totalChunks });
    const { error } = await supabase.functions.invoke('combine-video-chunks', {
      body: { filePath, totalChunks }
    });

    if (error) {
      console.error('Combine chunks error:', error);
      throw error;
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('User error:', userError);
      throw new Error('ログインが必要です。');
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
      const chunkSize = 10 * 1024 * 1024; // 10MB chunks
      const totalChunks = Math.ceil(file.size / chunkSize);

      console.log('Starting file upload:', {
        fileName,
        fileSize: file.size,
        totalChunks,
        chunkSize
      });

      // Upload chunks in parallel with a maximum of 3 concurrent uploads
      const maxConcurrent = 3;
      for (let i = 0; i < totalChunks; i += maxConcurrent) {
        const chunkPromises = [];
        for (let j = 0; j < maxConcurrent && i + j < totalChunks; j++) {
          const start = (i + j) * chunkSize;
          const chunk = file.slice(start, start + chunkSize);
          chunkPromises.push(uploadChunk(chunk, fileName, i + j, totalChunks));
        }
        await Promise.all(chunkPromises);
      }

      console.log('All chunks uploaded, combining...');
      await combineChunks(fileName, totalChunks);
      
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName);

      console.log('File upload completed:', { publicUrl });

      const { error: dbError } = await supabase.from('videos').insert({
        title: file.name,
        file_path: fileName,
        content_type: file.type,
        size: file.size,
        user_id: user.id
      });

      if (dbError) {
        console.error('Database insert error:', dbError);
        throw dbError;
      }

      setUploadProgress(100);
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
    setIsUploading,
    setUploadProgress
  };
};