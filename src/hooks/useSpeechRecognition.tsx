import { useState } from "react";
import { pipeline } from "@huggingface/transformers";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TranscriberOptions {
  device: "cpu" | "webgl" | "webgpu" | "wasm";
  revision: string;
  quantized: boolean;
  progressCallback: (progress: number) => void;
  config: {
    model_type: string;
    is_encoder_decoder: boolean;
    max_position_embeddings: number;
    "transformers.js_config": {
      task: string;
    };
    normalized_config: boolean;
    useCache: boolean;
    allowRemoteModels: boolean;
  };
  fetchOptions?: {
    headers: {
      Authorization: string;
    };
  };
  chunkLength: number;
  strideLength: number;
  language: "ja";
  task: "transcribe" | "translate";
  returnTimestamps: boolean;
  timestampGranularity: "word" | "segment";
}

// Using a public model that's optimized for Japanese
const MODEL_ID = "Xenova/whisper-small.ja";

// Configure pipeline options
const getPipelineOptions = (token: string | undefined): TranscriberOptions => ({
  device: "webgpu",
  revision: "main",
  quantized: true,
  progressCallback: (progress: number) => {
    console.log(`Model loading progress: ${progress * 100}%`);
  },
  config: {
    model_type: "whisper",
    is_encoder_decoder: true,
    max_position_embeddings: 1500,
    "transformers.js_config": {
      task: "automatic-speech-recognition"
    },
    normalized_config: true,
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
      const device = navigator.gpu ? "webgpu" as const : "wasm" as const;
      console.log(`Using device: ${device}`);

      const transcriber = await pipeline(
        "automatic-speech-recognition",
        MODEL_ID,
        getPipelineOptions(data.secret)
      ).catch((error) => {
        console.error('Failed to initialize pipeline:', error);
        // WebGPU初期化失敗時はwasmにフォールバック
        return pipeline(
          "automatic-speech-recognition",
          MODEL_ID,
          {
            ...getPipelineOptions(data.secret),
            device: "wasm" as const
          }
        );
      });

      const arrayBuffer = await audioFile.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const channelData = audioBuffer.getChannelData(0);
      
      const result = await transcriber(channelData, {
        language: "ja",
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