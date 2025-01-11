import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from '../LoadingSpinner/LoadingSpinner';
import { FileUpload } from '../FileUpload/FileUpload';

interface FileProcessorProps {
  onTranscriptionComplete: (text: string) => void;
}

export const FileProcessor = ({ onTranscriptionComplete }: FileProcessorProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const processBase64Chunks = (arrayBuffer: ArrayBuffer, chunkSize = 32768) => {
    const view = new Uint8Array(arrayBuffer);
    const chunks: string[] = [];
    
    for (let i = 0; i < view.length; i += chunkSize) {
      const chunk = view.slice(i, i + chunkSize);
      const base64Chunk = btoa(
        chunk.reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      chunks.push(base64Chunk);
      
      const currentProgress = Math.min(((i + chunkSize) / view.length) * 100, 100);
      setProgress(currentProgress);
    }
    
    return chunks.join('');
  };

  const handleFileUpload = async (file: File) => {
    try {
      setIsLoading(true);
      setProgress(0);

      const MAX_FILE_SIZE = 25 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('ファイルサイズが大きすぎます（最大25MB）');
      }

      if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
        throw new Error('対応していないファイル形式です');
      }

      console.log('Starting file upload:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      const arrayBuffer = await file.arrayBuffer();
      const base64Audio = processBase64Chunks(arrayBuffer);

      console.log('File converted to base64, starting transcription');

      const { data, error: functionError } = await supabase.functions.invoke('transcribe', {
        body: { audio: base64Audio }
      });

      if (functionError) {
        console.error('Transcription error:', functionError);
        throw new Error(`文字起こしに失敗しました: ${functionError.message}`);
      }

      if (!data?.text) {
        throw new Error('文字起こし結果が取得できませんでした');
      }

      toast({
        title: "文字起こし完了",
        description: "音声の文字起こしが完了しました。",
      });

      onTranscriptionComplete(data.text);

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