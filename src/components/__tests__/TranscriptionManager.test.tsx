import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TranscriptionManager } from '../TranscriptionManager';
import { WebGPUService } from '../../services/webgpu/WebGPUService';
import { WhisperService } from '../../services/whisper/WhisperService';

jest.mock('../../services/webgpu/WebGPUService');
jest.mock('../../services/whisper/WhisperService');

describe('TranscriptionManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (WebGPUService as jest.Mock).mockImplementation(() => ({
      initialize: jest.fn().mockResolvedValue(true),
    }));
    (WhisperService as jest.Mock).mockImplementation(() => ({
      initialize: jest.fn().mockResolvedValue(undefined),
      transcribe: jest.fn().mockResolvedValue('テスト文字起こし結果'),
    }));
  });

  it('コンポーネントが正常にレンダリングされる', () => {
    render(<TranscriptionManager />);
    expect(screen.getByRole('button', { name: /ファイルを選択/i })).toBeInTheDocument();
  });

  it('サービスの初期化に失敗した場合エラーメッセージが表示される', async () => {
    (WhisperService as jest.Mock).mockImplementation(() => ({
      initialize: jest.fn().mockRejectedValue(new Error('初期化エラー')),
    }));

    render(<TranscriptionManager />);
    await waitFor(() => {
      expect(screen.getByText('サービスの初期化に失敗しました')).toBeInTheDocument();
    });
  });

  it('ファイルアップロード時に文字起こしが実行される', async () => {
    render(<TranscriptionManager />);
    
    // サービスの初期化を待つ
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /ファイルを選択/i })).not.toBeDisabled();
    });

    const file = new File([''], 'test.wav', { type: 'audio/wav' });
    const input = screen.getByRole('button', { name: /ファイルを選択/i });
    
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('テスト文字起こし結果')).toBeInTheDocument();
    });
  });

  it('文字起こし処理中はローディング表示される', async () => {
    const mockTranscribe = jest.fn().mockImplementation(() => {
      return new Promise(resolve => setTimeout(() => resolve('結果'), 100));
    });

    (WhisperService as jest.Mock).mockImplementation(() => ({
      initialize: jest.fn().mockResolvedValue(undefined),
      transcribe: mockTranscribe,
    }));

    render(<TranscriptionManager />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /ファイルを選択/i })).not.toBeDisabled();
    });

    const file = new File([''], 'test.wav', { type: 'audio/wav' });
    const input = screen.getByRole('button', { name: /ファイルを選択/i });
    
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText('処理中...')).toBeInTheDocument();
  });

  it('文字起こし処理に失敗した場合エラーメッセージが表示される', async () => {
    (WhisperService as jest.Mock).mockImplementation(() => ({
      initialize: jest.fn().mockResolvedValue(undefined),
      transcribe: jest.fn().mockRejectedValue(new Error('処理エラー')),
    }));

    render(<TranscriptionManager />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /ファイルを選択/i })).not.toBeDisabled();
    });

    const file = new File([''], 'test.wav', { type: 'audio/wav' });
    const input = screen.getByRole('button', { name: /ファイルを選択/i });
    
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('文字起こし処理に失敗しました')).toBeInTheDocument();
    });
  });
}); 