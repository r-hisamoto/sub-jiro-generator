import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from '../ErrorBoundary/ErrorBoundary';
import { useState } from 'react';

// エラーを発生させるテスト用コンポーネント
const ErrorComponent = ({ shouldThrow = false }) => {
  if (shouldThrow) {
    throw new Error('テストエラー');
  }
  return <div>正常なコンポーネント</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('子コンポーネントが正常な場合、そのまま表示する', () => {
    render(
      <ErrorBoundary>
        <ErrorComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('正常なコンポーネント')).toBeInTheDocument();
  });

  it('エラーが発生した場合、フォールバックUIを表示する', () => {
    render(
      <ErrorBoundary>
        <ErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
    expect(screen.getByText('再試行')).toBeInTheDocument();
  });

  it('カスタムエラーメッセージを表示する', () => {
    const customError = 'カスタムエラーメッセージ';
    render(
      <ErrorBoundary errorMessage={customError}>
        <ErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(customError)).toBeInTheDocument();
  });

  it('再試行ボタンがクリックされたとき、コンポーネントを再レンダリングする', () => {
    let shouldThrow = true;
    const TestComponent = () => {
      if (shouldThrow) {
        throw new Error('テストエラー');
      }
      return <div>正常なコンポーネント</div>;
    };

    render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();

    shouldThrow = false;
    const retryButton = screen.getByText('再試行');
    fireEvent.click(retryButton);

    expect(screen.queryByText('エラーが発生しました')).not.toBeInTheDocument();
    expect(screen.getByText('正常なコンポーネント')).toBeInTheDocument();
  });

  it('エラー発生時にonErrorコールバックが呼ばれる', () => {
    const onError = vi.fn();
    render(
      <ErrorBoundary onError={onError}>
        <ErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it('ネストされたエラーバウンダリーが正しく動作する', () => {
    render(
      <ErrorBoundary errorMessage="外部エラー">
        <div>
          <div>外部コンポーネント</div>
          <ErrorBoundary errorMessage="内部エラー">
            <ErrorComponent shouldThrow={true} />
          </ErrorBoundary>
        </div>
      </ErrorBoundary>
    );

    expect(screen.getByText('外部コンポーネント')).toBeInTheDocument();
    expect(screen.getByText('内部エラー')).toBeInTheDocument();
    expect(screen.queryByText('外部エラー')).not.toBeInTheDocument();
  });

  it('非同期エラーを正しく処理する', async () => {
    const AsyncErrorComponent = () => {
      const [error, setError] = useState(false);
      
      if (error) {
        throw new Error('非同期エラー');
      }
      
      setError(true);
      return null;
    };

    render(
      <ErrorBoundary>
        <AsyncErrorComponent />
      </ErrorBoundary>
    );

    // エラーメッセージが表示されることを確認
    expect(await screen.findByText('エラーが発生しました')).toBeInTheDocument();
  });
}); 