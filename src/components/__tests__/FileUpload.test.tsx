import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileUpload } from '../FileUpload/FileUpload';

describe('FileUpload', () => {
  const mockHandlers = {
    onFileSelect: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ファイルアップロードUIが正しくレンダリングされる', () => {
    render(
      <FileUpload
        onFileSelect={mockHandlers.onFileSelect}
        accept="video/*"
      />
    );

    expect(screen.getByTestId('file-input')).toBeInTheDocument();
    expect(screen.getByText(/クリックしてアップロード/)).toBeInTheDocument();
  });

  it('ファイル選択が正しく動作する', async () => {
    render(
      <FileUpload
        onFileSelect={mockHandlers.onFileSelect}
        accept="video/*"
      />
    );

    const file = new File(['test'], 'test.mp4', { type: 'video/mp4' });
    const input = screen.getByTestId('file-input');

    await userEvent.upload(input, file);

    expect(mockHandlers.onFileSelect).toHaveBeenCalledWith(file);
  });

  it('大きなファイルが正しく処理される', async () => {
    const maxSize = 1024 * 1024; // 1MB
    render(
      <FileUpload
        onFileSelect={mockHandlers.onFileSelect}
        accept="video/*"
        maxSize={maxSize}
      />
    );

    // 2MBのファイルを作成
    const largeFile = new File(['x'.repeat(maxSize * 2)], 'large.mp4', { type: 'video/mp4' });
    const input = screen.getByTestId('file-input');

    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    await userEvent.upload(input, largeFile);

    expect(alertMock).toHaveBeenCalledWith('ファイルサイズが大きすぎます');
    expect(mockHandlers.onFileSelect).not.toHaveBeenCalled();
  });

  it('複数のファイルがドロップされた場合は最初のファイルのみ処理される', async () => {
    render(
      <FileUpload
        onFileSelect={mockHandlers.onFileSelect}
        accept="video/*"
      />
    );

    const files = [
      new File(['test1'], 'test1.mp4', { type: 'video/mp4' }),
      new File(['test2'], 'test2.mp4', { type: 'video/mp4' }),
    ];
    const input = screen.getByTestId('file-input');

    await userEvent.upload(input, files);

    expect(mockHandlers.onFileSelect).toHaveBeenCalledTimes(1);
    expect(mockHandlers.onFileSelect).toHaveBeenCalledWith(files[0]);
  });

  it('無効なファイル形式が拒否される', async () => {
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByLabelText('ファイルを選択');
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

    await userEvent.upload(input, file);

    expect(alertMock).toHaveBeenCalledWith('対応していないファイル形式です');
    expect(mockHandlers.onFileSelect).not.toHaveBeenCalled();

    alertMock.mockRestore();
  });
}); 