import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    console.log('Merge video parts request received');
    const { filePath, totalParts } = await req.json();
    console.log('Merge parameters:', { filePath, totalParts });

    const combinedChunks: Uint8Array[] = [];
    let totalSize = 0;

    // Download all parts
    for (let i = 0; i < totalParts; i++) {
      console.log(`Downloading part ${i + 1}/${totalParts}`);
      const partPath = `${filePath}.part${i}`;
      const { data, error } = await supabase.storage
        .from('videos')
        .download(partPath);

      if (error) {
        console.error(`Error downloading part ${i}:`, error);
        throw error;
      }

      const chunk = new Uint8Array(await data.arrayBuffer());
      combinedChunks.push(chunk);
      totalSize += chunk.length;
    }

    // Combine all parts
    console.log('Combining video parts');
    const combinedFile = new Uint8Array(totalSize);
    let offset = 0;
    for (const chunk of combinedChunks) {
      combinedFile.set(chunk, offset);
      offset += chunk.length;
    }

    // Upload final file
    console.log('Uploading combined video file');
    const { error: uploadError } = await supabase
      .storage
      .from('videos')
      .upload(filePath, combinedFile, {
        contentType: 'video/mp4',
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading combined file:', uploadError);
      throw uploadError;
    }

    // Clean up parts
    console.log('Cleaning up video parts');
    const cleanupPromises = Array(totalParts)
      .fill(0)
      .map((_, i) => {
        const partPath = `${filePath}.part${i}`;
        return supabase.storage
          .from('videos')
          .remove([partPath])
          .catch(error => console.warn(`Error cleaning up part ${i}:`, error));
      });

    await Promise.all(cleanupPromises);

    // Update status
    console.log('Updating video parts status');
    const { error: updateError } = await supabase
      .from('video_parts')
      .update({ status: 'completed' })
      .eq('file_path', filePath);

    if (updateError) {
      console.error('Error updating video parts status:', updateError);
      throw updateError;
    }

    console.log('Merge process completed successfully');
    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Merge process error:', error);
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