import React, { useRef } from 'react';
import { Button } from './ui/button';

interface Props {
  onFileSelect: (file: File) => void;
  accept?: string;
  multiple?: boolean;
}

export const FileUpload: React.FC<Props> = ({
  onFileSelect,
  accept = 'audio/*',
  multiple = false
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('audio/')) {
        onFileSelect(file);
      } else {
        alert('音声ファイルを選択してください');
      }
    }
  };

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        className="hidden"
        id="file-upload"
        aria-label="ファイルを選択"
      />
      <label htmlFor="file-upload" className="sr-only">
        ファイルを選択
      </label>
      <Button
        onClick={handleButtonClick}
        aria-controls="file-upload"
      >
        ファイルを選択
      </Button>
    </div>
  );
};