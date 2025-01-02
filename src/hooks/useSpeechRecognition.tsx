import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useSpeechRecognition = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const transcribeAudio = async (file: File): Promise<string | null> => {
    try {
      setIsProcessing(true);
      
      // ファイルサイズの制限を追加（25MB）
      if (file.size > 25 * 1024 * 1024) {
        throw new Error('ファイルサイズが大きすぎます（上限: 25MB）');
      }
      
      const formData = new FormData();
      formData.append('audio', file);
      formData.append('model', 'whisper-1');
      formData.append('language', 'ja');

      const { data, error } = await supabase.functions.invoke('transcribe-whisper', {
        body: formData,
      });

      if (error) {
        console.error('Transcription error:', error);
        throw new Error('音声認識に失敗しました');
      }

      return data?.text || null;
    } catch (error) {
      console.error('Transcription error:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return { transcribeAudio, isProcessing };
};