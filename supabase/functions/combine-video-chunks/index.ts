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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Download and combine chunks
    const chunks: Uint8Array[] = []
    for (let i = 0; i < totalChunks; i++) {
      const { data, error } = await supabase.storage
        .from('videos')
        .download(`${filePath}_part${i}`)

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
      await supabase.storage
        .from('videos')
        .remove([`${filePath}_part${i}`])
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})