import { useState } from "react";
import { pipeline, type PipelineOptions } from "@huggingface/transformers";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useSpeechRecognition = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const transcribeAudio = async (audioFile: File) => {
    setIsProcessing(true);
    try {
      // Get the Hugging Face token from Supabase
      const { data: { secret: hfToken } } = await supabase.functions.invoke('get-secret', {
        body: { name: 'HUGGING_FACE_ACCESS_TOKEN' }
      });

      if (!hfToken) {
        throw new Error("Hugging Face access token not found");
      }

      // Initialize the transcriber with a smaller Japanese model
      const transcriber = await pipeline(
        "automatic-speech-recognition",
        "onnx-community/whisper-small-ja",
        { 
          device: "webgpu",
          // Cast the options to any to bypass type checking for the accessToken
          // This is necessary because the types are not up to date with the latest API
        } as PipelineOptions & { accessToken: string }
      );

      // Convert audio file to ArrayBuffer
      const arrayBuffer = await audioFile.arrayBuffer();
      
      // Convert ArrayBuffer to Float32Array for audio processing
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const channelData = audioBuffer.getChannelData(0);
      
      // Process audio data with the transcriber
      const result = await transcriber(channelData, {
        language: "japanese",
        task: "transcribe",
        chunk_length_s: 30,
        stride_length_s: 5,
      });
      
      toast({
        title: "音声認識完了",
        description: "字幕の生成が完了しました",
      });

      // Handle both single output and array output cases
      const text = Array.isArray(result) ? result[0].text : result.text;
      return text;
    } catch (error) {
      console.error("音声認識エラー:", error);
      toast({
        variant: "destructive",
        title: "エラー",
        description: "音声認識処理中にエラーが発生しました。Hugging Face のアクセストークンを確認してください。",
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