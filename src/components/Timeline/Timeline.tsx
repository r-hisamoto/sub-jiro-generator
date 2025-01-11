import React, { useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';

export interface TimelineProps {
  className?: string;
  duration: number;
  currentTime: number;
  subtitles: Array<{
    id: string;
    startTime: number;
    endTime: number;
    text: string;
  }>;
  onTimeChange: (time: number) => void;
  onSubtitleClick: (id: string) => void;
}

const SubtitleMarker = React.memo(({ 
  subtitle, 
  duration, 
  onSubtitleClick 
}: { 
  subtitle: TimelineProps['subtitles'][0];
  duration: number;
  onSubtitleClick: (id: string) => void;
}) => (
  <div
    key={subtitle.id}
    className="absolute top-0 h-full bg-green-500 opacity-30 hover:opacity-50 cursor-pointer"
    style={{
      left: `${(subtitle.startTime / duration) * 100}%`,
      width: `${((subtitle.endTime - subtitle.startTime) / duration) * 100}%`,
    }}
    onClick={(e) => {
      e.stopPropagation();
      onSubtitleClick(subtitle.id);
    }}
    title={subtitle.text}
  />
));

SubtitleMarker.displayName = 'SubtitleMarker';

export const Timeline: React.FC<TimelineProps> = React.memo(({
  className,
  duration,
  currentTime,
  subtitles,
  onTimeChange,
  onSubtitleClick,
}) => {
  const timelineRef = React.useRef<HTMLDivElement>(null);

  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const percentage = clickPosition / rect.width;
    const newTime = percentage * duration;
    
    onTimeChange(Math.max(0, Math.min(newTime, duration)));
  }, [duration, onTimeChange]);

  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  const currentTimeFormatted = useMemo(() => formatTime(currentTime), [formatTime, currentTime]);
  const durationFormatted = useMemo(() => formatTime(duration), [formatTime, duration]);
  const progressWidth = useMemo(() => {
    const percentage = (Math.max(0, Math.min(currentTime, duration)) / duration) * 100;
    return `${percentage}%`;
  }, [currentTime, duration]);

  return (
    <div className={cn('flex flex-col gap-2 p-4', className)}>
      <div className="flex justify-between text-sm text-gray-500">
        <span>{currentTimeFormatted}</span>
        <span>{durationFormatted}</span>
      </div>
      
      <div
        ref={timelineRef}
        data-testid="timeline"
        className="relative h-8 bg-gray-200 rounded cursor-pointer"
        onClick={handleTimelineClick}
      >
        {/* 再生位置インジケーター */}
        <div
          className="absolute top-0 h-full bg-blue-500 opacity-50"
          style={{ width: progressWidth }}
        />
        
        {/* 字幕マーカー */}
        {subtitles.map((subtitle) => (
          <SubtitleMarker
            key={subtitle.id}
            subtitle={subtitle}
            duration={duration}
            onSubtitleClick={onSubtitleClick}
          />
        ))}
      </div>
    </div>
  );
}); 