import { useState } from "react";
import { pipeline } from "@huggingface/transformers";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useSpeechRecognition = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const transcribeAudio = async (file: File): Promise<string | null> => {
    try {
      setIsProcessing(true);
      console.log('Starting transcription with Hugging Face Whisper');

      // Get Hugging Face token from Supabase Edge Function
      const { data: { token }, error: tokenError } = await supabase.functions.invoke('get-secret', {
        body: { key: 'HUGGING_FACE_ACCESS_TOKEN' }
      });

      if (tokenError) {
        console.error('Failed to get Hugging Face token:', tokenError);
        throw new Error('Failed to get Hugging Face token');
      }

      if (!token) {
        console.error('No Hugging Face token found');
        throw new Error('Hugging Face token not configured');
      }

      // Use a model that has ONNX files available
      const transcriber = await pipeline(
        "automatic-speech-recognition",
        "onnx-community/whisper-tiny.ja",
        { 
          device: "webgpu",
          chunkLength: 30,
          strideLength: 5,
          language: "ja",
          task: "transcribe",
          returnTimestamps: true,
          quantized: true,
          fetchOptions: {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        }
      );

      const audioUrl = URL.createObjectURL(file);
      
      console.log('Processing audio file:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      const output = await transcriber(audioUrl);
      console.log('Transcription completed:', output);

      URL.revokeObjectURL(audioUrl);

      return output.text || null;
    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        variant: "destructive",
        title: "エラー",
        description: error instanceof Error ? error.message : "音声認識中にエラーが発生しました。",
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return { transcribeAudio, isProcessing };
};