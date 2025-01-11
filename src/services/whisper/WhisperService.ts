import { WebGPUService } from '../webgpu/WebGPUService';
import { HfInference } from '@huggingface/inference';
import { PerformanceService } from '../performance/PerformanceService';

export type ProgressCallback = (progress: number) => void;

export class WhisperService {
  private webGPUService: WebGPUService;
  private hfInference: HfInference;
  private performanceService: PerformanceService;

  constructor(
    webGPUService: WebGPUService,
    hfInference: HfInference,
    performanceService: PerformanceService
  ) {
    this.webGPUService = webGPUService;
    this.hfInference = hfInference;
    this.performanceService = performanceService;
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

      const isWebGPUSupported = await this.webGPUService.isSupported();
      let result: string;

      if (isWebGPUSupported) {
        try {
          onProgress?.(0);
          await this.webGPUService.initializeDevice();
          result = await this.webGPUService.processAudio(file);
          onProgress?.(50);
          
          // WebGPUの結果が空または無効な場合はHugging Face APIにフォールバック
          if (!result || result === 'テスト文字起こし結果') {
            console.log('WebGPU処理が不完全なため、Hugging Face APIにフォールバック');
            result = await this.processWithHuggingFace(file);
          }
          onProgress?.(100);
        } catch (error) {
          console.warn('WebGPU処理でエラーが発生したため、Hugging Face APIにフォールバック:', error);
          result = await this.processWithHuggingFace(file);
        }
      } else {
        result = await this.processWithHuggingFace(file);
      }

      return result;
    } catch (error) {
      if (signal?.aborted) {
        throw new Error('処理がキャンセルされました');
      }
      console.error('文字起こしエラー:', error);
      throw error instanceof Error ? error : new Error('文字起こしに失敗しました');
    } finally {
      const metrics = this.performanceService.endMeasurement('transcribe');
      console.log('文字起こし性能メトリクス:', metrics);
    }
  }

  private async processWithHuggingFace(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('audio', file);
      formData.append('model', 'openai/whisper-large-v3');

      const response = await fetch('https://api-inference.huggingface.co/models/openai/whisper-large-v3', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUGGING_FACE_API_KEY}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Response:', errorData);
        throw new Error(`API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }

      const result = await response.json();
      return result.text || '';
    } catch (error) {
      console.error('Hugging Face API エラー:', error);
      throw new Error('Hugging Face APIでの処理に失敗しました');
    }
  }
} 