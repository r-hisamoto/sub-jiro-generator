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

      // Get a pre-signed URL for upload
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('videos')
        .createSignedUploadUrl(fileName);

      if (signedUrlError) {
        console.error('Signed URL error:', signedUrlError);
        throw signedUrlError;
      }

      // Upload using XMLHttpRequest for progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', signedUrlData.signedUrl, true);
        
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percent = (event.loaded / event.total) * 100;
            setUploadProgress(Math.min(percent, 95));
          }
        });

        xhr.addEventListener('load', async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
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
                reject(dbError);
                return;
              }

              setUploadProgress(100);
              resolve();
            } catch (error) {
              reject(error);
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });

        xhr.send(file);
      });

      // Get the public URL after successful upload
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName);

      console.log('File upload completed:', { publicUrl });

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