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
  ): Promise<void> {
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
      if (uploadError.message.includes('jwt expired') || uploadError.message.includes('Unauthorized')) {
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) throw new Error('セッションの更新に失敗しました。');
        return uploadChunk(chunk, filePath, chunkIndex, totalChunks);
      }
      throw uploadError;
    }

    const progress = ((chunkIndex + 1) / totalChunks) * 100;
    setUploadProgress(Math.min(progress, 95));
  };

  const combineChunks = async (filePath: string, totalChunks: number): Promise<void> => {
    const { error } = await supabase.functions.invoke('combine-video-chunks', {
      body: { filePath, totalChunks }
    });

    if (error) throw error;
  };

  const uploadFile = async (file: File): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('ログインが必要です。');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
    const chunkSize = 10 * 1024 * 1024; // 10MB chunks for faster upload
    const totalChunks = Math.ceil(file.size / chunkSize);
    const uploadPromises: Promise<void>[] = [];

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
      uploadPromises.push(...chunkPromises);
    }

    await combineChunks(fileName, totalChunks);
    
    const { data: { publicUrl } } = supabase.storage
      .from('videos')
      .getPublicUrl(fileName);

    await supabase.from('videos').insert({
      title: file.name,
      file_path: fileName,
      content_type: file.type,
      size: file.size,
      user_id: user.id
    });

    setUploadProgress(100);
    return publicUrl;
  };

  return {
    isUploading,
    uploadProgress,
    uploadFile,
    setIsUploading,
    setUploadProgress
  };
};