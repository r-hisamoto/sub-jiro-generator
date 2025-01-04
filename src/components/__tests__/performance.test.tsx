import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SubtitleEditor } from '../SubtitleEditor';
import { PerformanceService } from '@/services/performance/PerformanceService';

describe('パフォーマンステスト', () => {
  const performanceService = new PerformanceService();

  it('大量の字幕を含むSubtitleEditorのレンダリングパフォーマンス', async () => {
    performanceService.startMeasurement('render');

    const subtitles = Array.from({ length: 1000 }, (_, i) => ({
      id: `${i}`,
      text: `テスト字幕 ${i}`,
      startTime: i * 5,
      endTime: (i * 5) + 4
    }));

    const mockProps = {
      subtitles,
      currentTime: 0,
      onSubtitleUpdate: vi.fn(),
      onSubtitleDelete: vi.fn(),
      onSubtitleAdd: vi.fn()
    };

    render(<SubtitleEditor {...mockProps} />);

    const metrics = performanceService.endMeasurement('render');
    expect(metrics.duration).toBeLessThan(1000); // 1秒以内にレンダリングが完了すること
  });

  it('字幕の編集操作のパフォーマンス', async () => {
    const subtitles = Array.from({ length: 100 }, (_, i) => ({
      id: `${i}`,
      text: `テスト字幕 ${i}`,
      startTime: i * 5,
      endTime: (i * 5) + 4
    }));

    const mockProps = {
      subtitles,
      currentTime: 0,
      onSubtitleUpdate: vi.fn(),
      onSubtitleDelete: vi.fn(),
      onSubtitleAdd: vi.fn()
    };

    render(<SubtitleEditor {...mockProps} />);

    performanceService.startMeasurement('edit');

    // 複数の字幕を編集
    const textareas = screen.getAllByRole('textbox');
    for (let i = 0; i < 10; i++) {
      fireEvent.change(textareas[i], {
        target: { value: `編集後の字幕 ${i}` }
      });
    }

    const metrics = performanceService.endMeasurement('edit');
    expect(metrics.duration).toBeLessThan(500); // 500ミリ秒以内に編集が完了すること
  });

  it('メモリリークのチェック', async () => {
    performanceService.startMeasurement('memory');

    const subtitles = Array.from({ length: 500 }, (_, i) => ({
      id: `${i}`,
      text: `テスト字幕 ${i}`,
      startTime: i * 5,
      endTime: (i * 5) + 4
    }));

    const mockProps = {
      subtitles,
      currentTime: 0,
      onSubtitleUpdate: vi.fn(),
      onSubtitleDelete: vi.fn(),
      onSubtitleAdd: vi.fn()
    };

    const { unmount } = render(<SubtitleEditor {...mockProps} />);
    unmount();

    const metrics = performanceService.endMeasurement('memory');
    expect(metrics.duration).toBeLessThan(100); // 100ミリ秒以内にクリーンアップが完了すること
  });
}); 