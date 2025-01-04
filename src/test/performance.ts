import { performance } from 'perf_hooks';
import { expect } from 'vitest';
import { fireEvent } from '@testing-library/react';

export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  fps: number;
}

export const measurePerformance = async (
  callback: () => Promise<void> | void,
  iterations: number = 1
): Promise<PerformanceMetrics> => {
  const times: number[] = [];
  const memoryUsages: number[] = [];
  const fpsMeasurements: number[] = [];

  for (let i = 0; i < iterations; i++) {
    // メモリ使用量の測定開始
    const startMemory = process.memoryUsage().heapUsed;

    // レンダリング時間の測定
    const startTime = performance.now();
    await callback();
    const endTime = performance.now();
    times.push(endTime - startTime);

    // メモリ使用量の測定終了
    const endMemory = process.memoryUsage().heapUsed;
    memoryUsages.push(endMemory - startMemory);

    // FPSの測定
    const fps = 1000 / (endTime - startTime);
    fpsMeasurements.push(fps);

    // 次の反復の前に少し待機
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // 平均値を計算
  const averageRenderTime = times.reduce((a, b) => a + b, 0) / times.length;
  const averageMemoryUsage = memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length;
  const averageFps = fpsMeasurements.reduce((a, b) => a + b, 0) / fpsMeasurements.length;

  return {
    renderTime: averageRenderTime,
    memoryUsage: averageMemoryUsage,
    fps: averageFps,
  };
};

export const assertPerformance = (
  metrics: PerformanceMetrics,
  thresholds: Partial<{
    maxRenderTime: number;
    maxMemoryUsage: number;
    minFps: number;
  }>
): void => {
  if (thresholds.maxRenderTime !== undefined) {
    expect(metrics.renderTime).toBeLessThan(thresholds.maxRenderTime);
  }

  if (thresholds.maxMemoryUsage !== undefined) {
    expect(metrics.memoryUsage).toBeLessThan(thresholds.maxMemoryUsage);
  }

  if (thresholds.minFps !== undefined) {
    expect(metrics.fps).toBeGreaterThan(thresholds.minFps);
  }
};

export const generateLargeSubtitleList = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i.toString(),
    startTime: i * 5,
    endTime: (i * 5) + 4,
    text: `テスト字幕 ${i + 1}`.repeat(10),
  }));
};

export const simulateUserInteraction = async (element: Element, interactions: number) => {
  const actions = [
    () => fireEvent.click(element),
    () => fireEvent.mouseEnter(element),
    () => fireEvent.mouseLeave(element),
    () => fireEvent.focus(element),
    () => fireEvent.blur(element),
  ];

  for (let i = 0; i < interactions; i++) {
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    await randomAction();
    await new Promise(resolve => setTimeout(resolve, 16)); // ~60fps
  }
}; 