import { useState } from "react";
import { pipeline } from "@huggingface/transformers";
import { toast } from "@/components/ui/use-toast";

export const useSpeechRecognition = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const transcribeAudio = async (file: File): Promise<string | null> => {
    try {
      setIsProcessing(true);
      console.log('Starting transcription with Hugging Face Whisper');

      // Create automatic speech recognition pipeline
      const transcriber = await pipeline(
        "automatic-speech-recognition",
        "openai/whisper-large-v3",
        { 
          device: "webgpu",
          chunkLength: 30,
          strideLength: 5,
          language: "ja",
          task: "transcribe",
          returnTimestamps: true
        }
      );

      // Convert File to URL for the transcriber
      const audioUrl = URL.createObjectURL(file);
      
      console.log('Processing audio file:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      // Transcribe audio
      const output = await transcriber(audioUrl);
      console.log('Transcription completed:', output);

      // Clean up the URL
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