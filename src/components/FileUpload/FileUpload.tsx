import React from 'react';
import { cn } from '@/lib/utils';

export interface FileUploadProps {
  className?: string;
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  className,
  onFileSelect,
  accept = 'video/*,audio/*',
  maxSize = 1024 * 1024 * 1024 * 10, // 10GB
}) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // ファイルサイズのチェック
    if (file.size > maxSize) {
      alert(`ファイルサイズが大きすぎます（最大${Math.floor(maxSize / (1024 * 1024))}MB）`);
      return;
    }

    // ファイル形式のチェック
    const acceptedTypes = accept.split(',').map(type => type.trim());
    const fileType = file.type;
    const isAcceptedType = acceptedTypes.some(type => {
      if (type.endsWith('/*')) {
        const baseType = type.replace('/*', '');
        return fileType.startsWith(baseType);
      }
      return type === fileType;
    });

    if (!isAcceptedType) {
      const typeList = acceptedTypes.map(type => {
        if (type === 'audio/*') return '音声ファイル';
        if (type === 'video/*') return '動画ファイル';
        return type;
      }).join('または');
      alert(`対応していないファイル形式です。${typeList}をアップロードしてください。`);
      return;
    }

    onFileSelect(file);
  };

  return (
    <div className={cn('flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg', className)}>
      <input
        type="file"
        data-testid="file-input"
        className="absolute opacity-0"
        accept={accept}
        onChange={handleFileChange}
        id="file-upload"
      />
      <label
        htmlFor="file-upload"
        className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <svg
            className="w-8 h-8 mb-4 text-gray-500"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 20 16"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
            />
          </svg>
          <p className="mb-2 text-sm text-gray-500">
            <span className="font-semibold">クリックしてアップロード</span>
            またはドラッグ&ドロップ
          </p>
          <p className="text-xs text-gray-500">
            動画ファイル（MP4, MOV, AVI）または音声ファイル（MP3, WAV）
          </p>
        </div>
      </label>
    </div>
  );
}; 