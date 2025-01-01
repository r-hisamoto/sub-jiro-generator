import { useState } from "react";
import { pipeline } from "@huggingface/transformers";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const MODEL_ID = "onnx-community/whisper-small-ja";

// Configure pipeline options
const getPipelineOptions = (token: string | undefined) => ({
  device: "webgpu",
  revision: "main",
  quantized: true,
  progressCallback: (progress: number) => {
    console.log(`Model loading progress: ${progress * 100}%`);
  },
  config: {
    useCache: true,
    allowRemoteModels: true
  },
  ...(token && {
    fetchOptions: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  }),
  // Whisper specific options
  chunkLength: 30,
  strideLength: 5,
  language: "ja",
  task: "transcribe",
  returnTimestamps: true,
  timestampGranularity: "word"
});

export const useSpeechRecognition = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const transcribeAudio = async (audioFile: File) => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-secret', {
        body: { name: 'HUGGING_FACE_ACCESS_TOKEN' }
      });

      if (error || !data?.secret) {
        console.error('Failed to get Hugging Face token:', error);
        throw new Error('Hugging Face APIトークンの取得に失敗しました。');
      }

      // WebGPUのサポートチェック
      const device = navigator.gpu ? "webgpu" : "cpu";
      console.log(`Using device: ${device}`);

      const transcriber = await pipeline(
        "automatic-speech-recognition",
        MODEL_ID,
        getPipelineOptions(data.secret)
      ).catch((error) => {
        console.error('Failed to initialize pipeline:', error);
        // WebGPU初期化失敗時はCPUにフォールバック
        return pipeline(
          "automatic-speech-recognition",
          MODEL_ID,
          {
            ...getPipelineOptions(data.secret),
            device: "cpu"
          }
        );
      });

      const arrayBuffer = await audioFile.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const channelData = audioBuffer.getChannelData(0);
      
      const result = await transcriber(channelData, {
        language: "japanese",
        task: "transcribe",
        chunkLength: 30,
        strideLength: 5,
        returnTimestamps: true,
      });
      
      toast({
        title: "音声認識完了",
        description: "字幕の生成が完了しました",
      });

      const text = Array.isArray(result) ? result[0].text : result.text;
      return text;
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