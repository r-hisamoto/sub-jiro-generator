import React, { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { FileUpload } from './FileUpload';
import { Progress } from './ui/progress';
import { Card } from './ui/card';
import { LoadingSpinner } from './LoadingSpinner/LoadingSpinner';

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
      <Card className="flex flex-col items-center justify-center min-h-[400px] p-8 space-y-4">
        <div className="text-xl font-semibold text-gray-700 text-center">
          音声解析サービスが初期化されていません
        </div>
        <Button 
          onClick={initializeServices}
          className="mt-4"
        >
          再試行
        </Button>
      </Card>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 text-center">
          音声文字起こし
        </h1>
        
        <div className="w-full max-w-2xl mx-auto">
          <FileUpload
            onFileSelect={handleFileSelect}
            accept="audio/*,video/*"
            className="w-full"
          />
        </div>

        {isProcessing && (
          <div className="w-full max-w-2xl mx-auto space-y-4">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-gray-600 text-center">
              処理中... {progress}%
            </p>
            <LoadingSpinner 
              message="音声を解析しています..."
              progress={progress}
              showPercentage={true}
              size="md"
            />
          </div>
        )}
      </Card>
    </div>
  );
};