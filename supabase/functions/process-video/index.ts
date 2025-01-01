import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { baseFileName, fileExt, totalChunks, metadata } = await req.json();
    const finalFileName = `${baseFileName}.${fileExt}`;

    console.log('Processing video chunks:', { baseFileName, totalChunks, metadata });

    // Download and combine chunks
    const combinedChunks: Uint8Array[] = [];
    let totalSize = 0;

    for (let i = 0; i < totalChunks; i++) {
      const chunkFileName = `${baseFileName}_${i}`;
      console.log(`Downloading chunk ${i + 1}/${totalChunks}`);
      
      const { data: chunkData, error: downloadError } = await supabase
        .storage
        .from('temp-chunks')
        .download(chunkFileName);

      if (downloadError) {
        console.error(`Error downloading chunk ${i}:`, downloadError);
        throw downloadError;
      }

      const chunk = new Uint8Array(await chunkData.arrayBuffer());
      combinedChunks.push(chunk);
      totalSize += chunk.length;
    }

    console.log('All chunks downloaded, combining...');

    // Combine chunks
    const combinedFile = new Uint8Array(totalSize);
    let offset = 0;
    
    for (const chunk of combinedChunks) {
      combinedFile.set(chunk, offset);
      offset += chunk.length;
    }

    console.log('Uploading combined file...');

    // Upload combined file
    const { error: uploadError } = await supabase
      .storage
      .from('videos')
      .upload(finalFileName, combinedFile, {
        contentType: metadata.contentType,
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading combined file:', uploadError);
      throw uploadError;
    }

    console.log('Cleaning up temporary chunks...');

    // Cleanup temporary chunks
    const cleanupPromises = Array(totalChunks)
      .fill(0)
      .map((_, i) => 
        supabase.storage
          .from('temp-chunks')
          .remove([`${baseFileName}_${i}`])
          .catch(error => console.warn('Cleanup error for chunk', i, error))
      );
    
    await Promise.all(cleanupPromises);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('videos')
      .getPublicUrl(finalFileName);

    console.log('Processing completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        publicUrl: urlData.publicUrl
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