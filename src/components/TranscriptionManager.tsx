import React, { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TranscriptionManagerProps {
  onTranscriptionComplete?: (text: string) => void;
}

const TranscriptionManager: React.FC<TranscriptionManagerProps> = ({ onTranscriptionComplete }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  const initializeServices = async () => {
    try {
      // Hugging Face APIトークンの取得
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

      // APIトークンの設定
      if (typeof window !== 'undefined') {
        window.HUGGING_FACE_ACCESS_TOKEN = secret;
      }

      setIsInitialized(true);
      console.log('Transcription service initialized successfully');
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

  if (!isInitialized) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-md">
        音声解析サービスが初期化されていません
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            onClick={() => {
              // Implement transcription logic here
              onTranscriptionComplete?.("Sample transcription text");
            }}
          >
            音声解析開始
          </button>
          <span className="text-sm text-gray-500">
            音声ファイルをアップロードして解析を開始します
          </span>
        </div>
      </div>
    </div>
  );
};

export default TranscriptionManager;