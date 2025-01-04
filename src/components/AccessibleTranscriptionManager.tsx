import React, { useState } from 'react';
import { Button } from './ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from './ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from './ui/dialog';
import { Progress } from './ui/progress';

interface Props {
  onTranscriptionStart: () => void;
  onTranscriptionComplete: (text: string) => void;
  onError: (error: string) => void;
}

export const AccessibleTranscriptionManager: React.FC<Props> = ({
  onTranscriptionStart,
  onTranscriptionComplete,
  onError
}) => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleTranscriptionStart = () => {
    try {
      setIsTranscribing(true);
      onTranscriptionStart();
      // プログレスバーのシミュレーション
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsTranscribing(false);
            onTranscriptionComplete('文字起こしが完了しました');
            return 100;
          }
          return prev + 10;
        });
      }, 500);
    } catch (error) {
      onError(error instanceof Error ? error.message : '文字起こしの開始に失敗しました');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Button
          onClick={handleTranscriptionStart}
          aria-label="文字起こしを開始"
          aria-pressed={isTranscribing}
          disabled={isTranscribing}
        >
          文字起こしを開始
        </Button>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="ヘルプ"
              >
                <span className="sr-only">ヘルプ</span>
                <HelpIcon className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              文字起こしを開始するには、音声ファイルを選択してから開始ボタンを押してください
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              aria-label="設定"
              aria-haspopup="dialog"
            >
              <SettingsIcon className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>設定</DialogTitle>
            </DialogHeader>
            <div className="p-4">
              {/* 設定項目をここに追加 */}
              <Button onClick={() => setShowSettings(false)}>
                閉じる
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isTranscribing && (
        <Progress
          value={progress}
          max={100}
          aria-label="文字起こしの進行状況"
        />
      )}

      <div role="status" aria-live="polite">
        {isTranscribing ? '文字起こしを実行中...' : '文字起こしの準備ができています'}
      </div>
    </div>
  );
};

const HelpIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <path d="M12 17h.01" />
  </svg>
);

const SettingsIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
); 