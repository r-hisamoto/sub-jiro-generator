import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('デフォルトのローディング表示が正しく表示される', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByTestId('loading-spinner')).toHaveClass('animate-spin');
  });

  it('メッセージが正しく表示される', () => {
    const message = 'ロード中...';
    render(<LoadingSpinner message={message} />);
    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it('進捗バーが表示される', () => {
    render(<LoadingSpinner progress={50} />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
  });

  it('進捗パーセンテージが表示される', () => {
    render(<LoadingSpinner progress={75} showPercentage />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('サイズバリエーションが適用される', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />);
    expect(screen.getByTestId('loading-spinner')).toHaveClass('w-4 h-4');

    rerender(<LoadingSpinner size="md" />);
    expect(screen.getByTestId('loading-spinner')).toHaveClass('w-8 h-8');

    rerender(<LoadingSpinner size="lg" />);
    expect(screen.getByTestId('loading-spinner')).toHaveClass('w-12 h-12');
  });

  describe('アクセシビリティ', () => {
    it('適切なARIAラベルが設定される', () => {
      render(<LoadingSpinner message="読み込み中" />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', '読み込み中');
    });

    it('進捗バーが適切なARIA属性を持つ', () => {
      render(<LoadingSpinner progress={60} />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      expect(progressBar).toHaveAttribute('aria-valuenow', '60');
    });
  });
}); 