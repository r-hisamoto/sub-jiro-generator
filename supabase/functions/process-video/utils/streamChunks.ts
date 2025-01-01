import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function* streamChunks(
  supabase: ReturnType<typeof createClient>,
  uploadPath: string,
  totalChunks: number
): AsyncGenerator<Uint8Array> {
  for (let i = 0; i < totalChunks; i++) {
    console.log(`Downloading chunk ${i + 1}/${totalChunks}`);
    const { data, error } = await supabase
      .storage
      .from('temp-chunks')
      .download(`${uploadPath}_${i}`);

    if (error) {
      console.error(`Error downloading chunk ${i}:`, error);
      throw error;
    }

    const chunk = new Uint8Array(await data.arrayBuffer());
    yield chunk;
  }
}