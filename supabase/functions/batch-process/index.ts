import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface RequestBody {
  type: 'cleanup' | 'stats'
  options?: {
    dryRun?: boolean
    olderThan?: number // 日数
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
    const { type, options = {} } = await req.json() as RequestBody

    switch (type) {
      case 'cleanup':
        return await handleCleanup(supabaseClient, options)
      case 'stats':
        return await handleStats(supabaseClient, options)
      default:
        throw new Error('Unsupported batch type')
    }

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// クリーンアップ処理
async function handleCleanup(supabaseClient: any, options: any) {
  const results = {
    deletedFiles: 0,
    deletedProjects: 0,
    errors: [] as string[]
  }

  try {
    // 古い一時ファイルの削除
    const { data: tempFiles, error: tempError } = await supabaseClient
      .storage
      .from('temp')
      .list()

    if (!tempError && tempFiles) {
      for (const file of tempFiles) {
        if (isOlderThan(file.created_at, options.olderThan ?? 1)) {
          if (!options.dryRun) {
            const { error } = await supabaseClient
              .storage
              .from('temp')
              .remove([file.name])

            if (error) {
              results.errors.push(`Failed to delete temp file: ${file.name}`)
            } else {
              results.deletedFiles++
            }
          } else {
            results.deletedFiles++
          }
        }
      }
    }

    // 古いエクスポートファイルの削除
    const { data: exportFiles, error: exportError } = await supabaseClient
      .storage
      .from('exports')
      .list()

    if (!exportError && exportFiles) {
      for (const file of exportFiles) {
        if (isOlderThan(file.created_at, options.olderThan ?? 7)) {
          if (!options.dryRun) {
            const { error } = await supabaseClient
              .storage
              .from('exports')
              .remove([file.name])

            if (error) {
              results.errors.push(`Failed to delete export file: ${file.name}`)
            } else {
              results.deletedFiles++
            }
          } else {
            results.deletedFiles++
          }
        }
      }
    }

    // 削除済みプロジェクトの完全削除
    const { data: deletedProjects, error: projectError } = await supabaseClient
      .from('projects')
      .select('id')
      .eq('status', 'deleted')
      .lt('updated_at', new Date(Date.now() - (options.olderThan ?? 30) * 24 * 60 * 60 * 1000).toISOString())

    if (!projectError && deletedProjects) {
      for (const project of deletedProjects) {
        if (!options.dryRun) {
          const { error } = await supabaseClient
            .from('projects')
            .delete()
            .eq('id', project.id)

          if (error) {
            results.errors.push(`Failed to delete project: ${project.id}`)
          } else {
            results.deletedProjects++
          }
        } else {
          results.deletedProjects++
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        dryRun: options.dryRun ?? false,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message, results }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

// 統計情報収集処理
async function handleStats(supabaseClient: any, options: any) {
  const stats = {
    totalProjects: 0,
    activeProjects: 0,
    totalUsers: 0,
    totalSubtitles: 0,
    storageUsage: {
      temp: 0,
      exports: 0,
      subtitles: 0
    },
    errors: [] as string[]
  }

  try {
    // プロジェクト統計
    const { count: totalProjects, error: projectError } = await supabaseClient
      .from('projects')
      .select('*', { count: 'exact' })

    if (!projectError) {
      stats.totalProjects = totalProjects

      const { count: activeProjects } = await supabaseClient
        .from('projects')
        .select('*', { count: 'exact' })
        .eq('status', 'active')

      stats.activeProjects = activeProjects
    }

    // ユーザー統計
    const { count: totalUsers, error: userError } = await supabaseClient
      .from('users')
      .select('*', { count: 'exact' })

    if (!userError) {
      stats.totalUsers = totalUsers
    }

    // 字幕統計
    const { count: totalSubtitles, error: subtitleError } = await supabaseClient
      .from('subtitles')
      .select('*', { count: 'exact' })

    if (!subtitleError) {
      stats.totalSubtitles = totalSubtitles
    }

    // ストレージ使用量
    for (const bucket of ['temp', 'exports', 'subtitles']) {
      const { data: files, error: storageError } = await supabaseClient
        .storage
        .from(bucket)
        .list()

      if (!storageError && files) {
        stats.storageUsage[bucket] = files.reduce((total, file) => total + (file.metadata?.size ?? 0), 0)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        stats
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message, stats }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

// 日付チェック関数
function isOlderThan(date: string, days: number): boolean {
  const timestamp = new Date(date).getTime()
  const threshold = Date.now() - (days * 24 * 60 * 60 * 1000)
  return timestamp < threshold
} 