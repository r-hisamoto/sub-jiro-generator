import React, { useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Upload } from 'lucide-react';

export interface FileUploadProps {
  className?: string;
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  className,
  onFileSelect,
  accept = 'audio/mpeg,audio/wav,audio/mp3,audio/mp4,video/mp4,video/webm,video/ogg',
  maxSize = 1024 * 1024 * 1024 * 10, // 10GB
}) => {
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // ファイルサイズのチェック
    if (file.size > maxSize) {
      alert(`ファイルサイズが大きすぎます（最大${Math.floor(maxSize / (1024 * 1024))}MB）`);
      return;
    }

    // ファイル形式のチェック
    const acceptedTypes = accept.split(',').map(type => type.trim());
    const fileType = file.type || `audio/${file.name.split('.').pop()?.toLowerCase()}`; // 拡張子からMIMEタイプを推測
    console.log('File type:', fileType);

    const isAcceptedType = acceptedTypes.some(type => {
      // 拡張子での判定も追加
      const extension = file.name.split('.').pop()?.toLowerCase();
      const acceptedExtensions = ['mp3', 'wav', 'mp4', 'webm', 'ogg'];
      return type === fileType || (extension && acceptedExtensions.includes(extension));
    });

    if (!isAcceptedType) {
      alert(`対応していないファイル形式です。MP3, WAV（音声）またはMP4, WebM（動画）をアップロードしてください。`);
      return;
    }

    console.log('Selected file:', file.name, fileType, file.size);
    onFileSelect(file);
  }, [accept, maxSize, onFileSelect]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const file = event.dataTransfer.files[0];
    if (file) {
      const changeEvent = {
        target: {
          files: event.dataTransfer.files
        }
      } as React.ChangeEvent<HTMLInputElement>;
      handleFileChange(changeEvent);
    }
  }, [handleFileChange]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg',
        'bg-gray-50 hover:bg-gray-100 transition-colors duration-200',
        className
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <input
        type="file"
        className="hidden"
        accept=".mp3,.wav,.mp4,.webm,.ogg,audio/*,video/*"
        onChange={handleFileChange}
        id="file-upload"
      />
      <label
        htmlFor="file-upload"
        className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
      >
        <Upload className="w-12 h-12 mb-4 text-gray-400" />
        <p className="mb-2 text-lg font-semibold text-gray-700">
          クリックまたはドラッグ＆ドロップ
        </p>
        <p className="text-sm text-gray-500">
          音声ファイル（MP3, WAV）または動画ファイル（MP4, WebM）
        </p>
        <p className="mt-2 text-xs text-gray-400">
          最大{Math.floor(maxSize / (1024 * 1024))}MBまで
        </p>
      </label>
    </div>
  );
}; 