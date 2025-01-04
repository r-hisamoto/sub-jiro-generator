import { useRef, useEffect, useState } from 'react';
import { Subtitle } from '@/types';
import { formatTimeToSRT } from '@/lib/utils';

export interface VideoPlayerProps {
  src: string;
  subtitles: Subtitle[];
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
}

export default function VideoPlayer({
  src,
  subtitles,
  onTimeUpdate,
  onDurationChange,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      onTimeUpdate(video.currentTime);
    };

    const handleDurationChange = () => {
      setDuration(video.duration);
      onDurationChange(video.duration);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
    };
  }, [onTimeUpdate, onDurationChange]);

  const getCurrentSubtitle = () => {
    return subtitles.find(
      (subtitle) =>
        currentTime >= subtitle.startTime && currentTime <= subtitle.endTime
    );
  };

  return (
    <div className="relative">
      <video
        ref={videoRef}
        src={src}
        controls
        className="w-full rounded-lg"
        data-testid="video-player"
      />
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-black bg-opacity-50 text-white text-center">
        {getCurrentSubtitle()?.text || ''}
      </div>
    </div>
  );
}