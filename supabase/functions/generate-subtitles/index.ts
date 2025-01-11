import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface RequestBody {
  project_id: string
  audioUrl: string
  language?: string
  model?: string
  options?: {
    textFormatting?: boolean
    speakerDetection?: boolean
    customDictionary?: string[]
  }
}

serve(async (req) => {
  // CORSヘッダーの処理
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Request headers:', req.headers)
    console.log('SUPABASE_URL:', Deno.env.get('SUPABASE_URL'))
    console.log('SUPABASE_ANON_KEY:', Deno.env.get('SUPABASE_ANON_KEY'))

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // リクエストボディの解析
    const { project_id, audioUrl, language = 'ja', model = 'base', options = {} } = await req.json() as RequestBody
    console.log('Request body:', { project_id, audioUrl, language, model, options })

    // プロジェクトの存在確認を一時的にスキップ
    /*
    const { data: project, error: projectError } = await supabaseClient
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .single()

    console.log('Project data:', project)
    console.log('Project error:', projectError)

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: 'Project not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    */

    // 音声ファイルのダウンロード
    console.log('Downloading audio from:', audioUrl)
    const bucketName = 'audio'
    const filePath = audioUrl.split('/').pop() || ''
    console.log('Bucket:', bucketName, 'File:', filePath)

    const { data: audioData, error: audioError } = await supabaseClient
      .storage
      .from(bucketName)
      .download(filePath)

    if (audioError) {
      console.error('Audio download failed:', audioError)
      throw new Error(`Failed to download audio file: ${audioError.message}`)
    }

    // Whisper APIを使用して音声認識を実行
    const formData = new FormData()
    formData.append('file', new Blob([audioData], { type: 'audio/mpeg' }), 'audio.mp3')
    formData.append('model', 'whisper-1')
    formData.append('language', language)
    formData.append('response_format', 'vtt')

    console.log('Sending request to Whisper API')
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    console.log('OpenAI API Key:', openaiApiKey ? 'Set' : 'Not set')
    
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: formData
    })

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text()
      console.error('Whisper API error:', whisperResponse.status, errorText)
      throw new Error(`Whisper API request failed: ${whisperResponse.status} ${errorText}`)
    }

    const vttContent = await whisperResponse.text()

    // VTTパース処理
    const subtitles = parseVTT(vttContent)

    // テキスト整形処理（オプション）
    let formattedSubtitles = subtitles
    if (options.textFormatting) {
      formattedSubtitles = await formatSubtitles(subtitles, options.customDictionary)
    }

    // 字幕データの保存
    const { error: insertError } = await supabaseClient
      .from('subtitles')
      .insert(
        formattedSubtitles.map((subtitle, index) => ({
          project_id: project_id,
          text: subtitle.text,
          start_time: subtitle.startTime,
          end_time: subtitle.endTime,
          line_number: index + 1
        }))
      )

    if (insertError) {
      console.error('Insert Error:', insertError)
      throw new Error(`Failed to save subtitles: ${insertError.message}`)
    }

    // 処理結果を返す
    return new Response(
      JSON.stringify({
        success: true,
        subtitles: formattedSubtitles
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// VTTパース関数
function parseVTT(vttContent: string) {
  const lines = vttContent.trim().split('\n')
  const subtitles = []
  let currentSubtitle = null

  for (const line of lines) {
    if (line.includes('-->')) {
      const [start, end] = line.split('-->').map(timeStr => {
        const [h, m, s] = timeStr.trim().split(':')
        return parseFloat(h) * 3600 + parseFloat(m) * 60 + parseFloat(s.replace(',', '.'))
      })
      currentSubtitle = { startTime: start, endTime: end, text: '' }
    } else if (currentSubtitle && line.trim() && !line.startsWith('WEBVTT')) {
      currentSubtitle.text += line.trim() + ' '
      if (line === '') {
        subtitles.push({ ...currentSubtitle, text: currentSubtitle.text.trim() })
        currentSubtitle = null
      }
    }
  }

  if (currentSubtitle) {
    subtitles.push({ ...currentSubtitle, text: currentSubtitle.text.trim() })
  }

  return subtitles
}

// テキスト整形関数
async function formatSubtitles(subtitles: any[], customDictionary: string[] = []) {
  // カスタム辞書の適用
  const formattedSubtitles = subtitles.map(subtitle => {
    let text = subtitle.text

    // カスタム辞書による置換
    customDictionary.forEach(term => {
      const [wrong, correct] = term.split(':')
      text = text.replace(new RegExp(wrong, 'g'), correct)
    })

    // 基本的な整形ルール
    text = text
      .replace(/([。、．，！？])\s+/g, '$1') // 句読点後の不要な空白を削除
      .replace(/\s+([。、．，！？])/g, '$1') // 句読点前の不要な空白を削除
      .replace(/([。、．，！？])([^」』）\s])/g, '$1 $2') // 句読点と次の文字の間に適切な空白を挿入
      .trim()

    return { ...subtitle, text }
  })

  return formattedSubtitles
} 