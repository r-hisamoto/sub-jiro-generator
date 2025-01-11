import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export interface LoadingSpinnerProps {
  message?: string;
  progress?: number;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12'
};

export function LoadingSpinner({
  message,
  progress,
  showPercentage = false,
  size = 'md',
  className
}: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-label={message}
      className={cn('flex flex-col items-center justify-center gap-4', className)}
    >
      <Loader2
        data-testid="loading-spinner"
        className={cn('animate-spin', sizeClasses[size])}
      />
      
      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
      
      {typeof progress === 'number' && (
        <div className="w-full max-w-xs">
          <Progress
            value={progress}
            max={100}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          />
          {showPercentage && (
            <p className="mt-2 text-sm text-center text-muted-foreground">
              {Math.round(progress)}%
            </p>
          )}
        </div>
      )}
    </div>
  );
} 