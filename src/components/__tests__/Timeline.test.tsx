import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Timeline } from '../Timeline/Timeline';

describe('Timeline', () => {
  const mockSubtitles = [
    { id: '1', startTime: 0, endTime: 5, text: 'テスト字幕1' },
    { id: '2', startTime: 6, endTime: 10, text: 'テスト字幕2' },
  ];

  const mockHandlers = {
    onTimeChange: vi.fn(),
    onSubtitleClick: vi.fn(),
  };

  it('タイムラインが正しくレンダリングされる', () => {
    render(
      <Timeline
        subtitles={mockSubtitles}
        currentTime={0}
        duration={60}
        onTimeChange={mockHandlers.onTimeChange}
        onSubtitleClick={mockHandlers.onSubtitleClick}
      />
    );

    expect(screen.getByTestId('timeline')).toBeInTheDocument();
    expect(screen.getByText('0:00')).toBeInTheDocument();
    expect(screen.getByText('1:00')).toBeInTheDocument();
  });

  it('時間の更新が正しく動作する', async () => {
    render(
      <Timeline
        subtitles={mockSubtitles}
        currentTime={0}
        duration={60}
        onTimeChange={mockHandlers.onTimeChange}
        onSubtitleClick={mockHandlers.onSubtitleClick}
      />
    );

    const timeline = screen.getByTestId('timeline');
    await userEvent.click(timeline);

    expect(mockHandlers.onTimeChange).toHaveBeenCalled();
  });

  it('字幕の時間範囲が正しく表示される', () => {
    render(
      <Timeline
        subtitles={mockSubtitles}
        currentTime={0}
        duration={60}
        onTimeChange={mockHandlers.onTimeChange}
        onSubtitleClick={mockHandlers.onSubtitleClick}
      />
    );

    mockSubtitles.forEach(subtitle => {
      expect(screen.getByTitle(subtitle.text)).toBeInTheDocument();
    });
  });

  it('字幕クリックが正しく動作する', async () => {
    render(
      <Timeline
        subtitles={mockSubtitles}
        currentTime={0}
        duration={60}
        onTimeChange={mockHandlers.onTimeChange}
        onSubtitleClick={mockHandlers.onSubtitleClick}
      />
    );

    const subtitle = screen.getByTitle('テスト字幕1');
    await userEvent.click(subtitle);

    expect(mockHandlers.onSubtitleClick).toHaveBeenCalledWith('1');
  });

  it('キーボードショートカットが正しく動作する', async () => {
    render(
      <Timeline
        subtitles={mockSubtitles}
        currentTime={0}
        duration={60}
        onTimeChange={mockHandlers.onTimeChange}
        onSubtitleClick={mockHandlers.onSubtitleClick}
      />
    );

    const timeline = screen.getByTestId('timeline');
    timeline.focus();

    await userEvent.keyboard('{ArrowRight}');
    expect(mockHandlers.onTimeChange).toHaveBeenCalled();

    await userEvent.keyboard('{ArrowLeft}');
    expect(mockHandlers.onTimeChange).toHaveBeenCalled();
  });

  it('エラー状態が正しく処理される', () => {
    render(
      <Timeline
        subtitles={mockSubtitles}
        currentTime={-1} // 無効な時間
        duration={60}
        onTimeChange={mockHandlers.onTimeChange}
        onSubtitleClick={mockHandlers.onSubtitleClick}
      />
    );

    const progressBar = screen.getByTestId('timeline').children[0];
    expect(progressBar).toHaveStyle({ width: '0%' });
  });
}); 