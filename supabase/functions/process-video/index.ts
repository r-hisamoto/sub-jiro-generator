import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { concat } from "https://deno.land/std@0.168.0/bytes/mod.ts";

const PROCESSING_CHUNK_SIZE = 10 * 1024 * 1024; // 10MB processing chunks

interface ProcessingState {
  processedSize: number;
  currentBuffer: Uint8Array[];
  currentBufferSize: number;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function* streamChunks(
  supabase: any, 
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

async function processChunkStream(
  supabase: any,
  uploadPath: string,
  totalChunks: number,
  fileExt: string
): Promise<string> {
  console.log('Starting chunk stream processing');
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

    console.log('Saving video parts information');
    const { error: dbError } = await supabase
      .from('video_parts')
      .insert({
        file_path: finalPath,
        total_parts: partIndex,
        status: 'uploaded'
      });

    if (dbError) {
      console.error('Error saving video parts:', dbError);
      throw dbError;
    }

    console.log('Triggering merge process');
    const { error: functionError } = await supabase
      .functions.invoke('merge-video-parts', {
        body: {
          filePath: finalPath,
          totalParts: partIndex
        }
      });

    if (functionError) {
      console.error('Error triggering merge process:', functionError);
      throw functionError;
    }

    return finalPath;
  } catch (error) {
    console.error('Error in processChunkStream:', error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Processing video request received');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { baseFileName, fileExt, totalChunks, metadata } = await req.json();
    console.log('Request parameters:', { baseFileName, fileExt, totalChunks, metadata });

    try {
      const finalPath = await processChunkStream(
        supabase,
        baseFileName,
        totalChunks,
        fileExt
      );

      console.log('Cleaning up temporary chunks');
      const cleanupPromises = Array(totalChunks)
        .fill(0)
        .map((_, i) => 
          supabase.storage
            .from('temp-chunks')
            .remove([`${baseFileName}_${i}`])
            .catch(error => console.warn('Cleanup error for chunk', i, error))
        );
      
      await Promise.all(cleanupPromises);

      const { data: urlData } = supabase.storage
        .from('videos')
        .getPublicUrl(finalPath);

      console.log('Processing completed successfully');
      return new Response(
        JSON.stringify({
          success: true,
          publicUrl: urlData.publicUrl,
          status: 'processing'
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );

    } catch (error) {
      console.error('Processing error:', error);
      throw error;
    }

  } catch (error) {
    console.error('Request error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});