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

      // Create form data
      const formData = new FormData();
      formData.append('file', file);

      console.log('Sending file to transcribe function');

      const { data, error } = await supabase.functions.invoke('transcribe', {
        body: formData
      });

      if (error) {
        console.error('Transcribe function error:', error);
        throw error;
      }

      if (data?.text) {
        console.log('Transcription successful');
        onTranscriptionComplete(data.text);
        
        toast({
          title: "文字起こし完了",
          description: "音声の文字起こしが完了しました。",
        });
      } else {
        throw new Error('文字起こし結果が不正です');
      }

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