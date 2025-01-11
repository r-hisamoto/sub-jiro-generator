import { useState } from 'react';
import { FileProcessor } from './transcription/FileProcessor';
import { TranscriptionResult } from './transcription/TranscriptionResult';
import { ErrorBoundary } from './ErrorBoundary/ErrorBoundary';

export const TranscriptionManager = () => {
  const [transcriptionText, setTranscriptionText] = useState<string>('');

  return (
    <div className="flex flex-col gap-4 p-4">
      <h2 className="text-2xl font-bold mb-4">音声/動画ファイルをアップロード</h2>
      
      <ErrorBoundary errorMessage="文字起こし処理中にエラーが発生しました">
        <FileProcessor onTranscriptionComplete={setTranscriptionText} />
        <TranscriptionResult text={transcriptionText} />
      </ErrorBoundary>
    </div>
  );
};