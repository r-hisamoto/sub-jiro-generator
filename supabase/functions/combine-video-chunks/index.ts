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

    // Process and upload chunks one at a time
    let finalFilePath = `${filePath}_final`
    let isFirstChunk = true

    for (let i = 0; i < totalChunks; i++) {
      console.log(`Processing chunk ${i + 1}/${totalChunks}`)
      const chunkPath = `${filePath}_part${i}`
      
      try {
        // Download current chunk
        const { data: chunkData, error: downloadError } = await supabase.storage
          .from('videos')
          .download(chunkPath)

        if (downloadError) {
          throw new Error(`Failed to download chunk ${i}: ${downloadError.message}`)
        }

        // Convert chunk to Uint8Array
        const chunkArray = new Uint8Array(await chunkData.arrayBuffer())

        // Upload chunk to final file
        const { error: uploadError } = await supabase.storage
          .from('videos')
          .upload(finalFilePath, chunkArray, {
            upsert: true
          })

        if (uploadError) {
          throw new Error(`Failed to upload chunk ${i}: ${uploadError.message}`)
        }

        // Clean up the processed chunk
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

    // Rename final file to original path
    const { error: moveError } = await supabase.storage
      .from('videos')
      .move(finalFilePath, filePath)

    if (moveError) {
      throw new Error(`Failed to finalize file: ${moveError.message}`)
    }

    console.log('Successfully combined all chunks')
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