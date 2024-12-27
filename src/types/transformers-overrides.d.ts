declare module "@huggingface/transformers" {
  export interface PretrainedModelOptions {
    fetchOptions?: {
      headers: {
        Authorization: string;
      };
    };
  }
}