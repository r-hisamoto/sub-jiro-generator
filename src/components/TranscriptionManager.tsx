import React, { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { FileUpload } from './FileUpload';
import { Progress } from './ui/progress';

export const TranscriptionManager: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const initializeServices = async () => {
    try {
      const { data: { secret }, error } = await supabase.functions.invoke('get-secret', {
        body: { key: 'HUGGING_FACE_ACCESS_TOKEN' }
      });

      if (error || !secret) {
        console.error('Failed to get Hugging Face API token:', error);
        toast({
          title: 'エラー',
          description: '音声解析サービスの初期化に失敗しました',
          variant: 'destructive',
        });
        return;
      }

      setIsInitialized(true);
    } catch (error) {
      console.error('サービスの初期化エラー:', error);
      toast({
        title: 'エラー',
        description: '音声解析サービスの初期化に失敗しました',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    initializeServices();
  }, []);

  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    setProgress(0);
    
    try {
      // Simulate progress for now
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 500);

      toast({
        title: "処理開始",
        description: "音声ファイルの解析を開始しました",
      });

      // Clear interval after simulated processing
      setTimeout(() => {
        clearInterval(interval);
        setIsProcessing(false);
        setProgress(100);
        
        toast({
          title: "処理完了",
          description: "音声ファイルの解析が完了しました",
        });
      }, 5000);

    } catch (error) {
      setIsProcessing(false);
      toast({
        variant: "destructive",
        title: "エラー",
        description: "音声ファイルの処理中にエラーが発生しました",
      });
    }
  };

  if (!isInitialized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-xl font-semibold text-gray-700">
          音声解析サービスが初期化されていません
        </div>
        <Button onClick={initializeServices}>
          再試行
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col items-center justify-center space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">
          音声文字起こし
        </h1>
        
        <div className="w-full max-w-2xl">
          <FileUpload
            onFileSelect={handleFileSelect}
            accept="audio/*,video/*"
            maxSize={25 * 1024 * 1024} // 25MB
          />
        </div>

        {isProcessing && (
          <div className="w-full max-w-2xl space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-gray-600 text-center">
              処理中... {progress}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
};