import { WebGPUService } from '../webgpu/WebGPUService';
import { PerformanceService } from '../performance/PerformanceService';
import { WhisperService } from './WhisperService';

// シングルトンインスタンスの作成
let whisperServiceInstance: WhisperService | null = null;

export const initializeWhisperService = async () => {
  if (whisperServiceInstance) {
    return whisperServiceInstance;
  }

  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI APIキーが設定されていません。環境変数 NEXT_PUBLIC_OPENAI_API_KEY を設定してください。');
  }

  const webGPUService = new WebGPUService();
  const performanceService = PerformanceService.getInstance();

  whisperServiceInstance = new WhisperService(
    webGPUService,
    performanceService,
    apiKey
  );

  return whisperServiceInstance;
};

export const getWhisperService = () => {
  if (!whisperServiceInstance) {
    throw new Error('WhisperServiceが初期化されていません。initializeWhisperService()を先に呼び出してください。');
  }
  return whisperServiceInstance;
}; 