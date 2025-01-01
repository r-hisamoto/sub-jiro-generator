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
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('Session error:', sessionError);
      throw new Error('ログインが必要です。');
    }

    try {
      console.log('Starting file upload:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}/${crypto.randomUUID()}.${fileExt}`;

      // Create a signed URL for the upload
      const { data: { signedUrl, path }, error: signedUrlError } = await supabase.storage
        .from('videos')
        .createSignedUploadUrl(fileName);

      if (signedUrlError) {
        console.error('Signed URL error:', signedUrlError);
        throw signedUrlError;
      }

      // Upload the file using the signed URL
      const uploadResponse = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      // Save video metadata to the database
      const { error: dbError } = await supabase.from('videos').insert({
        title: file.name,
        file_path: path,
        content_type: file.type,
        size: file.size,
        user_id: session.user.id
      });

      if (dbError) {
        console.error('Database insert error:', dbError);
        throw dbError;
      }

      // Get the public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(path);

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