import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WhisperService, ProgressCallback } from '../WhisperService';
import { WebGPUService } from '../../webgpu/WebGPUService';
import { HfInference } from '@huggingface/inference';
import { PerformanceService } from '../../performance/PerformanceService';

vi.mock('../../webgpu/WebGPUService');
vi.mock('@huggingface/inference');
vi.mock('../../performance/PerformanceService');

// HfInferenceのカスタム型定義
interface CustomHfInference extends HfInference {
  audioToText: (params: { data: File; model: string }) => Promise<{ text: string }>;
}

describe('WhisperService', () => {
  let whisperService: WhisperService;
  let mockWebGPUService: WebGPUService;
  let mockHfInference: CustomHfInference;
  let mockPerformanceService: PerformanceService;
  let onProgressMock: ProgressCallback;

  beforeEach(() => {
    mockWebGPUService = new WebGPUService();
    vi.spyOn(mockWebGPUService, 'isSupported').mockResolvedValue(true);
    vi.spyOn(mockWebGPUService, 'processAudio').mockResolvedValue('テスト文字起こし結果');

    const mockAudioToText = vi.fn().mockResolvedValue({ text: 'API文字起こし結果' });
    mockHfInference = {
      accessToken: 'dummy-token',
      defaultOptions: {},
      endpoint: (url: string) => ({
        url,
        headers: {},
        request: vi.fn(),
        streamingRequest: vi.fn(),
        audioClassification: vi.fn(),
        automaticSpeechRecognition: vi.fn(),
        conversational: vi.fn(),
        featureExtraction: vi.fn(),
        fillMask: vi.fn(),
        imageClassification: vi.fn(),
        imageSegmentation: vi.fn(),
        imageToText: vi.fn(),
        objectDetection: vi.fn(),
        questionAnswer: vi.fn(),
        summarization: vi.fn(),
        tableQuestionAnswer: vi.fn(),
        textClassification: vi.fn(),
        textGeneration: vi.fn(),
        textToImage: vi.fn(),
        textToSpeech: vi.fn(),
        tokenClassification: vi.fn(),
        translation: vi.fn(),
        visualQuestionAnswering: vi.fn(),
        zeroShotClassification: vi.fn(),
        zeroShotImageClassification: vi.fn()
      }),
      request: vi.fn(),
      audioToText: mockAudioToText
    } as unknown as CustomHfInference;

    mockPerformanceService = PerformanceService.getInstance();
    vi.spyOn(mockPerformanceService, 'startMeasurement');
    vi.spyOn(mockPerformanceService, 'endMeasurement').mockReturnValue({ duration: 100, memoryDelta: 0 });

    onProgressMock = vi.fn() as ProgressCallback;
    whisperService = new WhisperService(mockWebGPUService, mockHfInference, mockPerformanceService);
  });

  it('WebGPUが利用可能な場合はWebGPUを使用する', async () => {
    const mockFile = new File([''], 'test.wav', { type: 'audio/wav' });
    const result = await whisperService.transcribe(mockFile);

    expect(result).toBe('テスト文字起こし結果');
    expect(mockWebGPUService.processAudio).toHaveBeenCalled();
    expect(mockHfInference.audioToText).not.toHaveBeenCalled();
  });

  it('WebGPUが利用できない場合はHugging Face APIを使用する', async () => {
    vi.spyOn(mockWebGPUService, 'isSupported').mockResolvedValue(false);
    const mockFile = new File([''], 'test.wav', { type: 'audio/wav' });
    const result = await whisperService.transcribe(mockFile);

    expect(result).toBe('API文字起こし結果');
    expect(mockWebGPUService.processAudio).not.toHaveBeenCalled();
    expect(mockHfInference.audioToText).toHaveBeenCalledWith({
      data: mockFile,
      model: 'openai/whisper-large-v3'
    });
  });

  it('エラーが発生した場合は適切に処理する', async () => {
    vi.spyOn(mockWebGPUService, 'isSupported').mockRejectedValue(new Error('WebGPUエラー'));
    vi.spyOn(mockHfInference, 'audioToText').mockRejectedValue(new Error('APIエラー'));

    const mockFile = new File([''], 'test.wav', { type: 'audio/wav' });
    await expect(whisperService.transcribe(mockFile)).rejects.toThrow('文字起こしに失敗しました');
  });

  it('大きなオーディオファイルを適切に処理する', async () => {
    const mockFile = new File([new ArrayBuffer(1024 * 1024 * 10)], 'test.wav', { type: 'audio/wav' });
    
    vi.spyOn(mockWebGPUService, 'processAudio').mockImplementation(async (data: File) => {
      expect(data.size).toBeLessThanOrEqual(1024 * 1024 * 5); // 5MB以下のチャンクに分割されていることを確認
      return 'テスト文字起こし結果';
    });

    await whisperService.transcribe(mockFile);
    expect(mockWebGPUService.processAudio).toHaveBeenCalled();
  });

  it('パフォーマンス測定が正しく行われる', async () => {
    const mockFile = new File([''], 'test.wav', { type: 'audio/wav' });
    await whisperService.transcribe(mockFile);

    expect(mockPerformanceService.startMeasurement).toHaveBeenCalled();
    expect(mockPerformanceService.endMeasurement).toHaveBeenCalled();
  });

  it('異なる音声フォーマットを適切に処理する', async () => {
    const formats = [
      { type: 'audio/wav', name: 'test.wav' },
      { type: 'audio/mp3', name: 'test.mp3' },
      { type: 'audio/ogg', name: 'test.ogg' },
      { type: 'audio/m4a', name: 'test.m4a' }
    ];

    for (const format of formats) {
      const mockFile = new File([''], format.name, { type: format.type });
      const result = await whisperService.transcribe(mockFile);
      expect(result).toBeTruthy();
    }
  });

  it('進捗状況が正しく通知される', async () => {
    const mockFile = new File([''], 'test.wav', { type: 'audio/wav' });
    await whisperService.transcribe(mockFile, onProgressMock);

    expect(onProgressMock).toHaveBeenCalledWith(0);
    expect(onProgressMock).toHaveBeenCalledWith(100);
  });

  it('処理をキャンセルできる', async () => {
    const mockFile = new File([''], 'test.wav', { type: 'audio/wav' });
    const abortController = new AbortController();

    const transcribePromise = whisperService.transcribe(mockFile, undefined, abortController.signal);
    abortController.abort();

    await expect(transcribePromise).rejects.toThrow('処理がキャンセルされました');
  });
}); 