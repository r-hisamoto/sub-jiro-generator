import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VideoPlayer } from '../VideoPlayer/VideoPlayer';

describe('VideoPlayer', () => {
  const mockHandlers = {
    onTimeUpdate: vi.fn(),
    onDurationChange: vi.fn(),
  };

  const mockVideoSrc = 'test-video.mp4';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ビデオプレーヤーが正しくレンダリングされる', () => {
    render(
      <VideoPlayer
        src={mockVideoSrc}
        currentTime={0}
        onTimeUpdate={mockHandlers.onTimeUpdate}
        onDurationChange={mockHandlers.onDurationChange}
      />
    );

    const video = screen.getByTestId('video-player');
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute('src', mockVideoSrc);
    expect(video).toHaveAttribute('controls');
  });

  it('時間の更新が正しく動作する', () => {
    render(
      <VideoPlayer
        src={mockVideoSrc}
        currentTime={10}
        onTimeUpdate={mockHandlers.onTimeUpdate}
        onDurationChange={mockHandlers.onDurationChange}
      />
    );

    const video = screen.getByTestId('video-player');
    fireEvent.timeUpdate(video);

    expect(mockHandlers.onTimeUpdate).toHaveBeenCalled();
  });

  it('動画の長さの変更が正しく動作する', () => {
    render(
      <VideoPlayer
        src={mockVideoSrc}
        currentTime={0}
        onTimeUpdate={mockHandlers.onTimeUpdate}
        onDurationChange={mockHandlers.onDurationChange}
      />
    );

    const video = screen.getByTestId('video-player');
    fireEvent.durationChange(video);

    expect(mockHandlers.onDurationChange).toHaveBeenCalled();
  });

  it('currentTimeの変更が反映される', () => {
    const { rerender } = render(
      <VideoPlayer
        src={mockVideoSrc}
        currentTime={0}
        onTimeUpdate={mockHandlers.onTimeUpdate}
        onDurationChange={mockHandlers.onDurationChange}
      />
    );

    const video = screen.getByTestId('video-player') as HTMLVideoElement;
    
    // currentTimeを更新
    rerender(
      <VideoPlayer
        src={mockVideoSrc}
        currentTime={15}
        onTimeUpdate={mockHandlers.onTimeUpdate}
        onDurationChange={mockHandlers.onDurationChange}
      />
    );

    expect(video.currentTime).toBe(15);
  });

  it('エラー状態が正しく処理される', () => {
    render(
      <VideoPlayer
        src="invalid-video.mp4"
        currentTime={0}
        onTimeUpdate={mockHandlers.onTimeUpdate}
        onDurationChange={mockHandlers.onDurationChange}
      />
    );

    const video = screen.getByTestId('video-player');
    fireEvent.error(video);

    // エラーイベントがスローされても、コンポーネントはクラッシュしない
    expect(video).toBeInTheDocument();
  });

  it('動画の読み込みが正しく処理される', () => {
    render(
      <VideoPlayer
        src={mockVideoSrc}
        currentTime={0}
        onTimeUpdate={mockHandlers.onTimeUpdate}
        onDurationChange={mockHandlers.onDurationChange}
      />
    );

    const video = screen.getByTestId('video-player');
    fireEvent.loadedData(video);

    // 動画が読み込まれた後もコンポーネントは正常に動作する
    expect(video).toBeInTheDocument();
  });
}); 