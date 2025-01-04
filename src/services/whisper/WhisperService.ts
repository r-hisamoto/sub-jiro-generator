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

      const isWebGPUSupported = await this.webGPUService.isSupported();

      if (isWebGPUSupported) {
        // WebGPUを使用した処理
        onProgress?.(0);
        const result = await this.webGPUService.processAudio(file);
        onProgress?.(100);
        return result;
      } else {
        // Hugging Face APIを使用した処理
        onProgress?.(0);
        const response = await this.hfInference.audioToText({
          data: file,
          model: 'openai/whisper-large-v3'
        });
        onProgress?.(100);
        return response.text;
      }
    } catch (error) {
      if (signal?.aborted) {
        throw new Error('処理がキャンセルされました');
      }
      console.error('文字起こしエラー:', error);
      throw new Error('文字起こしに失敗しました');
    } finally {
      const metrics = this.performanceService.endMeasurement('transcribe');
      console.log('文字起こし性能メトリクス:', metrics);
    }
  }
} 