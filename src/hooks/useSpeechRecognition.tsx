import { useState } from "react";
import { pipeline } from "@huggingface/transformers";
import { useToast } from "@/components/ui/use-toast";

export const useSpeechRecognition = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const transcribeAudio = async (audioFile: File) => {
    setIsProcessing(true);
    try {
      const transcriber = await pipeline(
        "automatic-speech-recognition",
        "onnx-community/whisper-tiny.en",
        { device: "webgpu" }
      );

      // Convert audio file to ArrayBuffer
      const arrayBuffer = await audioFile.arrayBuffer();
      
      // Convert ArrayBuffer to Float32Array for audio processing
      const audioData = new Float32Array(arrayBuffer);
      
      // Process audio data with the transcriber
      const result = await transcriber(audioData);
      
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
        title: "エラー",
        description: "音声認識処理中にエラーが発生しました",
        variant: "destructive",
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