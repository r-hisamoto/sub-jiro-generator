/// <reference types="@webgpu/types" />

interface Navigator {
  gpu: GPU;
}

declare module "@xenova/transformers" {
  export interface PretrainedModelOptions {
    device?: "cpu" | "webgpu" | "wasm";
    revision?: string;
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