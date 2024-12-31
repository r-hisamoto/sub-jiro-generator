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

    // Ensure the file path is correctly formatted
    const chunkPath = `${filePath.replace(/^videos\//, '')}_part${chunkIndex}`;
    console.log('Uploading chunk:', { chunkPath, chunkIndex, totalChunks });

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
      body: { 
        filePath: filePath.replace(/^videos\//, ''),
        totalChunks 
      }
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
      const chunkSize = 5 * 1024 * 1024; // Reduced to 5MB chunks
      const totalChunks = Math.ceil(file.size / chunkSize);

      console.log('Starting file upload:', {
        fileName,
        fileSize: file.size,
        totalChunks,
        chunkSize
      });

      // Upload chunks sequentially to avoid overwhelming the server
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const chunk = file.slice(start, start + chunkSize);
        await uploadChunk(chunk, fileName, i, totalChunks);
        // Add a small delay between chunks
        await new Promise(resolve => setTimeout(resolve, 100));
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