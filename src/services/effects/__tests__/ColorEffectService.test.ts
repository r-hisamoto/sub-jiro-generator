import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ColorEffectService } from '../ColorEffectService';
import { PerformanceService } from '@/services/performance/PerformanceService';

describe('ColorEffectService', () => {
  let colorEffectService: ColorEffectService;
  let mockPerformanceService: PerformanceService;

  beforeEach(() => {
    mockPerformanceService = {
      startMeasurement: vi.fn(),
      endMeasurement: vi.fn().mockReturnValue({ duration: 100, memoryDelta: 0 }),
    } as unknown as PerformanceService;

    colorEffectService = new ColorEffectService(mockPerformanceService);
  });

  it('プリセットフィルターが適用できる', async () => {
    const mockImage = new File([''], 'test.png', { type: 'image/png' });
    const filterType = 'sepia';
    
    const result = await colorEffectService.applyPresetFilter(mockImage, filterType);
    
    expect(result).toHaveProperty('url');
    expect(result).toHaveProperty('filter', filterType);
  });

  it('複数のプリセットフィルターが利用可能', async () => {
    const filters = await colorEffectService.getAvailableFilters();
    
    expect(filters).toContain('sepia');
    expect(filters).toContain('grayscale');
    expect(filters).toContain('vintage');
    expect(filters).toContain('warm');
    expect(filters).toContain('cool');
    expect(filters).toContain('dramatic');
    expect(filters).toContain('fade');
  });

  it('カスタムフィルターが作成できる', async () => {
    const mockImage = new File([''], 'test.png', { type: 'image/png' });
    const customSettings = {
      brightness: 1.2,
      contrast: 1.1,
      saturation: 0.9,
      hue: 10,
      opacity: 0.95
    };
    
    const result = await colorEffectService.applyCustomFilter(mockImage, customSettings);
    
    expect(result).toHaveProperty('url');
    expect(result).toHaveProperty('settings', customSettings);
  });

  it('フィルター設定が保存・読み込みできる', async () => {
    const customSettings = {
      name: 'MyFilter',
      settings: {
        brightness: 1.2,
        contrast: 1.1,
        saturation: 0.9,
        hue: 10,
        opacity: 0.95
      }
    };
    
    await colorEffectService.saveFilterPreset(customSettings);
    const savedPresets = await colorEffectService.getFilterPresets();
    
    expect(savedPresets).toContainEqual(customSettings);
  });

  it('明るさ調整が機能する', async () => {
    const mockImage = new File([''], 'test.png', { type: 'image/png' });
    const brightness = 1.5;
    
    const result = await colorEffectService.adjustBrightness(mockImage, brightness);
    
    expect(result).toHaveProperty('url');
    expect(result).toHaveProperty('brightness', brightness);
  });

  it('コントラスト調整が機能する', async () => {
    const mockImage = new File([''], 'test.png', { type: 'image/png' });
    const contrast = 1.3;
    
    const result = await colorEffectService.adjustContrast(mockImage, contrast);
    
    expect(result).toHaveProperty('url');
    expect(result).toHaveProperty('contrast', contrast);
  });

  it('彩度調整が機能する', async () => {
    const mockImage = new File([''], 'test.png', { type: 'image/png' });
    const saturation = 0.8;
    
    const result = await colorEffectService.adjustSaturation(mockImage, saturation);
    
    expect(result).toHaveProperty('url');
    expect(result).toHaveProperty('saturation', saturation);
  });

  it('色相回転が機能する', async () => {
    const mockImage = new File([''], 'test.png', { type: 'image/png' });
    const hue = 45;
    
    const result = await colorEffectService.rotateHue(mockImage, hue);
    
    expect(result).toHaveProperty('url');
    expect(result).toHaveProperty('hue', hue);
  });

  it('不透明度調整が機能する', async () => {
    const mockImage = new File([''], 'test.png', { type: 'image/png' });
    const opacity = 0.7;
    
    const result = await colorEffectService.adjustOpacity(mockImage, opacity);
    
    expect(result).toHaveProperty('url');
    expect(result).toHaveProperty('opacity', opacity);
  });

  it('エラー時に適切に処理される', async () => {
    const invalidImage = new File([''], 'invalid.txt', { type: 'text/plain' });
    
    await expect(
      colorEffectService.applyPresetFilter(invalidImage, 'sepia')
    ).rejects.toThrow('Invalid image format');
  });
}); 