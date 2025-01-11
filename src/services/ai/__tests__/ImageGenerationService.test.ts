import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ImageGenerationService } from '../ImageGenerationService';
import { PerformanceService } from '@/services/performance/PerformanceService';

describe('ImageGenerationService', () => {
  let imageGenerationService: ImageGenerationService;
  let mockPerformanceService: PerformanceService;

  beforeEach(() => {
    mockPerformanceService = {
      startMeasurement: vi.fn(),
      endMeasurement: vi.fn().mockReturnValue({ duration: 100, memoryDelta: 0 }),
    } as unknown as PerformanceService;

    imageGenerationService = new ImageGenerationService(mockPerformanceService);
  });

  it('シード画像から画像を生成できる', async () => {
    const mockSeedImage = new File([''], 'seed.png', { type: 'image/png' });
    const mockPrompt = 'テスト用プロンプト';
    const mockNegativePrompt = 'テスト用ネガティブプロンプト';
    const mockCount = 5;

    const result = await imageGenerationService.generateFromSeed(
      mockSeedImage,
      mockPrompt,
      mockNegativePrompt,
      mockCount
    );

    expect(result).toHaveLength(mockCount);
    expect(result[0]).toHaveProperty('url');
    expect(result[0]).toHaveProperty('metadata');
  });

  it('大量の画像生成要求を適切に処理する', async () => {
    const mockSeedImage = new File([''], 'seed.png', { type: 'image/png' });
    const mockPrompt = 'テスト用プロンプト';
    const mockCount = 25; // バッチ処理が必要な数

    const result = await imageGenerationService.generateFromSeed(
      mockSeedImage,
      mockPrompt,
      '',
      mockCount
    );

    expect(result).toHaveLength(mockCount);
    expect(mockPerformanceService.startMeasurement).toHaveBeenCalledTimes(2); // 2バッチに分割されるはず
  });

  it('画像解析と自動プロンプト生成が機能する', async () => {
    const mockImage = new File([''], 'test.png', { type: 'image/png' });
    
    const analysis = await imageGenerationService.analyzeImage(mockImage);
    
    expect(analysis).toHaveProperty('features');
    expect(analysis).toHaveProperty('suggestedPrompts');
    expect(analysis.suggestedPrompts).toHaveLength(4); // 4つの異なるバリエーション
  });

  it('生成された画像が適切に管理される', async () => {
    const mockSeedImage = new File([''], 'seed.png', { type: 'image/png' });
    const mockPrompt = 'テスト用プロンプト';
    
    const result = await imageGenerationService.generateFromSeed(
      mockSeedImage,
      mockPrompt,
      '',
      1
    );

    const savedImages = await imageGenerationService.getSavedImages();
    expect(savedImages).toContainEqual(expect.objectContaining({
      id: result[0].id,
      prompt: mockPrompt
    }));
  });

  it('エラー時に適切に処理される', async () => {
    const mockSeedImage = new File([''], 'invalid.txt', { type: 'text/plain' });
    
    await expect(
      imageGenerationService.generateFromSeed(mockSeedImage, '', '', 1)
    ).rejects.toThrow('Invalid image format');
  });

  it('メタデータが正しく保存される', async () => {
    const mockSeedImage = new File([''], 'seed.png', { type: 'image/png' });
    const mockPrompt = 'テスト用プロンプト';
    
    const result = await imageGenerationService.generateFromSeed(
      mockSeedImage,
      mockPrompt,
      '',
      1
    );

    expect(result[0].metadata).toEqual(expect.objectContaining({
      prompt: mockPrompt,
      timestamp: expect.any(Number),
      seedImageName: 'seed.png'
    }));
  });
}); 