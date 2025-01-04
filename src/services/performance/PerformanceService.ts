import { Subtitle } from '@/types';

interface PerformanceMetrics {
  duration: number;
  fps: number;
  memoryUsage?: number;
}

export class PerformanceService {
  private measurements: Map<string, { startTime: number; memory: number }>;
  private static instance: PerformanceService;

  private constructor() {
    this.measurements = new Map();
  }

  static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  startMeasurement(id: string): void {
    const startTime = performance.now();
    const memory = (performance as any).memory?.usedJSHeapSize || 0;
    this.measurements.set(id, { startTime, memory });
  }

  endMeasurement(id: string): { duration: number; memoryDelta: number } {
    const endTime = performance.now();
    const endMemory = (performance as any).memory?.usedJSHeapSize || 0;
    const measurement = this.measurements.get(id);

    if (!measurement) {
      throw new Error(`No measurement found for id: ${id}`);
    }

    const duration = endTime - measurement.startTime;
    const memoryDelta = endMemory - measurement.memory;

    // 測定データをクリーンアップ
    this.measurements.delete(id);

    return {
      duration,
      memoryDelta
    };
  }

  clearMeasurements(): void {
    this.measurements.clear();
  }

  async optimizeMemory(): Promise<void> {
    if (globalThis.gc) {
      // ガベージコレクションを実行（Node.js環境でのみ動作）
      globalThis.gc();
    }
    // メモリ使用量を最適化するための追加の処理
    this.measurements.clear();
    await new Promise(resolve => setTimeout(resolve, 0)); // マイクロタスクキューをクリア
  }

  async processSubtitles(subtitles: Subtitle[]): Promise<void> {
    // 字幕データの処理を最適化
    const batchSize = 100;
    for (let i = 0; i < subtitles.length; i += batchSize) {
      const batch = subtitles.slice(i, i + batchSize);
      await this.processBatch(batch);
    }
  }

  private async processBatch(subtitles: Subtitle[]): Promise<void> {
    await Promise.all(
      subtitles.map(async (subtitle) => {
        await this.processSubtitle(subtitle);
      })
    );
  }

  private async processSubtitle(subtitle: Subtitle): Promise<void> {
    // 個別の字幕処理を最適化
    await new Promise(resolve => setTimeout(resolve, 0.1)); // シミュレーション用の遅延を短縮
  }

  async searchSubtitles(subtitles: Subtitle[], query: string): Promise<Subtitle[]> {
    // 検索処理を最適化
    const normalizedQuery = query.toLowerCase();
    return subtitles.filter(subtitle => 
      subtitle.text.toLowerCase().includes(normalizedQuery)
    );
  }

  async updateSubtitle(subtitles: Subtitle[], id: string, newText: string): Promise<void> {
    // 更新処理を最適化
    const subtitle = subtitles.find(s => s.id === id);
    if (subtitle) {
      subtitle.text = newText;
    }
  }

  async batchProcessSubtitles(
    subtitles: Subtitle[],
    processor: (subtitle: Subtitle) => Subtitle
  ): Promise<void> {
    // 一括処理を最適化
    const batchSize = 50;
    for (let i = 0; i < subtitles.length; i += batchSize) {
      const batch = subtitles.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (subtitle) => {
          const processed = processor(subtitle);
          Object.assign(subtitle, processed);
        })
      );
    }
  }
} 