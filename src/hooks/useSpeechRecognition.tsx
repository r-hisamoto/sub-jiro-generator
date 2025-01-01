import { useState } from "react";
import { pipeline } from "@huggingface/transformers";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const MODEL_ID = "onnx-community/whisper-small-ja";

// Configure environment
const config = {
  backendConfigs: {
    webgl: { numThreads: 4 },
    wasm: { numThreads: 4 },
    webgpu: { numThreads: 4 }
  },
  useCache: true,
  cacheDir: "./models",
  allowRemoteModels: true
};

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
        {
          device,
          revision: "main",
          quantized: device === "cpu",
          progressCallback: (progress: number) => {
            console.log(`Model loading progress: ${progress * 100}%`);
          },
          config: {
            useCache: true,
            cacheDir: "./models",
            allowRemoteModels: true
          },
          fetchOptions: {
            headers: {
              Authorization: `Bearer ${data.secret}`
            }
          },
          // Whisper specific options
          chunkLength: 30,
          strideLength: 5,
          language: "ja",
          task: "transcribe",
          returnTimestamps: true,
          timestampGranularity: "word"
        }
      ).catch((error) => {
        console.error('Failed to initialize pipeline:', error);
        // WebGPU初期化失敗時はCPUにフォールバック
        return pipeline(
          "automatic-speech-recognition",
          MODEL_ID,
          {
            device: "cpu",
            revision: "main",
            quantized: true,
            progressCallback: (progress: number) => {
              console.log(`Model loading progress (CPU): ${progress * 100}%`);
            },
            config: {
              useCache: true,
              cacheDir: "./models",
              allowRemoteModels: true
            },
            fetchOptions: {
              headers: {
                Authorization: `Bearer ${data.secret}`
              }
            }
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