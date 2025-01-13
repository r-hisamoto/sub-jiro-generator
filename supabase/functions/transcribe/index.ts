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

    // Create a video job
    const { data: job, error: jobError } = await supabase
      .from('video_jobs')
      .insert({
        user_id: user.id,
        status: 'pending',
        metadata: {
          filename: file.name,
          filesize: file.size,
          content_type: file.type
        },
        upload_path: `${user.id}/${crypto.randomUUID()}`
      })
      .select()
      .single()

    if (jobError) {
      console.error('Failed to create video job:', jobError);
      return new Response(
        JSON.stringify({ error: 'ジョブの作成に失敗しました', details: jobError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Add to processing queue
    const { error: queueError } = await supabase
      .from('processing_queue')
      .insert({
        job_id: job.id,
        upload_path: job.upload_path,
        total_chunks: 1,
        metadata: job.metadata,
        status: 'pending'
      })

    if (queueError) {
      console.error('Failed to add to processing queue:', queueError);
      return new Response(
        JSON.stringify({ error: 'キューへの追加に失敗しました', details: queueError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    return new Response(
      JSON.stringify({
        jobId: job.id,
        message: 'ファイルの処理を開始しました'
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