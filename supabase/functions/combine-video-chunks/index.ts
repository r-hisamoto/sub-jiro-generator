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

    // Process one chunk at a time
    console.log('Starting chunk processing...')
    const chunks = []
    
    for (let i = 0; i < totalChunks; i++) {
      console.log(`Processing chunk ${i + 1}/${totalChunks}`)
      const chunkPath = `${filePath}_part${i}`
      
      try {
        const { data: chunkData, error: downloadError } = await supabase.storage
          .from('videos')
          .download(chunkPath)

        if (downloadError) {
          console.error(`Error downloading chunk ${i}:`, downloadError)
          throw downloadError
        }

        // Add chunk to array (we'll keep the array small since we're processing one at a time)
        chunks.push(await chunkData.arrayBuffer())

        // If we have 2 chunks or this is the last chunk, combine and upload
        if (chunks.length === 2 || i === totalChunks - 1) {
          // Combine current chunks
          const combinedSize = chunks.reduce((acc, chunk) => acc + chunk.byteLength, 0)
          const combinedArray = new Uint8Array(combinedSize)
          
          let offset = 0
          for (const chunk of chunks) {
            combinedArray.set(new Uint8Array(chunk), offset)
            offset += chunk.byteLength
          }

          // Upload the combined segment
          const segmentPath = i === totalChunks - 1 ? filePath : `${filePath}_temp${Math.floor(i/2)}`
          console.log(`Uploading segment: ${segmentPath}`)
          
          const { error: uploadError } = await supabase.storage
            .from('videos')
            .upload(segmentPath, combinedArray, {
              contentType: 'video/mp4',
              upsert: true
            })

          if (uploadError) {
            console.error('Upload error:', uploadError)
            throw uploadError
          }

          // Clear chunks array
          chunks.length = 0
          
          // Force garbage collection if available
          if (typeof Deno.gc === 'function') {
            Deno.gc()
          }

          // Small delay to allow for memory cleanup
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      } catch (error) {
        console.error(`Error processing chunk ${i}:`, error)
        throw error
      }
    }

    console.log('Cleaning up temporary chunks...')

    // Clean up original chunks
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = `${filePath}_part${i}`
      const { error: deleteError } = await supabase.storage
        .from('videos')
        .remove([chunkPath])
      
      if (deleteError) {
        console.error(`Error deleting chunk ${i}:`, deleteError)
        // Continue despite error
      }
    }

    // Clean up temporary segments if any exist
    const tempSegments = Math.floor((totalChunks - 1) / 2)
    for (let i = 0; i < tempSegments; i++) {
      const tempPath = `${filePath}_temp${i}`
      const { error: deleteError } = await supabase.storage
        .from('videos')
        .remove([tempPath])
      
      if (deleteError) {
        console.error(`Error deleting temp segment ${i}:`, deleteError)
        // Continue despite error
      }
    }

    console.log('Process completed successfully')

    return new Response(
      JSON.stringify({ message: 'Video processing completed successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error in combine-video-chunks:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process video', 
        details: error.message,
        code: 'PROCESSING_ERROR'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
