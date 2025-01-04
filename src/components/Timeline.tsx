import { Subtitle } from '@/types';
import { formatTimeToSRT } from '@/lib/utils';
import { useRef } from 'react';

export interface TimelineProps {
  subtitles: Subtitle[];
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

export default function Timeline({
  subtitles,
  currentTime,
  duration,
  onSeek,
}: TimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    onSeek(percentage * duration);
  };

  return (
    <div className="w-full h-12 relative" onClick={handleTimelineClick} ref={timelineRef}>
      <div className="absolute inset-0 bg-gray-200">
        <div
          className="absolute h-full bg-blue-500"
          style={{ width: `${(currentTime / duration) * 100}%` }}
        />
      </div>
      {subtitles.map((subtitle) => (
        <div
          key={subtitle.id}
          className="absolute h-full bg-blue-200 opacity-50"
          style={{
            left: `${(subtitle.startTime / duration) * 100}%`,
            width: `${((subtitle.endTime - subtitle.startTime) / duration) * 100}%`,
          }}
          title={`${formatTimeToSRT(subtitle.startTime).split(',')[0]} - ${formatTimeToSRT(subtitle.endTime).split(',')[0]}\n${subtitle.text}`}
        />
      ))}
    </div>
  );
}