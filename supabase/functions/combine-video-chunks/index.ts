import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { filePath, totalChunks, fileName } = await req.json()
    console.log(`Starting to combine ${totalChunks} chunks for file: ${fileName}`)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Create a temporary array to store chunk data
    const chunks: Uint8Array[] = [];
    let totalSize = 0;

    // Download and process chunks sequentially
    for (let i = 0; i < totalChunks; i++) {
      console.log(`Processing chunk ${i + 1}/${totalChunks}`)
      const chunkPath = `${filePath}_part${i}`
      
      try {
        const { data: chunkData, error: downloadError } = await supabase.storage
          .from('videos')
          .download(chunkPath)

        if (downloadError) {
          throw new Error(`Failed to download chunk ${i}: ${downloadError.message}`)
        }

        const chunkArray = new Uint8Array(await chunkData.arrayBuffer())
        chunks.push(chunkArray)
        totalSize += chunkArray.length

        // Clean up the chunk immediately
        const { error: deleteError } = await supabase.storage
          .from('videos')
          .remove([chunkPath])

        if (deleteError) {
          console.warn(`Warning: Failed to delete chunk ${i}:`, deleteError)
        }

        console.log(`Successfully processed chunk ${i + 1}/${totalChunks}`)
      } catch (error) {
        console.error(`Error processing chunk ${i}:`, error)
        throw error
      }
    }

    // Combine all chunks into a single array
    console.log('Combining chunks into final file...')
    const finalBuffer = new Uint8Array(totalSize)
    let offset = 0
    for (const chunk of chunks) {
      finalBuffer.set(chunk, offset)
      offset += chunk.length
    }

    // Upload the combined file
    console.log('Uploading final combined file')
    const { error: uploadError } = await supabase.storage
      .from('videos')
      .upload(filePath, finalBuffer, {
        contentType: 'video/mp4',
        upsert: true
      })

    if (uploadError) {
      console.error('Error uploading final file:', uploadError)
      throw uploadError
    }

    console.log('Successfully combined and uploaded final file')
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in combine-video-chunks:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})