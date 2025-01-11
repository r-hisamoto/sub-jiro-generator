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
      // APIキーの確認
      if (!this.apiKey) {
        console.error('WhisperService: APIキーが設定されていません');
        throw new Error('APIキーが設定されていません');
      }

      console.log('WhisperService: 音声解析開始', {
        apiKeyLength: this.apiKey.length,
        fileSize: file.size,
        fileType: file.type,
        fileName: file.name
      });

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

      // FormDataの作成
      const formData = new FormData();
      formData.append('file', file);
      formData.append('model', 'whisper-1');
      formData.append('language', 'ja');
      formData.append('response_format', 'json');

      console.log('WhisperService: APIリクエスト準備完了', {
        model: 'whisper-1',
        language: 'ja',
        response_format: 'json'
      });

      onProgress?.(10);

      // APIリクエスト
      console.log('WhisperService: APIリクエスト開始');
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: formData,
        signal
      });

      console.log('WhisperService: APIレスポンス受信', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('WhisperService: APIエラー', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`音声認識に失敗しました: ${response.status} - ${errorText}`);
      }

      const responseText = await response.text();
      console.log('WhisperService: レスポンステキスト', responseText);

      let result;
      try {
        result = JSON.parse(responseText);
        console.log('WhisperService: 解析結果', result);
      } catch (error) {
        console.error('WhisperService: JSONパースエラー', error);
        throw new Error('APIレスポンスの解析に失敗しました');
      }

      if (!result || !result.text) {
        console.error('WhisperService: 不正な応答', result);
        throw new Error('音声認識結果が不正です');
      }

      const text = result.text.trim();
      console.log('WhisperService: 最終テキスト', { text, length: text.length });

      return text;
    } catch (error) {
      console.error('WhisperService: エラー発生', error);
      throw error;
    } finally {
      this.isProcessing = false;
      this.performanceService.endMeasurement('transcribe');
    }
  }
} 