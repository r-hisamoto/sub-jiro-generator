import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface RequestBody {
  projectId: string
  format: 'vtt' | 'srt' | 'premiereXml' | 'fcpXml' | 'resolveXml'
  options?: {
    includeStyles?: boolean
    burnIn?: boolean
    videoUrl?: string
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
    const { projectId, format, options = {} } = await req.json() as RequestBody

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
      .eq('project_id', projectId)
      .order('line_number')

    if (subtitlesError || !subtitles) {
      throw new Error('Failed to fetch subtitles')
    }

    // フォーマットに応じた出力生成
    let output: string
    let mimeType: string
    let filename: string

    switch (format) {
      case 'vtt':
        output = generateVTT(subtitles, options.includeStyles)
        mimeType = 'text/vtt'
        filename = `${project.name}.vtt`
        break

      case 'srt':
        output = generateSRT(subtitles)
        mimeType = 'application/x-subrip'
        filename = `${project.name}.srt`
        break

      case 'premiereXml':
        output = generatePremiereXML(subtitles, project, options.videoUrl)
        mimeType = 'application/xml'
        filename = `${project.name}_premiere.xml`
        break

      case 'fcpXml':
        output = generateFCPXML(subtitles, project, options.videoUrl)
        mimeType = 'application/xml'
        filename = `${project.name}_fcp.xml`
        break

      case 'resolveXml':
        output = generateResolveXML(subtitles, project, options.videoUrl)
        mimeType = 'application/xml'
        filename = `${project.name}_resolve.xml`
        break

      default:
        throw new Error('Unsupported format')
    }

    // エクスポートファイルの保存
    const { error: uploadError } = await supabaseClient
      .storage
      .from('exports')
      .upload(
        `${projectId}/${filename}`,
        new Blob([output], { type: mimeType }),
        { contentType: mimeType }
      )

    if (uploadError) {
      throw new Error('Failed to save export file')
    }

    // 署名付きURLの生成
    const { data: { signedUrl }, error: urlError } = await supabaseClient
      .storage
      .from('exports')
      .createSignedUrl(`${projectId}/${filename}`, 3600) // 1時間有効

    if (urlError) {
      throw new Error('Failed to generate download URL')
    }

    // 処理結果を返す
    return new Response(
      JSON.stringify({
        success: true,
        downloadUrl: signedUrl
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

// VTT形式の生成
function generateVTT(subtitles: any[], includeStyles: boolean = false) {
  let output = 'WEBVTT\n\n'

  subtitles.forEach((subtitle, index) => {
    const startTime = formatVTTTime(subtitle.start_time)
    const endTime = formatVTTTime(subtitle.end_time)
    
    output += `${index + 1}\n`
    output += `${startTime} --> ${endTime}`

    if (includeStyles && subtitle.font_family) {
      output += ` line:90% position:50% align:center size:100%\n`
      output += `<c.styled ${formatVTTStyle(subtitle)}>` + subtitle.text + '</c>\n\n'
    } else {
      output += '\n' + subtitle.text + '\n\n'
    }
  })

  return output
}

// SRT形式の生成
function generateSRT(subtitles: any[]) {
  let output = ''

  subtitles.forEach((subtitle, index) => {
    const startTime = formatSRTTime(subtitle.start_time)
    const endTime = formatSRTTime(subtitle.end_time)
    
    output += `${index + 1}\n`
    output += `${startTime} --> ${endTime}\n`
    output += subtitle.text + '\n\n'
  })

  return output
}

// Premiere Pro XML形式の生成
function generatePremiereXML(subtitles: any[], project: any, videoUrl?: string) {
  // Premiere Pro用のXMLテンプレート
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE xmeml>
<xmeml version="4">
  <sequence>
    <name>${project.name}</name>
    <duration>${Math.max(...subtitles.map(s => s.end_time))}</duration>
    <rate>
      <timebase>30</timebase>
      <ntsc>TRUE</ntsc>
    </rate>
    <media>
      <video>
        ${subtitles.map(subtitle => `
          <track>
            <clipitem>
              <name>${subtitle.text}</name>
              <duration>${subtitle.end_time - subtitle.start_time}</duration>
              <start>${subtitle.start_time * 30}</start>
              <end>${subtitle.end_time * 30}</end>
              <file>
                <name>${subtitle.text}</name>
                <duration>${subtitle.end_time - subtitle.start_time}</duration>
                <rate>
                  <timebase>30</timebase>
                  <ntsc>TRUE</ntsc>
                </rate>
              </file>
            </clipitem>
          </track>
        `).join('\n')}
      </video>
    </media>
  </sequence>
</xmeml>`
}

// Final Cut Pro XML形式の生成
function generateFCPXML(subtitles: any[], project: any, videoUrl?: string) {
  // Final Cut Pro用のXMLテンプレート
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.8">
  <project name="${project.name}">
    <sequence>
      <spine>
        ${subtitles.map(subtitle => `
          <title>
            <text>${subtitle.text}</text>
            <time>${subtitle.start_time}</time>
            <duration>${subtitle.end_time - subtitle.start_time}</duration>
          </title>
        `).join('\n')}
      </spine>
    </sequence>
  </project>
</fcpxml>`
}

// DaVinci Resolve XML形式の生成
function generateResolveXML(subtitles: any[], project: any, videoUrl?: string) {
  // DaVinci Resolve用のXMLテンプレート
  return `<?xml version="1.0" encoding="UTF-8"?>
<mlt>
  <playlist>
    ${subtitles.map(subtitle => `
      <entry>
        <property name="text">${subtitle.text}</property>
        <property name="in">${subtitle.start_time}</property>
        <property name="out">${subtitle.end_time}</property>
      </entry>
    `).join('\n')}
  </playlist>
</mlt>`
}

// 時間フォーマット関数
function formatVTTTime(seconds: number) {
  const date = new Date(seconds * 1000)
  const hours = date.getUTCHours().toString().padStart(2, '0')
  const minutes = date.getUTCMinutes().toString().padStart(2, '0')
  const secs = date.getUTCSeconds().toString().padStart(2, '0')
  const ms = date.getUTCMilliseconds().toString().padStart(3, '0')
  return `${hours}:${minutes}:${secs}.${ms}`
}

function formatSRTTime(seconds: number) {
  const date = new Date(seconds * 1000)
  const hours = date.getUTCHours().toString().padStart(2, '0')
  const minutes = date.getUTCMinutes().toString().padStart(2, '0')
  const secs = date.getUTCSeconds().toString().padStart(2, '0')
  const ms = date.getUTCMilliseconds().toString().padStart(3, '0')
  return `${hours}:${minutes}:${secs},${ms}`
}

// VTTスタイル生成関数
function formatVTTStyle(subtitle: any) {
  const styles = []
  if (subtitle.font_family) styles.push(`font-family: ${subtitle.font_family}`)
  if (subtitle.font_size) styles.push(`font-size: ${subtitle.font_size}px`)
  if (subtitle.font_color) styles.push(`color: ${subtitle.font_color}`)
  if (subtitle.background_color) styles.push(`background-color: ${subtitle.background_color}`)
  return styles.join('; ')
} 