import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
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

    // Create a write stream for the final file
    const finalFileData = new Uint8Array(0)
    let currentPosition = 0

    // Process chunks sequentially
    for (let i = 0; i < totalChunks; i++) {
      console.log(`Processing chunk ${i + 1}/${totalChunks}`)
      
      const chunkPath = `${filePath}_part${i}`
      const { data: chunkData, error: downloadError } = await supabase.storage
        .from('videos')
        .download(chunkPath)

      if (downloadError) {
        console.error(`Error downloading chunk ${i}:`, downloadError)
        throw new Error(`Failed to download chunk ${i}: ${downloadError.message}`)
      }

      // Convert chunk to Uint8Array and append to final file
      const chunkArray = new Uint8Array(await chunkData.arrayBuffer())
      const newFinalFileData = new Uint8Array(finalFileData.length + chunkArray.length)
      newFinalFileData.set(finalFileData)
      newFinalFileData.set(chunkArray, currentPosition)
      currentPosition += chunkArray.length

      // Clean up the chunk immediately
      const { error: deleteError } = await supabase.storage
        .from('videos')
        .remove([chunkPath])

      if (deleteError) {
        console.warn(`Warning: Failed to delete chunk ${i}:`, deleteError)
      }

      console.log(`Successfully processed and cleaned up chunk ${i + 1}/${totalChunks}`)
    }

    // Upload the combined file
    console.log('Uploading final combined file')
    const { error: uploadError } = await supabase.storage
      .from('videos')
      .upload(filePath, finalFileData, {
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