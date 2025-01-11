import { useState, useEffect } from 'react';
import { FileUpload } from './FileUpload/FileUpload';
import { LoadingSpinner } from './LoadingSpinner/LoadingSpinner';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const TranscriptionManager = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    try {
      setIsLoading(true);
      setError(null);
      setProgress(0);

      // Validate file size
      const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('ファイルサイズが大きすぎます（最大25MB）');
      }

      // Validate file type
      if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
        throw new Error('対応していないファイル形式です');
      }

      console.log('Starting file upload:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      // Convert file to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Convert ArrayBuffer to Base64 in chunks
      const chunkSize = 1024 * 1024; // 1MB chunks
      const chunks: string[] = [];
      const view = new Uint8Array(arrayBuffer);
      
      for (let i = 0; i < view.length; i += chunkSize) {
        const chunk = view.slice(i, i + chunkSize);
        const base64Chunk = btoa(
          chunk.reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        chunks.push(base64Chunk);
        
        // Update progress
        const progress = Math.min(((i + chunkSize) / view.length) * 100, 100);
        setProgress(progress);
      }

      // Combine chunks
      const base64Audio = chunks.join('');
      
      console.log('File converted to base64, starting transcription');

      // Call Supabase Edge Function
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

      return data.text;

    } catch (error) {
      console.error('Error in handleFileUpload:', error);
      const errorMessage = error instanceof Error ? error.message : '予期せぬエラーが発生しました';
      setError(errorMessage);
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
    <div className="flex flex-col gap-4 p-4">
      <div className="w-full max-w-xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">音声/動画ファイルをアップロード</h2>
        
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

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-600 rounded">
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};