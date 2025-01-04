import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface VideoPlayerProps {
  className?: string;
  src: string;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  className,
  src,
  currentTime,
  onTimeUpdate,
  onDurationChange,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && Math.abs(videoRef.current.currentTime - currentTime) > 0.5) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      onTimeUpdate(videoRef.current.currentTime);
    }
  };

  const handleDurationChange = () => {
    if (videoRef.current) {
      onDurationChange(videoRef.current.duration);
    }
  };

  return (
    <video
      ref={videoRef}
      data-testid="video-player"
      className={cn('w-full rounded-lg', className)}
      src={src}
      controls
      onTimeUpdate={handleTimeUpdate}
      onDurationChange={handleDurationChange}
    />
  );
}; 