import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface RequestBody {
  projectId: string
  subtitleIds: string[]
  audioUrl: string
  options?: {
    useWaveform?: boolean
    adjustmentThreshold?: number
  }
}

serve(async (req) => {
  // CORSヘッダーの処理
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // リクエストボディの解析
    const { projectId, subtitleIds, audioUrl, options = {} } = await req.json() as RequestBody

    // プロジェクトの存在確認とアクセス権限チェック
    const { data: project, error: projectError } = await supabaseClient
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: 'Project not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 字幕データの取得
    const { data: subtitles, error: subtitlesError } = await supabaseClient
      .from('subtitles')
      .select('*')
      .in('id', subtitleIds)
      .order('line_number')

    if (subtitlesError || !subtitles) {
      throw new Error('Failed to fetch subtitles')
    }

    // 音声ファイルのダウンロードと波形解析
    const audioResponse = await fetch(audioUrl)
    if (!audioResponse.ok) {
      throw new Error('Failed to download audio file')
    }

    // 波形データの解析（オプション）
    let waveformData = null
    if (options.useWaveform) {
      waveformData = await analyzeWaveform(await audioResponse.arrayBuffer())
    }

    // タイムコードの調整
    const adjustedSubtitles = await adjustTimecodes(
      subtitles,
      waveformData,
      options.adjustmentThreshold ?? 0.5
    )

    // 調整された字幕データの保存
    for (const subtitle of adjustedSubtitles) {
      const { error: updateError } = await supabaseClient
        .from('subtitles')
        .update({
          start_time: subtitle.start_time,
          end_time: subtitle.end_time
        })
        .eq('id', subtitle.id)

      if (updateError) {
        throw new Error(`Failed to update subtitle ${subtitle.id}`)
      }
    }

    // 処理結果を返す
    return new Response(
      JSON.stringify({
        success: true,
        subtitles: adjustedSubtitles
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// 波形解析関数
async function analyzeWaveform(audioBuffer: ArrayBuffer) {
  // Web Audio APIを使用した波形解析
  // この部分は実際のオーディオ処理ライブラリに置き換える必要があります
  return {
    peaks: [],
    valleys: [],
    silences: []
  }
}

// タイムコード調整関数
async function adjustTimecodes(subtitles: any[], waveformData: any, threshold: number) {
  // 波形データがある場合は、それを使用してタイムコードを調整
  if (waveformData) {
    return subtitles.map(subtitle => {
      // 波形データを使用した高度な調整ロジック
      // ここでは簡単な例として、前後0.5秒の範囲で最も適切な位置を探す
      const startRange = {
        start: Math.max(0, subtitle.start_time - 0.5),
        end: subtitle.start_time + 0.5
      }
      const endRange = {
        start: Math.max(0, subtitle.end_time - 0.5),
        end: subtitle.end_time + 0.5
      }

      // 波形データから最適な位置を見つける
      const optimalStart = findOptimalPosition(startRange, waveformData, threshold)
      const optimalEnd = findOptimalPosition(endRange, waveformData, threshold)

      return {
        ...subtitle,
        start_time: optimalStart,
        end_time: optimalEnd
      }
    })
  }

  // 波形データがない場合は、単純な調整を行う
  return subtitles.map(subtitle => {
    // 基本的な調整（例：字幕間のギャップを均等にする）
    return subtitle
  })
}

// 最適な位置を見つける関数
function findOptimalPosition(range: { start: number, end: number }, waveformData: any, threshold: number) {
  // 波形データを使用して、指定された範囲内で最も適切な位置を見つける
  // この例では、範囲の中間点を返す
  return (range.start + range.end) / 2
} 