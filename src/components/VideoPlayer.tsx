import { Subtitle } from "@/types/subtitle";
import { useEffect, useRef } from "react";

interface VideoPlayerProps {
  videoUrl: string;
  currentTime: number;
  subtitles: Subtitle[];
  onTimeUpdate: (time: number) => void;
}

const VideoPlayer = ({ videoUrl, currentTime, subtitles, onTimeUpdate }: VideoPlayerProps) => {
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

  const currentSubtitle = subtitles.find(
    (sub) => currentTime >= sub.startTime && currentTime <= sub.endTime
  );

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full"
        controls
        onTimeUpdate={handleTimeUpdate}
      />
      {currentSubtitle && (
        <div className="absolute bottom-16 left-0 right-0 text-center">
          <div className="inline-block bg-black/80 text-white px-4 py-2 rounded-lg text-lg">
            {currentSubtitle.text}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;