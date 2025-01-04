import { useState } from "react";
import { pipeline } from "@huggingface/transformers";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useSpeechRecognition = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1 second

  const getHuggingFaceToken = async () => {
    const { data: { token }, error } = await supabase.functions.invoke('get-secret', {
      body: { key: 'HUGGING_FACE_ACCESS_TOKEN' }
    });

    if (error || !token) {
      console.error('Failed to get Hugging Face token:', error);
      throw new Error('Hugging Face token not configured');
    }

    return token;
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const uploadChunkWithRetry = async (
    chunk: Blob,
    chunkPath: string,
    retryCount = 0
  ): Promise<string> => {
    try {
      const { data, error: uploadError } = await supabase.storage
        .from('temp-chunks')
        .upload(chunkPath, chunk, {
          contentType: 'application/octet-stream',
          upsert: true,
          cacheControl: '3600'
        });

      if (uploadError) throw uploadError;

      const { data: { signedUrl }, error: signedUrlError } = await supabase.storage
        .from('temp-chunks')
        .createSignedUrl(chunkPath, 3600);

      if (signedUrlError) throw signedUrlError;

      return signedUrl;
    } catch (error) {
      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying chunk upload (${retryCount + 1}/${MAX_RETRIES})...`);
        await delay(RETRY_DELAY * (retryCount + 1));
        return uploadChunkWithRetry(chunk, chunkPath, retryCount + 1);
      }
      throw error;
    }
  };

  const transcribeAudio = async (file: File): Promise<string | null> => {
    try {
      setIsProcessing(true);
      console.log('Starting transcription process');

      const token = await getHuggingFaceToken();
      
      // Initialize transcriber with proper configuration
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
          cache_dir: './.cache',
          fetchOptions: {
            headers: {
              'Authorization': `Bearer ${token}`,
              'User-Agent': 'Mozilla/5.0'
            }
          }
        }
      );

      // Split file into chunks
      const chunks: Blob[] = [];
      let offset = 0;
      while (offset < file.size) {
        chunks.push(file.slice(offset, offset + CHUNK_SIZE));
        offset += CHUNK_SIZE;
      }

      console.log(`File split into ${chunks.length} chunks`);

      // Process chunks sequentially to avoid memory issues
      const results = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkPath = `${file.name.replace(/[^\x00-\x7F]/g, '')}_${i}`;
        
        try {
          const signedUrl = await uploadChunkWithRetry(chunk, chunkPath);
          const result = await transcriber(signedUrl);
          results.push(result.text);

          // Clean up chunk after processing
          await supabase.storage
            .from('temp-chunks')
            .remove([chunkPath]);
        } catch (error) {
          console.error(`Error processing chunk ${i}:`, error);
          toast({
            variant: "destructive",
            title: "エラー",
            description: `チャンク ${i + 1} の処理中にエラーが発生しました。`,
          });
        }
      }

      return results.join(' ');
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