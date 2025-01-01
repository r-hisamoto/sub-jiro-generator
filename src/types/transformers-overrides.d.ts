declare module "@huggingface/transformers" {
  export interface Environment {
    backendConfigs: {
      webgl: { numThreads?: number };
      wasm: { numThreads?: number };
      webgpu: { numThreads?: number };
    };
    useCache: boolean;
    cacheDir?: string;
    allowRemoteModels: boolean;
  }

  export interface PretrainedModelOptions {
    device?: "cpu" | "webgl" | "webgpu" | "wasm";
    revision?: string;
    quantized?: boolean;
    progressCallback?: (progress: number) => void;
    config?: {
      useCache?: boolean;
      cacheDir?: string;
      allowRemoteModels?: boolean;
    };
    fetchOptions?: {
      headers?: Record<string, string>;
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

  export const environment: Environment;
}