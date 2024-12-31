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

    // Download and combine all chunks
    const chunks: Uint8Array[] = []
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = `${filePath}_part${i}`
      const { data, error } = await supabase.storage
        .from('videos')
        .download(chunkPath)

      if (error) {
        throw error
      }

      const arrayBuffer = await data.arrayBuffer()
      chunks.push(new Uint8Array(arrayBuffer))
    }

    // Combine chunks
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
    const combinedArray = new Uint8Array(totalLength)
    let offset = 0
    for (const chunk of chunks) {
      combinedArray.set(chunk, offset)
      offset += chunk.length
    }

    // Upload combined file
    const { error: uploadError } = await supabase.storage
      .from('videos')
      .upload(filePath, combinedArray, {
        contentType: 'video/mp4',
        upsert: true
      })

    if (uploadError) {
      throw uploadError
    }

    // Clean up chunks
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = `${filePath}_part${i}`
      await supabase.storage
        .from('videos')
        .remove([chunkPath])
    }

    return new Response(
      JSON.stringify({ message: 'Chunks combined successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to combine chunks', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})