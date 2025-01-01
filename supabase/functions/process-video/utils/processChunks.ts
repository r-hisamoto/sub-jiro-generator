import { concat } from "https://deno.land/std@0.168.0/bytes/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { streamChunks } from "./streamChunks.ts";

const PROCESSING_CHUNK_SIZE = 5 * 1024 * 1024; // Reduced to 5MB for better memory management

interface ProcessingState {
  processedSize: number;
  currentBuffer: Uint8Array[];
  currentBufferSize: number;
}

export async function processChunks(
  supabase: ReturnType<typeof createClient>,
  uploadPath: string,
  totalChunks: number,
  fileExt: string
): Promise<string> {
  console.log('Starting chunk processing');
  const state: ProcessingState = {
    processedSize: 0,
    currentBuffer: [],
    currentBufferSize: 0
  };

  const finalPath = `${uploadPath}.${fileExt}`;
  let partIndex = 0;

  try {
    for await (const chunk of streamChunks(supabase, uploadPath, totalChunks)) {
      state.currentBuffer.push(chunk);
      state.currentBufferSize += chunk.byteLength;

      if (state.currentBufferSize >= PROCESSING_CHUNK_SIZE) {
        console.log(`Processing buffer part ${partIndex}`);
        const buffer = concat(...state.currentBuffer);
        
        const partPath = `${finalPath}.part${partIndex}`;
        const { error: uploadError } = await supabase
          .storage
          .from('videos')
          .upload(partPath, buffer, {
            contentType: 'application/octet-stream',
            upsert: true
          });

        if (uploadError) {
          console.error(`Error uploading part ${partIndex}:`, uploadError);
          throw uploadError;
        }

        state.processedSize += buffer.byteLength;
        state.currentBuffer = [];
        state.currentBufferSize = 0;
        partIndex++;
      }
    }

    if (state.currentBuffer.length > 0) {
      console.log('Processing remaining buffer');
      const buffer = concat(...state.currentBuffer);
      const partPath = `${finalPath}.part${partIndex}`;
      
      const { error: uploadError } = await supabase
        .storage
        .from('videos')
        .upload(partPath, buffer, {
          contentType: 'application/octet-stream',
          upsert: true
        });

      if (uploadError) {
        console.error('Error uploading final part:', uploadError);
        throw uploadError;
      }
      
      partIndex++;
    }

    return finalPath;
  } catch (error) {
    console.error('Error in processChunks:', error);
    throw error;
  }
}