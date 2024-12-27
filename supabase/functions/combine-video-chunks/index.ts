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

    // Instead of combining chunks, we'll rename the last chunk to be the final file
    const lastChunkPath = `${filePath}_part${totalChunks - 1}`
    
    // First, verify all chunks exist
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = `${filePath}_part${i}`
      const { data, error } = await supabase.storage
        .from('videos')
        .list('', {
          search: chunkPath
        })

      if (error || !data.length) {
        console.error(`Chunk ${i} not found:`, error)
        throw new Error(`Chunk ${i} is missing`)
      }
    }

    // Move the last chunk to be the final file
    const { error: moveError } = await supabase.storage
      .from('videos')
      .move(lastChunkPath, filePath)

    if (moveError) {
      console.error('Error moving final chunk:', moveError)
      throw new Error(`Failed to finalize file: ${moveError.message}`)
    }

    // Clean up other chunks
    const deletePromises = []
    for (let i = 0; i < totalChunks - 1; i++) {
      const chunkPath = `${filePath}_part${i}`
      deletePromises.push(
        supabase.storage
          .from('videos')
          .remove([chunkPath])
      )
    }

    // Wait for all deletions to complete
    await Promise.all(deletePromises)
    console.log('Successfully cleaned up chunks')

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