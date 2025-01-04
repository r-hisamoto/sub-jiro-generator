import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface TutorialStep {
  title: string;
  description: string;
  target?: string;
  position?: 'top' | 'right' | 'bottom' | 'left';
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: '字幕エディタへようこそ',
    description: '字幕の編集や整形を簡単に行えるツールです。基本的な使い方を説明します。',
  },
  {
    title: '字幕の追加',
    description: '「字幕を追加」ボタンをクリックして、新しい字幕を追加できます。',
    target: '[data-tutorial="add-subtitle"]',
    position: 'bottom',
  },
  {
    title: 'テキスト整形',
    description: '句読点の自動補完や漢字/ひらがなの変換など、様々なテキスト整形機能を利用できます。',
    target: '[data-tutorial="text-formatting"]',
    position: 'bottom',
  },
  {
    title: '敬語調整',
    description: '敬体/常体の統一や、敬語レベルの調整が可能です。',
    target: '[data-tutorial="honorific"]',
    position: 'bottom',
  },
  {
    title: 'エクスポート',
    description: 'WebVTT形式や動画編集ソフト用のフォーマットでエクスポートできます。',
    target: '[data-tutorial="export"]',
    position: 'bottom',
  },
];

interface TutorialProps {
  onComplete?: () => void;
}

const Tutorial: React.FC<TutorialProps> = ({ onComplete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const step = TUTORIAL_STEPS[currentStep];
    if (step.target) {
      const element = document.querySelector(step.target) as HTMLElement;
      setTargetElement(element);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsOpen(false);
      onComplete?.();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setIsOpen(false);
    onComplete?.();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{TUTORIAL_STEPS[currentStep].title}</DialogTitle>
            <DialogDescription>
              {TUTORIAL_STEPS[currentStep].description}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Progress
              value={(currentStep + 1) / TUTORIAL_STEPS.length * 100}
              className="w-full"
            />
          </div>
          <DialogFooter className="flex justify-between">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                前へ
              </Button>
              <Button
                variant="outline"
                onClick={handleNext}
              >
                {currentStep === TUTORIAL_STEPS.length - 1 ? '完了' : '次へ'}
              </Button>
            </div>
            <Button
              variant="ghost"
              onClick={handleSkip}
            >
              スキップ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {targetElement && TUTORIAL_STEPS[currentStep].target && (
        <div
          className={cn(
            'fixed z-50 pointer-events-none',
            'w-64 p-4 bg-background border rounded-lg shadow-lg',
            'transform transition-all duration-200 ease-in-out',
            {
              'translate-y-2': TUTORIAL_STEPS[currentStep].position === 'bottom',
              '-translate-y-2': TUTORIAL_STEPS[currentStep].position === 'top',
              'translate-x-2': TUTORIAL_STEPS[currentStep].position === 'right',
              '-translate-x-2': TUTORIAL_STEPS[currentStep].position === 'left',
            }
          )}
          style={{
            top: (() => {
              const rect = targetElement.getBoundingClientRect();
              switch (TUTORIAL_STEPS[currentStep].position) {
                case 'top':
                  return rect.top - 8;
                case 'bottom':
                  return rect.bottom + 8;
                default:
                  return rect.top;
              }
            })(),
            left: (() => {
              const rect = targetElement.getBoundingClientRect();
              switch (TUTORIAL_STEPS[currentStep].position) {
                case 'left':
                  return rect.left - 8;
                case 'right':
                  return rect.right + 8;
                default:
                  return rect.left;
              }
            })(),
          }}
        >
          <div className="text-sm">
            {TUTORIAL_STEPS[currentStep].description}
          </div>
        </div>
      )}
    </>
  );
};

export default Tutorial; 