import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from '../LoadingSpinner/LoadingSpinner';
import { FileUpload } from '../FileUpload/FileUpload';
import FileUploadProgress from '../FileUploadProgress';
import { useVideoUpload } from '@/hooks/useVideoUpload';

interface FileProcessorProps {
  onTranscriptionComplete: (text: string) => void;
}

export const FileProcessor = ({ onTranscriptionComplete }: FileProcessorProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    bytesUploaded: 0,
    totalBytes: 0,
    percentage: 0,
    currentChunk: 0,
    totalChunks: 1,
    status: ''
  });
  const { toast } = useToast();
  const { uploadVideo } = useVideoUpload();

  const handleFileUpload = async (file: File) => {
    try {
      console.log('Starting file upload:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      setIsLoading(true);
      setUploadProgress({
        bytesUploaded: 0,
        totalBytes: file.size,
        percentage: 0,
        currentChunk: 0,
        totalChunks: 1,
        status: 'アップロード準備中...'
      });

      // Check file size
      const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('ファイルサイズが大きすぎます（最大100MB）');
      }

      // Validate file type
      const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/mp4', 'video/mp4', 'video/webm'];
      if (!validTypes.includes(file.type)) {
        throw new Error('対応していないファイル形式です。MP3、WAV、MP4、WebMファイルのみ対応しています。');
      }

      setUploadProgress(prev => ({
        ...prev,
        status: 'ファイルをアップロード中...'
      }));

      console.log('Uploading file to Supabase storage...');
      const jobId = await uploadVideo(file);
      
      if (!jobId) {
        throw new Error('アップロードに失敗しました');
      }

      console.log('File uploaded successfully, job ID:', jobId);

      // Poll for job completion
      const checkJobStatus = async () => {
        console.log('Checking job status for ID:', jobId);
        
        const { data: job, error: jobError } = await supabase
          .from('video_jobs')
          .select('*')
          .eq('id', jobId)
          .single();

        if (jobError) {
          console.error('Error checking job status:', jobError);
          throw jobError;
        }

        console.log('Job status:', job.status);

        if (job.status === 'completed') {
          if (job.output_path) {
            onTranscriptionComplete(job.output_path);
            toast({
              title: "文字起こし完了",
              description: "音声の文字起こしが完了しました。",
            });
          }
          return true;
        } else if (job.status === 'failed') {
          throw new Error(job.error || 'ファイルの処理に失敗しました');
        }

        return false;
      };

      // Poll every 5 seconds until the job is complete
      const pollInterval = setInterval(async () => {
        try {
          const isComplete = await checkJobStatus();
          if (isComplete) {
            console.log('Job completed successfully');
            clearInterval(pollInterval);
            setIsLoading(false);
          }
        } catch (error) {
          console.error('Error in job status polling:', error);
          clearInterval(pollInterval);
          throw error;
        }
      }, 5000);

    } catch (error) {
      console.error('Error in handleFileUpload:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'ファイルのアップロード中にエラーが発生しました';
      
      toast({
        variant: "destructive",
        title: "エラー",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
      setUploadProgress(prev => ({
        ...prev,
        status: ''
      }));
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <FileUpload
        onFileSelect={handleFileUpload}
        accept="audio/*,video/*"
        disabled={isLoading}
      />

      {isLoading && (
        <div className="mt-4">
          <LoadingSpinner
            message={uploadProgress.status || "処理中..."}
            size="md"
          />
          <FileUploadProgress progress={uploadProgress} />
        </div>
      )}
    </div>
  );
};