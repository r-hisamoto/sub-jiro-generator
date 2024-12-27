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
    const formData = await req.formData()
    const file = formData.get('file')

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'ファイルがアップロードされていません' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // ファイルタイプの検証
    if (!file.type.startsWith('video/')) {
      return new Response(
        JSON.stringify({ error: '動画ファイルのみアップロード可能です' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const fileExt = file.name.split('.').pop()
    const filePath = `${crypto.randomUUID()}.${fileExt}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('videos')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      return new Response(
        JSON.stringify({ error: 'ファイルのアップロードに失敗しました', details: uploadError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const { data: { user } } = await supabase.auth.getUser(req.headers.get('Authorization')?.split(' ')[1] ?? '')
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: '認証エラー' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const { error: dbError } = await supabase
      .from('videos')
      .insert({
        title: file.name,
        file_path: filePath,
        content_type: file.type,
        size: file.size,
        user_id: user.id
      })

    if (dbError) {
      return new Response(
        JSON.stringify({ error: 'ファイルメタデータの保存に失敗しました', details: dbError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    return new Response(
      JSON.stringify({ 
        message: 'ファイルのアップロードが完了しました',
        filePath,
        fileUrl: `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/videos/${filePath}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: '予期せぬエラーが発生しました', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})