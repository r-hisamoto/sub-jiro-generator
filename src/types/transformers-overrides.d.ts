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
    credentials?: {
      accessToken: string;
    };
  }

  export interface TranscriberOptions extends PretrainedModelOptions {
    chunkLength?: number;
    strideLength?: number;
    language?: string;
    task?: "transcribe" | "translate";
    returnTimestamps?: boolean;
    timestampGranularity?: "word" | "segment";
  }

  export function pipeline<T = any>(
    task: string,
    model: string,
    options?: TranscriberOptions
  ): Promise<T>;
}

// Export the TranscriberOptions type so it can be imported elsewhere
export type { TranscriberOptions };