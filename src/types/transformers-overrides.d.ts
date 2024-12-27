declare module "@huggingface/transformers" {
  export interface PretrainedModelOptions {
    device?: "cpu" | "webgpu" | "wasm";
    revision?: string;
    quantized?: boolean;
    fetchOptions?: {
      headers: {
        Authorization: string;
      };
    };
  }

  export function pipeline(
    task: string,
    model: string,
    options?: PretrainedModelOptions
  ): Promise<any>;
}