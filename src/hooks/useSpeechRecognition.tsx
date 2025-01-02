import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useSpeechRecognition = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const transcribeAudio = async (file: File): Promise<string | null> => {
    try {
      setIsProcessing(true);
      
      const formData = new FormData();
      formData.append('audio', file);
      formData.append('model', 'whisper-1');
      formData.append('language', 'ja');

      const { data: { publicUrl } } = supabase.storage
        .from('temp-chunks')
        .getPublicUrl('audio-temp.mp3');

      const response = await fetch('/functions/v1/transcribe-whisper', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Transcription failed: ${error}`);
      }

      const { text } = await response.json();
      return text;
    } catch (error) {
      console.error('Transcription error:', error);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  return { transcribeAudio, isProcessing };
};