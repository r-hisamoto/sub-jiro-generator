import { useState } from "react";
import { pipeline, env } from "@huggingface/transformers";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Configure environment
env.allowLocalModels = false;
env.backends.onnx.wasm.numThreads = 4;

const MODEL_ID = "onnx-community/whisper-small-ja";

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

      // Initialize transcriber with improved configuration
      const transcriber = await pipeline(
        "automatic-speech-recognition",
        MODEL_ID,
        {
          device,
          revision: "main",
          quantized: device === "cpu",
          cache_dir: "./models",
          local_files_only: false,
          progress_callback: (progress: number) => {
            console.log(`Model loading progress: ${progress * 100}%`);
          },
          fetchOptions: {
            headers: {
              Authorization: `Bearer ${data.secret}`
            }
          }
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
            cache_dir: "./models",
            local_files_only: false,
            progress_callback: (progress: number) => {
              console.log(`Model loading progress (CPU): ${progress * 100}%`);
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
        chunk_length_s: 30,
        stride_length_s: 5,
        return_timestamps: true,
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