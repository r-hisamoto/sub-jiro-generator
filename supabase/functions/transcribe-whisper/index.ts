import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks

async function* splitAudioIntoChunks(audioData: Uint8Array, chunkSize: number) {
  for (let i = 0; i < audioData.length; i += chunkSize) {
    yield audioData.slice(i, i + chunkSize);
  }
}

async function transcribeChunk(chunk: Uint8Array, apiKey: string) {
  const formData = new FormData();
  formData.append('file', new Blob([chunk], { type: 'audio/mpeg' }), 'chunk.mp3');
  formData.append('model', 'whisper-1');
  formData.append('language', 'ja');
  formData.append('response_format', 'json');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('OpenAI API error:', error);
    throw new Error('音声認識に失敗しました');
  }

  return await response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const apiKey = Deno.env.get('OPENAI_API_KEY');

    if (!apiKey) {
      throw new Error('OpenAI APIキーが設定されていません');
    }

    const audioData = new Uint8Array(await audioFile.arrayBuffer());
    let transcribedText = '';

    // チャンクごとに処理
    for await (const chunk of splitAudioIntoChunks(audioData, CHUNK_SIZE)) {
      const result = await transcribeChunk(chunk, apiKey);
      transcribedText += result.text + ' ';
    }

    return new Response(
      JSON.stringify({ text: transcribedText.trim() }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Transcription error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});