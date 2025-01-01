import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { processChunks } from "./utils/processChunks.ts";
import { cleanupTempChunks } from "./utils/cleanup.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
      const finalPath = await processChunks(
        supabase,
        baseFileName,
        totalChunks,
        fileExt
      );

      console.log('Starting cleanup process');
      await cleanupTempChunks(supabase, baseFileName, totalChunks);

      console.log('Saving video parts information');
      const { error: dbError } = await supabase
        .from('video_parts')
        .insert({
          file_path: finalPath,
          total_parts: Math.ceil(metadata.size / (5 * 1024 * 1024)),
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
            totalParts: Math.ceil(metadata.size / (5 * 1024 * 1024))
          }
        });

      if (functionError) {
        console.error('Error triggering merge process:', functionError);
        throw functionError;
      }

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