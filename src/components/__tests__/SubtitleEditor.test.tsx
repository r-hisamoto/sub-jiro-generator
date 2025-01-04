import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SubtitleEditor from '../SubtitleEditor';

describe('SubtitleEditor', () => {
  const mockSubtitles = [
    { id: '1', text: 'テスト字幕1', startTime: 0, endTime: 5 },
    { id: '2', text: 'テスト字幕2', startTime: 6, endTime: 10 }
  ];

  const mockProps = {
    subtitles: mockSubtitles,
    onSubtitlesChange: vi.fn(),
    currentTime: 0,
    activeSubtitleId: null,
    onAdd: vi.fn(),
    onDelete: vi.fn(),
    onUpdate: vi.fn()
  };

  it('字幕一覧が正しくレンダリングされる', () => {
    render(<SubtitleEditor {...mockProps} />);
    
    const subtitleList = screen.getByTestId('subtitle-list');
    expect(subtitleList).toBeInTheDocument();
    
    mockSubtitles.forEach(subtitle => {
      const subtitleElement = screen.getByTestId(`subtitle-${subtitle.id}`);
      expect(subtitleElement).toBeInTheDocument();
      expect(subtitleElement).toHaveTextContent(subtitle.text);
    });
  });

  it('字幕の編集が正しく動作する', async () => {
    const user = userEvent.setup();
    render(<SubtitleEditor {...mockProps} />);

    const textarea = screen.getByDisplayValue('テスト字幕1');
    await user.clear(textarea);
    await user.type(textarea, '編集後の字幕');
    fireEvent.blur(textarea);

    expect(mockProps.onUpdate).toHaveBeenCalledWith({
      id: '1',
      text: '編集後の字幕',
      startTime: 0,
      endTime: 5
    });
  });

  it('字幕の削除が正しく動作する', async () => {
    const user = userEvent.setup();
    render(<SubtitleEditor {...mockProps} />);

    const deleteButton = screen.getByTestId('delete-subtitle-1');
    await user.click(deleteButton);

    expect(mockProps.onDelete).toHaveBeenCalledWith('1');
  });

  it('字幕のタイミングが正しく表示される', () => {
    render(<SubtitleEditor {...mockProps} />);

    mockSubtitles.forEach(subtitle => {
      const timingElement = screen.getByTestId(`timing-${subtitle.id}`);
      expect(timingElement).toHaveTextContent(
        `${formatTime(subtitle.startTime)} - ${formatTime(subtitle.endTime)}`
      );
    });
  });

  it('非アクティブな字幕のテキストエリアが無効化される', () => {
    render(<SubtitleEditor {...mockProps} activeSubtitleId="2" />);

    const textarea1 = screen.getByDisplayValue('テスト字幕1');
    const textarea2 = screen.getByDisplayValue('テスト字幕2');

    expect(textarea1).toBeDisabled();
    expect(textarea2).not.toBeDisabled();
  });

  it('アクティブな字幕がハイライトされる', () => {
    render(<SubtitleEditor {...mockProps} activeSubtitleId="1" />);

    const subtitle1 = screen.getByTestId('subtitle-1');
    const subtitle2 = screen.getByTestId('subtitle-2');

    expect(subtitle1).toHaveClass('bg-blue-100');
    expect(subtitle2).not.toHaveClass('bg-blue-100');
  });

  it('空の字幕リストが正しく処理される', () => {
    render(<SubtitleEditor {...mockProps} subtitles={[]} />);

    const emptyMessage = screen.getByText('字幕がありません');
    expect(emptyMessage).toBeInTheDocument();
  });

  it('長い字幕テキストが正しく表示される', () => {
    const longText = 'あ'.repeat(100);
    const longSubtitle = {
      id: '1',
      text: longText,
      startTime: 0,
      endTime: 5
    };

    render(
      <SubtitleEditor
        {...mockProps}
        subtitles={[longSubtitle]}
      />
    );

    const textarea = screen.getByDisplayValue(longText);
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue(longText);
  });

  it('重なる字幕が正しく表示される', () => {
    const overlappingSubtitles = [
      { id: '1', text: '重なる字幕1', startTime: 0, endTime: 5 },
      { id: '2', text: '重なる字幕2', startTime: 3, endTime: 8 }
    ];

    render(
      <SubtitleEditor
        {...mockProps}
        subtitles={overlappingSubtitles}
      />
    );

    const warning = screen.getByText(/字幕が重なっています/);
    expect(warning).toBeInTheDocument();
  });
});

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
} 