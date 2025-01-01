import { Subtitle } from "@/types/subtitle";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface VideoPlayerProps {
  videoUrl: string;
  currentTime: number;
  subtitles: Subtitle[];
  onTimeUpdate: (time: number) => void;
}

const VideoPlayer = ({
  videoUrl,
  currentTime,
  subtitles,
  onTimeUpdate,
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getVideoPath = async () => {
      try {
        if (!videoUrl) {
          console.error('No video job ID provided');
          return null;
        }

        // First, get the video job details
        const { data: videoJob, error: jobError } = await supabase
          .from('video_jobs')
          .select('upload_path, status')
          .eq('id', videoUrl)
          .single();

        if (jobError) {
          console.error('Error fetching video job:', jobError);
          throw jobError;
        }

        if (!videoJob || !videoJob.upload_path) {
          throw new Error('Video path not found');
        }

        console.log('Found video job:', videoJob);
        return videoJob.upload_path;
      } catch (error) {
        console.error('Error getting video path:', error);
        throw error;
      }
    };

    const getSignedUrl = async () => {
      try {
        const filePath = await getVideoPath();
        if (!filePath) {
          throw new Error('Could not get video path');
        }

        console.log('Getting signed URL for path:', filePath);

        const { data, error } = await supabase.storage
          .from('videos')
          .createSignedUrl(filePath, 3600);

        if (error) {
          console.error('Error getting signed URL:', error);
          toast({
            variant: "destructive",
            title: "エラー",
            description: "動画の読み込みに失敗しました",
          });
          return;
        }

        if (data?.signedUrl) {
          console.log('Successfully got signed URL');
          setSignedUrl(data.signedUrl);
        }
      } catch (error) {
        console.error('Error in getSignedUrl:', error);
        toast({
          variant: "destructive",
          title: "エラー",
          description: "動画の読み込みに失敗しました",
        });
      }
    };

    if (videoUrl) {
      getSignedUrl();
    }
  }, [videoUrl, toast]);

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
      {signedUrl ? (
        <video
          ref={videoRef}
          src={signedUrl}
          className="w-full h-full"
          controls
          onTimeUpdate={handleTimeUpdate}
          crossOrigin="anonymous"
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full text-white">
          動画を読み込み中...
        </div>
      )}
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