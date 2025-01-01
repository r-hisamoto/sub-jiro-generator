import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import * as tus from "tus-js-client";

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

      // Use TUS for files larger than 6MB
      if (file.size > 6 * 1024 * 1024) {
        return await uploadWithTUS(file, fileName, user.id);
      }

      // Use standard upload for smaller files
      console.log('Starting standard file upload:', {
        fileName,
        fileSize: file.size,
        fileType: file.type
      });

      const { data, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, file, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Upload process error:', error);
      throw error;
    }
  };

  const uploadWithTUS = (file: File, fileName: string, userId: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const upload = new tus.Upload(file, {
        endpoint: `https://xwimlzbnnuleqylnekoy.supabase.co/storage/v1/upload/resumable`,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        headers: {
          'x-upsert': 'true',
        },
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true,
        metadata: {
          bucketName: 'videos',
          objectName: fileName,
          contentType: file.type,
          cacheControl: '3600',
        },
        chunkSize: 6 * 1024 * 1024, // 6MB chunks as required by Supabase
        onError: (error) => {
          console.error('TUS upload failed:', error);
          reject(error);
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          const percentage = (bytesUploaded / bytesTotal) * 100;
          setUploadProgress(Math.min(percentage, 95));
        },
        onSuccess: async () => {
          try {
            // Save video metadata to the database
            const { error: dbError } = await supabase.from('videos').insert({
              title: file.name,
              file_path: fileName,
              content_type: file.type,
              size: file.size,
              user_id: userId
            });

            if (dbError) {
              console.error('Database insert error:', dbError);
              reject(dbError);
              return;
            }

            const { data: { publicUrl } } = supabase.storage
              .from('videos')
              .getPublicUrl(fileName);

            setUploadProgress(100);
            resolve(publicUrl);
          } catch (error) {
            reject(error);
          }
        },
      });

      // Check for previous uploads to resume
      upload.findPreviousUploads().then((previousUploads) => {
        if (previousUploads.length) {
          upload.resumeFromPreviousUpload(previousUploads[0]);
        }
        upload.start();
      });
    });
  };

  return {
    isUploading,
    uploadProgress,
    uploadFile,
    setIsUploading,
    setUploadProgress
  };
};