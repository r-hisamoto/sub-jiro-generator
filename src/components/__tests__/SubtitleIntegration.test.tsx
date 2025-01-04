/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />
import { render, fireEvent, screen, act } from '@testing-library/react';
import { Timeline } from '../Timeline/Timeline';
import { SubtitleEditor } from '../SubtitleEditor/SubtitleEditor';
import { useHuggingFaceAuth } from '@/hooks/useHuggingFaceAuth';
import { expect, vi, describe, beforeEach, test } from 'vitest';
import '@testing-library/jest-dom';

const mockSubtitles = [
  { id: '1', startTime: 0, endTime: 5, text: 'テスト字幕1' },
  { id: '2', startTime: 6, endTime: 10, text: 'テスト字幕2' },
];

describe('字幕編集機能の統合テスト', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  test('タイムラインと字幕エディタの連携', async () => {
    const onTimeChange = vi.fn();
    const onSubtitleClick = vi.fn();
    const onSubtitleUpdate = vi.fn();
    const onSubtitleDelete = vi.fn();
    const onSubtitleAdd = vi.fn();

    render(
      <>
        <Timeline
          duration={60}
          currentTime={0}
          subtitles={mockSubtitles}
          onTimeChange={onTimeChange}
          onSubtitleClick={onSubtitleClick}
        />
        <SubtitleEditor
          subtitles={mockSubtitles}
          currentTime={0}
          onUpdate={onSubtitleUpdate}
          onDelete={onSubtitleDelete}
          onAdd={onSubtitleAdd}
        />
      </>
    );

    // タイムラインクリック時の動作確認
    const timeline = screen.getByTestId('timeline');
    fireEvent.click(timeline);
    expect(onTimeChange).toHaveBeenCalled();

    // 字幕クリック時の動作確認
    const subtitle = screen.getByTitle('テスト字幕1');
    fireEvent.click(subtitle);
    expect(onSubtitleClick).toHaveBeenCalledWith('1');

    // 字幕編集時の動作確認
    const textarea = screen.getByDisplayValue('テスト字幕1');
    fireEvent.change(textarea, { target: { value: '編集後の字幕' } });
    expect(onSubtitleUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '1',
        text: '編集後の字幕',
      })
    );
  });

  test('Hugging Face認証の統合', async () => {
    const onAuthSuccess = vi.fn();
    const onAuthError = vi.fn();

    const TestComponent = () => {
      const { isAuthenticated, authenticate, error } = useHuggingFaceAuth({
        onAuthSuccess,
        onAuthError,
      });

      return (
        <div>
          {isAuthenticated ? 'authenticated' : 'not-authenticated'}
          {error && <div>error-occurred</div>}
          <button onClick={() => authenticate('test-token')}>authenticate</button>
        </div>
      );
    };

    const { getByText } = render(<TestComponent />);

    // 認証前の状態確認
    expect(getByText('not-authenticated')).toBeInTheDocument();

    // 認証処理の実行
    global.fetch = vi.fn().mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    );

    await act(async () => {
      fireEvent.click(getByText('authenticate'));
    });

    // 認証後の状態確認
    expect(getByText('authenticated')).toBeInTheDocument();
    expect(onAuthSuccess).toHaveBeenCalled();
  });

  test('パフォーマンス最適化の確認', async () => {
    const start = performance.now();
    
    // 大量の字幕データでのレンダリング性能テスト
    const largeSubtitles = Array.from({ length: 1000 }, (_, i) => ({
      id: i.toString(),
      startTime: i * 5,
      endTime: (i + 1) * 5,
      text: `テスト字幕${i}`,
    }));

    render(
      <Timeline
        duration={5000}
        currentTime={0}
        subtitles={largeSubtitles}
        onTimeChange={vi.fn()}
        onSubtitleClick={vi.fn()}
      />
    );

    const end = performance.now();
    expect(end - start).toBeLessThan(1000); // 1秒以内にレンダリングが完了すること
  });
}); 