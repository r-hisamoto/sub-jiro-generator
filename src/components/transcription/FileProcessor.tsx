import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from '../LoadingSpinner/LoadingSpinner';
import { FileUpload } from '../FileUpload/FileUpload';
import FileUploadProgress from '../FileUploadProgress';

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

  const handleFileUpload = async (file: File) => {
    try {
      setIsLoading(true);
      setUploadProgress({
        bytesUploaded: 0,
        totalBytes: file.size,
        percentage: 0,
        currentChunk: 0,
        totalChunks: 1,
        status: 'アップロード準備中...'
      });

      console.log('Selected file:', file.name, file.type, file.size);

      // Create form data
      const formData = new FormData();
      formData.append('file', file);

      console.log('Sending file to transcribe function');
      
      setUploadProgress(prev => ({
        ...prev,
        status: 'ファイルをアップロード中...'
      }));

      const { data, error } = await supabase.functions.invoke('transcribe', {
        body: formData,
        responseType: 'json'
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