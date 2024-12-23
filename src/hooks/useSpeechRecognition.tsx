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

      const result = await transcriber(audioFile);
      
      toast({
        title: "音声認識完了",
        description: "字幕の生成が完了しました",
      });

      return result.text;
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