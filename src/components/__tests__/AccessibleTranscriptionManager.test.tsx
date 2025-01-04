import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccessibleTranscriptionManager } from '../AccessibleTranscriptionManager';

describe('AccessibleTranscriptionManager', () => {
  const mockProps = {
    onTranscriptionComplete: vi.fn(),
    onError: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('アクセシビリティ機能が正しく動作する', () => {
    render(<AccessibleTranscriptionManager {...mockProps} />);
    
    const startButton = screen.getByRole('button', { name: '文字起こしを開始' });
    expect(startButton).toHaveAttribute('aria-label', '文字起こしを開始');
    expect(startButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('スクリーンリーダー用のテキストが適切に表示される', () => {
    render(<AccessibleTranscriptionManager {...mockProps} />);
    
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('文字起こしの準備ができています');
  });

  it('キーボード操作が正しく動作する', async () => {
    const user = userEvent.setup();
    render(<AccessibleTranscriptionManager {...mockProps} />);
    
    const startButton = screen.getByRole('button', { name: '文字起こしを開始' });
    await user.tab();
    expect(startButton).toHaveFocus();
    
    await user.keyboard('{Enter}');
    expect(startButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('エラー状態が適切に通知される', () => {
    render(<AccessibleTranscriptionManager {...mockProps} />);
    
    const errorMessage = '音声の読み込みに失敗しました';
    fireEvent.error(screen.getByRole('button', { name: '文字起こしを開始' }));
    
    expect(screen.getByRole('alert')).toHaveTextContent(errorMessage);
    expect(mockProps.onError).toHaveBeenCalledWith(errorMessage);
  });

  it('進行状況が正しく表示される', async () => {
    const user = userEvent.setup();
    render(<AccessibleTranscriptionManager {...mockProps} />);
    
    const startButton = screen.getByRole('button', { name: '文字起こしを開始' });
    await user.click(startButton);
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('文字起こしを実行中...')).toBeInTheDocument();
  });

  it('完了状態が適切に通知される', async () => {
    const user = userEvent.setup();
    render(<AccessibleTranscriptionManager {...mockProps} />);
    
    const startButton = screen.getByRole('button', { name: '文字起こしを開始' });
    await user.click(startButton);
    
    // 文字起こし完了をシミュレート
    fireEvent.load(screen.getByRole('progressbar'));
    
    expect(screen.getByText('文字起こしが完了しました')).toBeInTheDocument();
    expect(mockProps.onTranscriptionComplete).toHaveBeenCalled();
  });

  it('設定パネルが適切にアクセス可能である', async () => {
    const user = userEvent.setup();
    render(<AccessibleTranscriptionManager {...mockProps} />);
    
    const settingsButton = screen.getByRole('button', { name: '設定' });
    await user.click(settingsButton);
    
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-label', '文字起こし設定');
    
    const closeButton = screen.getByRole('button', { name: '閉じる' });
    await user.click(closeButton);
    
    expect(dialog).not.toBeInTheDocument();
  });

  it('ヘルプテキストが適切に表示される', () => {
    render(<AccessibleTranscriptionManager {...mockProps} />);
    
    const helpButton = screen.getByRole('button', { name: 'ヘルプ' });
    fireEvent.mouseOver(helpButton);
    
    expect(screen.getByRole('tooltip')).toHaveTextContent(
      '文字起こしを開始するには、音声ファイルを選択してから開始ボタンを押してください'
    );
  });

  it('フォーカスの移動が適切に管理される', async () => {
    const user = userEvent.setup();
    render(<AccessibleTranscriptionManager {...mockProps} />);
    
    const startButton = screen.getByRole('button', { name: '文字起こしを開始' });
    const settingsButton = screen.getByRole('button', { name: '設定' });
    const helpButton = screen.getByRole('button', { name: 'ヘルプ' });
    
    await user.tab();
    expect(startButton).toHaveFocus();
    
    await user.tab();
    expect(settingsButton).toHaveFocus();
    
    await user.tab();
    expect(helpButton).toHaveFocus();
  });
}); 