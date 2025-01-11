import { useCallback } from 'react';
import { cn } from '@/lib/utils';

interface TextFileUploadProps {
  className?: string;
  onTextLoaded: (text: string) => void;
}

export function TextFileUpload({ className, onTextLoaded }: TextFileUploadProps) {
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('text/') && !file.name.endsWith('.txt')) {
      alert('テキストファイル（.txt）のみアップロード可能です');
      return;
    }

    try {
      const text = await file.text();
      onTextLoaded(text);
    } catch (error) {
      console.error('テキストファイルの読み込みに失敗しました:', error);
      alert('テキストファイルの読み込みに失敗しました');
    }
  }, [onTextLoaded]);

  return (
    <div className={cn('flex flex-col items-center p-4', className)}>
      <label
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 cursor-pointer"
        role="button"
        tabIndex={0}
      >
        字幕テキストファイルをアップロード
        <input
          type="file"
          accept=".txt,text/plain"
          onChange={handleFileSelect}
          className="hidden"
          aria-label="字幕テキストファイルを選択"
        />
      </label>
      <p className="mt-2 text-sm text-gray-500">
        ※ テキストファイル（.txt）のみ対応しています
      </p>
    </div>
  );
} 