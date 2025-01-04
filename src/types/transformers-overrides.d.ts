declare module "@huggingface/transformers" {
  export interface PretrainedModelOptions {
    device?: "cpu" | "webgl" | "webgpu" | "wasm";
    revision?: string;
    quantized?: boolean;
    progressCallback?: (progress: number) => void;
    config?: {
      useCache?: boolean;
      allowRemoteModels?: boolean;
    };
    fetchOptions?: {
      headers?: Record<string, string>;
    };
    cache_dir?: string;
    local_files_only?: boolean;
    model_file_name?: string;
    session_options?: any;
    dtype?: string;
  }

  export interface TranscriberOptions extends PretrainedModelOptions {
    chunkLength?: number;
    strideLength?: number;
    language?: string;
    task?: "transcribe" | "translate";
    returnTimestamps?: boolean;
    timestampGranularity?: "word" | "segment";
    quantized?: boolean;
  }

  export interface AutomaticSpeechRecognitionPipeline {
    (input: string | Blob, options?: { return_timestamps?: boolean }): Promise<{
      text: string;
      timestamps?: Array<[number, number]>;
    }>;
  }

  export function pipeline(
    task: "automatic-speech-recognition",
    model?: string,
    options?: TranscriberOptions
  ): Promise<AutomaticSpeechRecognitionPipeline>;

  export function pipeline<T = any>(
    task: string,
    model: string,
    options?: TranscriberOptions
  ): Promise<T>;
}

export type { TranscriberOptions, PretrainedModelOptions };