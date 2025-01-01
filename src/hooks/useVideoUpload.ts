import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";

const CHUNK_SIZE = 50 * 1024 * 1024; // 50MB chunks

export const useVideoUpload = () => {
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadChunk = async (
    chunk: Blob,
    chunkPath: string
  ): Promise<void> => {
    const { error } = await supabase.storage
      .from('temp-chunks')
      .upload(chunkPath, chunk, {
        upsert: true,
        contentType: 'application/octet-stream'
      });

    if (error) throw error;
  };

  const createVideoJob = async (
    fileName: string,
    fileSize: number,
    uploadPath: string,
    userId: string
  ): Promise<string> => {
    const { data: job, error } = await supabase
      .from('video_jobs')
      .insert({
        user_id: userId,
        status: 'pending',
        metadata: {
          filename: fileName,
          filesize: fileSize
        },
        upload_path: uploadPath
      })
      .select()
      .single();

    if (error) throw error;
    return job.id;
  };

  const uploadVideo = async (file: File): Promise<string> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Authentication required');

    const userId = session.user.id;
    const fileId = crypto.randomUUID();
    const uploadPath = `${userId}/${fileId}`;
    let jobId: string;

    try {
      // Create video job
      jobId = await createVideoJob(file.name, file.size, uploadPath, userId);

      // Split file into chunks
      const chunks: Blob[] = [];
      let offset = 0;
      while (offset < file.size) {
        chunks.push(file.slice(offset, offset + CHUNK_SIZE));
        offset += CHUNK_SIZE;
      }

      // Upload chunks
      for (let i = 0; i < chunks.length; i++) {
        const chunkPath = `${uploadPath}/chunk_${i}`;
        await uploadChunk(chunks[i], chunkPath);
        setUploadProgress((i + 1) / chunks.length * 100);
      }

      // Trigger processing queue
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

      return jobId;
    } catch (error) {
      // Cleanup on error
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