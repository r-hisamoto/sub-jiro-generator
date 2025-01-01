import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UploadResult {
  file: File;
  url: string;
}

export const useFileUpload = (onFileSelect: (result: UploadResult) => void) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadFile = async (file: File): Promise<string> => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('User error:', userError);
      throw new Error('ログインが必要です。');
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;

      console.log('Starting file upload:', {
        fileName,
        fileSize: file.size,
      });

      // Upload the file directly to storage
      const { data, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            const percent = (progress.loaded / progress.total) * 100;
            setUploadProgress(Math.min(percent, 95));
          },
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName);

      console.log('File upload completed:', { publicUrl });

      // Save video metadata to the database
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