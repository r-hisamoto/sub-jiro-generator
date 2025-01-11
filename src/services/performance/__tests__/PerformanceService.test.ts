import { describe, it, expect, vi } from 'vitest';
import { PerformanceService } from '../PerformanceService';

describe('PerformanceService', () => {
  let performanceService: PerformanceService;

  beforeEach(() => {
    performanceService = PerformanceService.getInstance();
    performanceService.clearMeasurements();
  });

  it('正しく時間を測定できる', () => {
    performanceService.startMeasurement('test');
    // 100ms待機
    const start = Date.now();
    while (Date.now() - start < 100) {
      // ビジーウェイト
    }
    const result = performanceService.endMeasurement('test');
    
    expect(result.duration).toBeGreaterThanOrEqual(90);
    expect(result.duration).toBeLessThanOrEqual(110);
  });

  it('存在しない測定のエラーを適切に処理する', () => {
    expect(() => {
      performanceService.endMeasurement('nonexistent');
    }).toThrow('No measurement found for id: nonexistent');
  });

  it('メモリ使用量の変化を測定できる', async () => {
    performanceService.startMeasurement('memory');
    
    // メモリ使用量を増やす
    const array = new Array(1000000).fill(0);
    
    const result = performanceService.endMeasurement('memory');
    expect(result.memoryDelta).toBeGreaterThanOrEqual(0);
    
    // クリーンアップ
    await performanceService.optimizeMemory();
  });

  it('複数の測定を同時に行える', () => {
    performanceService.startMeasurement('test1');
    performanceService.startMeasurement('test2');
    
    const start = Date.now();
    while (Date.now() - start < 50) {
      // ビジーウェイト
    }
    
    const result1 = performanceService.endMeasurement('test1');
    const result2 = performanceService.endMeasurement('test2');
    
    expect(result1.duration).toBeGreaterThanOrEqual(45);
    expect(result1.duration).toBeLessThanOrEqual(55);
    expect(result2.duration).toBeGreaterThanOrEqual(45);
    expect(result2.duration).toBeLessThanOrEqual(55);
  });

  it('測定をクリアできる', () => {
    performanceService.startMeasurement('test');
    performanceService.clearMeasurements();
    
    expect(() => {
      performanceService.endMeasurement('test');
    }).toThrow('No measurement found for id: test');
  });
}); 