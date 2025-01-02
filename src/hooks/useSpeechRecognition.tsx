import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useSpeechRecognition = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const transcribeAudio = async (audioFile: File) => {
    setIsProcessing(true);
    try {
      console.log('Getting OpenAI API key...');
      const { data: { token }, error: secretError } = await supabase.functions.invoke('get-secret', {
        body: { key: 'OPENAI_API_KEY' }
      });

      if (secretError || !token) {
        console.error('Failed to get OpenAI API key:', secretError);
        throw new Error('OpenAI APIキーの取得に失敗しました');
      }

      console.log('Converting audio file...');
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('model', 'whisper-1');
      formData.append('language', 'ja');
      formData.append('response_format', 'json');

      console.log('Sending request to OpenAI Whisper API...');
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Whisper API error:', error);
        throw new Error('音声認識に失敗しました');
      }

      const result = await response.json();
      console.log('Transcription completed successfully');
      
      toast({
        title: "音声認識完了",
        description: "テキストの生成が完了しました",
      });

      return result.text;
    } catch (error) {
      console.error("音声認識エラー:", error);
      toast({
        variant: "destructive",
        title: "エラー",
        description: error instanceof Error ? error.message : "音声認識処理中にエラーが発生しました",
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    transcribeAudio,
    isProcessing,
  };
};