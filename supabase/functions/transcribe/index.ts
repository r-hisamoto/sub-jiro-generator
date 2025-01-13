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
    console.log('Starting transcribe function');
    
    const formData = await req.formData()
    const file = formData.get('file')

    if (!file) {
      console.error('No file uploaded');
      return new Response(
        JSON.stringify({ error: 'ファイルがアップロードされていません' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user ID from the request
    const { data: { user } } = await supabase.auth.getUser(
      req.headers.get('Authorization')?.split('Bearer ')[1] ?? ''
    )

    if (!user) {
      console.error('Unauthorized request');
      return new Response(
        JSON.stringify({ error: '認証が必要です' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Upload file to storage
    const fileExt = file.name.split('.').pop()
    const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`

    console.log(`Uploading file to storage: ${filePath}`);

    const { error: uploadError } = await supabase.storage
      .from('videos')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: 'ファイルのアップロードに失敗しました', details: uploadError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Create video record
    const { error: dbError } = await supabase
      .from('videos')
      .insert({
        title: file.name,
        file_path: filePath,
        content_type: file.type,
        size: file.size,
        user_id: user.id,
      })

    if (dbError) {
      console.error('Database insert error:', dbError);
      return new Response(
        JSON.stringify({ error: 'データベースの更新に失敗しました', details: dbError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // For now, return a mock transcription result
    // TODO: Implement actual transcription logic
    return new Response(
      JSON.stringify({
        text: "テスト文字起こし結果です。",
        filePath
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: '予期せぬエラーが発生しました', 
        details: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})