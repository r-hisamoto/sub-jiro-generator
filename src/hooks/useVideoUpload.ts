import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { CHUNK_SIZE, MAX_CONCURRENT_UPLOADS } from "@/config/uploadConfig";
import { uploadChunk, createVideoJob, divideFileIntoChunks } from "@/utils/uploadUtils";

export const useVideoUpload = () => {
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadVideo = async (file: File): Promise<string> => {
    console.log('Starting video upload:', {
      fileName: file.name,
      fileSize: file.size,
      chunkSize: CHUNK_SIZE,
      maxConcurrentUploads: MAX_CONCURRENT_UPLOADS
    });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Authentication required');

    const userId = session.user.id;
    const fileId = crypto.randomUUID();
    const uploadPath = `${userId}/${fileId}`;
    let jobId: string;

    try {
      jobId = await createVideoJob(file.name, file.size, uploadPath, userId);
      const chunks = divideFileIntoChunks(file, CHUNK_SIZE);
      console.log(`Divided file into ${chunks.length} chunks`);

      const uploadQueue = [...chunks];
      const activeUploads = new Set<Promise<void>>();
      let completedChunks = 0;

      while (uploadQueue.length > 0 || activeUploads.size > 0) {
        while (uploadQueue.length > 0 && activeUploads.size < MAX_CONCURRENT_UPLOADS) {
          const chunk = uploadQueue.shift()!;
          const chunkIndex = chunks.indexOf(chunk);
          const chunkPath = `${uploadPath}/chunk_${chunkIndex}`;
          
          const uploadPromise = uploadChunk(chunk, chunkPath)
            .then(() => {
              completedChunks++;
              const progress = Math.min((completedChunks / chunks.length) * 100, 100);
              setUploadProgress(progress);
              activeUploads.delete(uploadPromise);
            })
            .catch((error) => {
              console.error(`Failed to upload chunk ${chunkIndex}:`, error);
              uploadQueue.unshift(chunk);
              activeUploads.delete(uploadPromise);
            });

          activeUploads.add(uploadPromise);
        }

        if (activeUploads.size > 0) {
          await Promise.race([...activeUploads]);
        }
      }

      const { error: queueError } = await supabase.functions.invoke('enqueue-video-processing', {
        body: {
          jobId,
          uploadPath,
          totalChunks: chunks.length,
          metadata: {
            filename: file.name,
            filesize: file.size,
            contentType: file.type
          }
        }
      });

      if (queueError) throw queueError;

      console.log('Video upload completed successfully');
      return jobId;
    } catch (error) {
      console.error('Upload failed:', error);
      
      if (jobId) {
        await supabase
          .from('video_jobs')
          .update({ 
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', jobId);
      }
      throw error;
    }
  };

  return { uploadVideo, uploadProgress };
};