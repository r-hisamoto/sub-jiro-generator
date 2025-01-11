import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { Buffer } from 'https://deno.land/std@0.177.0/io/buffer.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks for better memory management

async function* splitAudioIntoChunks(audioData: Uint8Array, chunkSize: number) {
  const buffer = new Buffer(audioData);
  let chunk = new Uint8Array(chunkSize);
  let bytesRead = 0;

  while ((bytesRead = await buffer.read(chunk)) !== null) {
    if (bytesRead < chunkSize) {
      chunk = chunk.slice(0, bytesRead);
    }
    yield chunk;
  }
}

async function transcribeChunk(chunk: Uint8Array, apiKey: string) {
  try {
    const formData = new FormData();
    formData.append('file', new Blob([chunk], { type: 'audio/mpeg' }), 'chunk.mp3');
    formData.append('model', 'whisper-1');
    formData.append('language', 'ja');
    formData.append('response_format', 'json');

    console.log(`Processing chunk of size: ${chunk.length} bytes`);

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
      throw new Error(`音声認識に失敗しました: ${error}`);
    }

    const result = await response.json();
    if (!result.text) {
      throw new Error('音声認識結果が空です');
    }
    return result;
  } catch (error) {
    console.error('Chunk transcription error:', error);
    throw error;
  }
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

    if (!audioFile) {
      throw new Error('音声ファイルが見つかりません');
    }

    console.log(`Processing audio file of size: ${audioFile.size} bytes`);

    // ファイルサイズチェック
    const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
    if (audioFile.size > MAX_FILE_SIZE) {
      throw new Error('ファイルサイズが大きすぎます（最大25MB）');
    }

    const audioData = new Uint8Array(await audioFile.arrayBuffer());
    let transcribedText = '';
    let chunkIndex = 0;
    let retryCount = 0;
    const MAX_RETRIES = 3;

    // チャンクごとに処理
    for await (const chunk of splitAudioIntoChunks(audioData, CHUNK_SIZE)) {
      console.log(`Processing chunk ${++chunkIndex}`);
      
      while (retryCount < MAX_RETRIES) {
        try {
          const result = await transcribeChunk(chunk, apiKey);
          transcribedText += result.text + ' ';
          retryCount = 0; // リトライカウントをリセット
          break;
        } catch (error) {
          retryCount++;
          if (retryCount >= MAX_RETRIES) {
            throw new Error(`チャンク${chunkIndex}の処理に失敗しました: ${error.message}`);
          }
          console.log(`Retrying chunk ${chunkIndex} (attempt ${retryCount}/${MAX_RETRIES})`);
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // 指数バックオフ
        }
      }
      
      // メモリ解放のためにガベージコレクションを促す
      if (chunkIndex % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    if (!transcribedText.trim()) {
      throw new Error('音声認識結果が空です');
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
      JSON.stringify({ 
        error: error.message,
        details: error.stack
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});