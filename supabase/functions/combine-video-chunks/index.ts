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
    const BATCH_SIZE = 5
    const finalChunks: Uint8Array[] = []
    let totalSize = 0

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
              if (error) throw error
              const arrayBuffer = await data.arrayBuffer()
              return new Uint8Array(arrayBuffer)
            })
        )
      }

      const batchChunks = await Promise.all(batchPromises)
      for (const chunk of batchChunks) {
        totalSize += chunk.length
        finalChunks.push(chunk)
      }

      // Free up memory after each batch
      if (batchEnd < totalChunks) {
        await new Promise(resolve => setTimeout(resolve, 100)) // Small delay to allow GC
      }
    }

    console.log('All chunks downloaded, combining...')

    // Combine chunks efficiently
    const combinedArray = new Uint8Array(totalSize)
    let offset = 0
    for (const chunk of finalChunks) {
      combinedArray.set(chunk, offset)
      offset += chunk.length
    }

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
      await supabase.storage
        .from('videos')
        .remove([chunkPath])
    }

    console.log('Process completed successfully')

    return new Response(
      JSON.stringify({ message: 'Chunks combined successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error in combine-video-chunks:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to combine chunks', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})