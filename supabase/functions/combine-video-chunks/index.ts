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
    const { filePath, totalChunks } = await req.json()
    console.log('Received request to combine chunks:', { filePath, totalChunks })

    if (!filePath || !totalChunks) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Process chunks in smaller batches to reduce memory usage
    const BATCH_SIZE = 3
    let combinedSize = 0
    const chunks: Uint8Array[] = []

    for (let batchStart = 0; batchStart < totalChunks; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, totalChunks)
      console.log(`Processing batch ${batchStart} to ${batchEnd - 1}`)

      const batchPromises = []
      for (let i = batchStart; i < batchEnd; i++) {
        const chunkPath = `${filePath}_part${i}`
        batchPromises.push(
          supabase.storage
            .from('videos')
            .download(chunkPath)
            .then(async ({ data, error }) => {
              if (error) {
                console.error(`Error downloading chunk ${i}:`, error)
                throw error
              }
              return new Uint8Array(await data.arrayBuffer())
            })
        )
      }

      try {
        const batchChunks = await Promise.all(batchPromises)
        for (const chunk of batchChunks) {
          combinedSize += chunk.length
          chunks.push(chunk)
        }
      } catch (error) {
        console.error('Error processing batch:', error)
        throw error
      }

      // Add a delay between batches to allow for garbage collection
      if (batchEnd < totalChunks) {
        console.log('Pausing between batches for memory cleanup...')
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    console.log('All chunks downloaded, combining...')

    // Combine chunks efficiently
    const combinedArray = new Uint8Array(combinedSize)
    let offset = 0
    for (const chunk of chunks) {
      combinedArray.set(chunk, offset)
      offset += chunk.length
      // Clear reference to help with garbage collection
      chunk.fill(0)
    }
    chunks.length = 0 // Clear array to help with garbage collection

    console.log('Uploading combined file...')

    // Upload combined file
    const { error: uploadError } = await supabase.storage
      .from('videos')
      .upload(filePath, combinedArray, {
        contentType: 'video/mp4',
        upsert: true
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw uploadError
    }

    console.log('Cleaning up chunks...')

    // Clean up chunks in batches
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = `${filePath}_part${i}`
      const { error: deleteError } = await supabase.storage
        .from('videos')
        .remove([chunkPath])
      
      if (deleteError) {
        console.error(`Error deleting chunk ${i}:`, deleteError)
      }
    }

    console.log('Process completed successfully')

    return new Response(
      JSON.stringify({ message: 'Chunks combined successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error in combine-video-chunks:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to combine chunks', 
        details: error.message,
        code: 'PROCESSING_ERROR'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})