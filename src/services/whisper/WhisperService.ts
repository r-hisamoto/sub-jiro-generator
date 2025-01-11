import { WebGPUService } from '../webgpu/WebGPUService';
import { PerformanceService } from '../performance/PerformanceService';

const CHUNK_SIZE = 25 * 1024 * 1024; // 25MB（チャンク分割を無効化）

export type ProgressCallback = (progress: number) => void;

export class WhisperService {
  private webGPUService: WebGPUService;
  private performanceService: PerformanceService;
  private apiKey: string;
  private isProcessing: boolean = false;

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
      try {
        const arrayBuffer = await file.arrayBuffer();
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
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: formData,
        signal // AbortSignalを追加
      });

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

      const result = await response.json();
      console.log('音声解析結果:', result);

      onProgress?.(90);

      if (!result.text) {
        console.error('Whisper APIからの応答が空です:', result);
        throw new Error('音声認識結果が空です');
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