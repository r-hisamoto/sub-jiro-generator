import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function cleanupTempChunks(
  supabase: ReturnType<typeof createClient>,
  uploadPath: string,
  totalChunks: number
): Promise<void> {
  console.log('Starting cleanup of temporary chunks');
  const cleanupPromises = Array(totalChunks)
    .fill(0)
    .map((_, i) => 
      supabase.storage
        .from('temp-chunks')
        .remove([`${uploadPath}_${i}`])
        .catch(error => console.warn('Cleanup error for chunk', i, error))
    );
  
  await Promise.all(cleanupPromises);
  console.log('Cleanup completed');
}