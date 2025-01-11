import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from '../LoadingSpinner/LoadingSpinner';
import { FileUpload } from '../FileUpload/FileUpload';
import { CHUNK_SIZE } from '@/config/uploadConfig';
import { divideFileIntoChunks, uploadChunk, createVideoJob } from '@/utils/uploadUtils';

interface FileProcessorProps {
  onTranscriptionComplete: (text: string) => void;
}

export const FileProcessor = ({ onTranscriptionComplete }: FileProcessorProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    try {
      setIsLoading(true);
      setProgress(0);

      console.log('Selected file:', file.name, file.type, file.size);

      // File type validation
      if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
        throw new Error('対応していないファイル形式です');
      }

      // For files larger than 100MB, use chunked upload
      if (file.size > 100 * 1024 * 1024) {
        const chunks = divideFileIntoChunks(file, CHUNK_SIZE);
        const uploadPath = `${crypto.randomUUID()}-${file.name.replace(/[^\x00-\x7F]/g, '')}`;
        
        // Create upload job
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('ユーザー認証が必要です');
        
        const jobId = await createVideoJob(file.name, file.size, uploadPath, user.id);

        // Upload chunks
        for (let i = 0; i < chunks.length; i++) {
          const chunkPath = `${uploadPath}_chunk_${i}`;
          await uploadChunk(chunks[i], chunkPath);
          setProgress((i + 1) / chunks.length * 100);
        }

        // Start transcription
        const { data, error } = await supabase.functions.invoke('transcribe', {
          body: { jobId, uploadPath }
        });

        if (error) throw error;
        if (data?.text) {
          onTranscriptionComplete(data.text);
        }

      } else {
        // For smaller files, use direct upload
        const formData = new FormData();
        formData.append('file', file);

        const { data, error } = await supabase.functions.invoke('transcribe', {
          body: formData
        });

        if (error) throw error;
        if (data?.text) {
          onTranscriptionComplete(data.text);
        }
      }

      toast({
        title: "アップロード完了",
        description: "ファイルの処理が完了しました。",
      });

    } catch (error) {
      console.error('Error in handleFileUpload:', error);
      const errorMessage = error instanceof Error ? error.message : '予期せぬエラーが発生しました';
      toast({
        variant: "destructive",
        title: "エラー",
        description: errorMessage,
      });
      throw error;
    } finally {
      setIsLoading(false);
      setProgress(0);
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
            message="処理中..."
            progress={progress}
            showPercentage
          />
        </div>
      )}
    </div>
  );
};