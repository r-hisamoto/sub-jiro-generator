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

    // Process chunks in even smaller batches
    const BATCH_SIZE = 2
    let combinedSize = 0
    const chunks: Uint8Array[] = []

    // First pass: calculate total size
    console.log('Calculating total size...')
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = `${filePath}_part${i}`
      const { data, error } = await supabase.storage
        .from('videos')
        .download(chunkPath)
      
      if (error) {
        console.error(`Error downloading chunk ${i} for size calculation:`, error)
        throw error
      }
      
      combinedSize += (await data.arrayBuffer()).byteLength
    }

    console.log(`Total size calculated: ${combinedSize} bytes`)
    const combinedArray = new Uint8Array(combinedSize)
    let offset = 0

    // Second pass: process and combine chunks in small batches
    for (let batchStart = 0; batchStart < totalChunks; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, totalChunks)
      console.log(`Processing batch ${batchStart} to ${batchEnd - 1}`)

      for (let i = batchStart; i < batchEnd; i++) {
        const chunkPath = `${filePath}_part${i}`
        const { data, error } = await supabase.storage
          .from('videos')
          .download(chunkPath)

        if (error) {
          console.error(`Error downloading chunk ${i}:`, error)
          throw error
        }

        const chunk = new Uint8Array(await data.arrayBuffer())
        combinedArray.set(chunk, offset)
        offset += chunk.length

        // Clear reference immediately
        chunk.fill(0)

        // Force garbage collection if available
        if (typeof Deno.gc === 'function') {
          Deno.gc()
        }

        // Add a small delay between chunks
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Add a longer delay between batches
      console.log('Pausing between batches for memory cleanup...')
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    console.log('All chunks processed and combined, uploading final file...')

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

    // Clean up chunks
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