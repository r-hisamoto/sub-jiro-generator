import { WebGPUService } from '../webgpu/WebGPUService';
import { PerformanceService } from '../performance/PerformanceService';

const CHUNK_SIZE = 25 * 1024 * 1024; // 25MB（チャンク分割を無効化）

export type ProgressCallback = (progress: number) => void;

export class WhisperService {
  private isProcessing: boolean = false;

  constructor(
    private webGPUService: WebGPUService,
    private performanceService: PerformanceService,
    private apiKey: string
  ) {
    if (!this.apiKey) {
      throw new Error('OpenAI APIキーが設定されていません');
    }
  }

  async transcribe(
    file: File,
    onProgress?: ProgressCallback,
    signal?: AbortSignal
  ): Promise<string> {
    if (this.isProcessing) {
      throw new Error('別の音声解析が進行中です');
    }

    this.isProcessing = true;
    this.performanceService.startMeasurement('transcribe');

    try {
      if (signal?.aborted) {
        throw new Error('処理がキャンセルされました');
      }

      // ファイルの存在チェック
      if (!file) {
        throw new Error('ファイルが指定されていません');
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

      // ファイルの読み込みチェック
      let arrayBuffer: ArrayBuffer;
      try {
        arrayBuffer = await file.arrayBuffer();
        if (arrayBuffer.byteLength === 0) {
          throw new Error('ファイルの内容が空です');
        }
      } catch (error) {
        throw new Error(`ファイルの読み込みに失敗しました: ${error.message}`);
      }

      // FormDataの作成
      const formData = new FormData();
      formData.append('file', file);
      formData.append('model', 'whisper-1');
      formData.append('language', 'ja');
      formData.append('response_format', 'json');

      console.log('音声解析を開始します:', {
        fileSize: file.size,
        fileType: file.type,
        fileName: file.name
      });

      onProgress?.(10);

      // APIリクエスト
      let response: Response;
      try {
        response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: formData,
          signal
        });
      } catch (error) {
        if (error.name === 'AbortError') {
          throw new Error('処理がキャンセルされました');
        }
        throw new Error(`APIリクエストに失敗しました: ${error.message}`);
      }

      onProgress?.(50);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Whisper API エラー:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`音声認識に失敗しました: ${response.status} - ${errorText}`);
      }

      let result;
      try {
        result = await response.json();
      } catch (error) {
        throw new Error(`APIレスポンスの解析に失敗しました: ${error.message}`);
      }

      console.log('音声解析結果:', result);

      onProgress?.(90);

      if (!result || !result.text) {
        console.error('Whisper APIからの応答が不正です:', result);
        throw new Error('音声認識結果が不正です');
      }

      const text = result.text.trim();
      if (text.length === 0) {
        throw new Error('音声認識結果が空文字列です');
      }

      console.log('音声解析が完了しました');
      onProgress?.(100);
      return text;
    } catch (error) {
      console.error('音声解析エラー:', error);
      throw error;
    } finally {
      this.isProcessing = false;
      this.performanceService.endMeasurement('transcribe');
    }
  }
} 