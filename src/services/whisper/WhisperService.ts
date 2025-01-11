import { WebGPUService } from '../webgpu/WebGPUService';
import { PerformanceService } from '../performance/PerformanceService';

const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks
const MAX_PARALLEL_CHUNKS = 3; // 同時に処理するチャンクの最大数

export type ProgressCallback = (progress: number) => void;

export class WhisperService {
  private webGPUService: WebGPUService;
  private performanceService: PerformanceService;
  private apiKey: string;

  constructor(
    webGPUService: WebGPUService,
    performanceService: PerformanceService,
    apiKey: string
  ) {
    if (!apiKey) {
      throw new Error('OpenAI APIキーが設定されていません');
    }
    this.webGPUService = webGPUService;
    this.performanceService = performanceService;
    this.apiKey = apiKey;
  }

  private async* splitAudioIntoChunks(audioData: ArrayBuffer): AsyncGenerator<Uint8Array> {
    const data = new Uint8Array(audioData);
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      yield data.slice(i, Math.min(i + CHUNK_SIZE, data.length));
    }
  }

  private async transcribeChunk(chunk: Uint8Array): Promise<string> {
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
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: formData
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
      return result.text;
    } catch (error) {
      console.error('Chunk transcription error:', error);
      throw error;
    }
  }

  async transcribe(
    file: File,
    onProgress?: ProgressCallback,
    signal?: AbortSignal
  ): Promise<string> {
    this.performanceService.startMeasurement('transcribe');

    try {
      if (signal?.aborted) {
        throw new Error('処理がキャンセルされました');
      }

      // ファイルサイズチェック
      const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('ファイルサイズが大きすぎます（最大25MB）');
      }

      // ファイル形式チェック
      if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
        throw new Error('対応していないファイル形式です');
      }

      onProgress?.(0);

      const audioData = await file.arrayBuffer();
      const chunks: Uint8Array[] = [];
      for await (const chunk of this.splitAudioIntoChunks(audioData)) {
        chunks.push(chunk);
      }

      let transcribedText = '';
      let processedChunks = 0;

      // チャンクを並列処理
      for (let i = 0; i < chunks.length; i += MAX_PARALLEL_CHUNKS) {
        const chunkGroup = chunks.slice(i, i + MAX_PARALLEL_CHUNKS);
        const results = await Promise.all(
          chunkGroup.map(async (chunk, index) => {
            try {
              console.log(`Processing chunk ${i + index + 1}/${chunks.length}`);
              return await this.transcribeChunk(chunk);
            } catch (error) {
              console.error(`Chunk ${i + index + 1} failed:`, error);
              return ''; // エラー時は空文字を返す
            }
          })
        );

        transcribedText += results.join(' ');
        processedChunks += chunkGroup.length;
        onProgress?.(Math.min((processedChunks / chunks.length) * 100, 100));

        // メモリ解放のためにガベージコレクションを促す
        if (i % (MAX_PARALLEL_CHUNKS * 2) === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      if (!transcribedText.trim()) {
        throw new Error('音声認識結果が空です');
      }

      onProgress?.(100);
      return transcribedText.trim();
    } catch (error) {
      console.error('Transcription error:', error);
      throw error;
    } finally {
      this.performanceService.endMeasurement('transcribe');
    }
  }
} 