import { useState } from "react";
import { pipeline } from "@huggingface/transformers";
import { toast } from "@/components/ui/use-toast";

export const useSpeechRecognition = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const transcribeAudio = async (file: File): Promise<string | null> => {
    try {
      setIsProcessing(true);
      console.log('Starting transcription with Hugging Face Whisper');

      // 日本語モデルを使用
      const transcriber = await pipeline(
        "automatic-speech-recognition",
        "Xenova/whisper-small.ja",
        { 
          device: "webgpu",
          chunkLength: 30,
          strideLength: 5,
          language: "ja",
          task: "transcribe",
          returnTimestamps: true,
          quantized: true
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