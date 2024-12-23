import { Subtitle } from "@/types/subtitle";
import { formatTime } from "@/lib/subtitleUtils";
import { useRef, useEffect } from "react";

interface TimelineProps {
  duration: number;
  currentTime: number;
  subtitles: Subtitle[];
  onTimeChange: (time: number) => void;
  onSubtitleSelect: (subtitle: Subtitle) => void;
  selectedSubtitle?: Subtitle;
}

const Timeline = ({
  duration,
  currentTime,
  subtitles,
  onTimeChange,
  onSubtitleSelect,
  selectedSubtitle,
}: TimelineProps) => {
  const timelineRef = useRef<HTMLDivElement>(null);

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    onTimeChange(percentage * duration);
  };

  return (
    <div className="w-full p-4 bg-muted rounded-lg">
      <div
        ref={timelineRef}
        className="relative w-full h-24 bg-background rounded cursor-pointer"
        onClick={handleTimelineClick}
      >
        {/* Current time indicator */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-secondary z-10"
          style={{ left: `${(currentTime / duration) * 100}%` }}
        />

        {/* Subtitles */}
        {subtitles.map((subtitle) => (
          <div
            key={subtitle.id}
            className={`absolute h-12 top-6 rounded ${
              selectedSubtitle?.id === subtitle.id
                ? "bg-secondary/60"
                : "bg-primary/40"
            }`}
            style={{
              left: `${(subtitle.startTime / duration) * 100}%`,
              width: `${((subtitle.endTime - subtitle.startTime) / duration) * 100}%`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSubtitleSelect(subtitle);
            }}
          >
            <div className="p-1 text-xs truncate">{subtitle.text}</div>
          </div>
        ))}

        {/* Time markers */}
        <div className="absolute bottom-0 left-0 right-0 h-6 flex justify-between px-2 text-xs text-muted-foreground">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i}>{formatTime((duration * i) / 5)}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Timeline;