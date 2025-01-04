import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Subtitle } from "@/types/subtitle";
import { formatTime } from "@/lib/subtitleUtils";
import { Save, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface VideoJob {
  upload_path: string;
  status: string;
  metadata: {
    progress?: number;
    [key: string]: any;
  };
}

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    const getVideoPath = async () => {
      try {
        if (!videoUrl) {
          console.error('No video job ID provided');
          return null;
        }

        const { data: videoJob, error: jobError } = await supabase
          .from('video_jobs')
          .select('upload_path, status, metadata')
          .eq('id', videoUrl)
          .single<VideoJob>();

        if (jobError) {
          console.error('Error fetching video job:', jobError);
          throw jobError;
        }

        if (!videoJob || !videoJob.upload_path) {
          throw new Error('Video path not found');
        }

        console.log('Found video job:', videoJob);
        
        if (videoJob.status === 'pending' || videoJob.status === 'processing') {
          setIsProcessing(true);
          // メタデータから進捗状況を取得
          if (videoJob.metadata?.progress) {
            setProcessingProgress(videoJob.metadata.progress);
          }
          return null;
        }
        
        setIsProcessing(false);
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
          return;
        }

        console.log('Getting signed URL for path:', filePath);

        const { data, error } = await supabase.storage
          .from('videos')
          .createSignedUrl(filePath, 3600);

        if (error) {
          if (error.message.includes('404') || error.message.includes('not_found')) {
            setIsProcessing(true);
            return;
          }

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
          setIsProcessing(false);
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

    // ポーリング間隔を2秒に短縮
    const pollInterval = setInterval(() => {
      if (isProcessing) {
        getSignedUrl();
      }
    }, 2000);

    if (videoUrl) {
      getSignedUrl();
    }

    return () => clearInterval(pollInterval);
  }, [videoUrl, toast, isProcessing]);

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
        <div className="flex flex-col items-center justify-center w-full h-full text-white space-y-4">
          {isProcessing ? (
            <>
              <Loader2 className="w-8 h-8 animate-spin" />
              <p>動画を処理中です... {processingProgress > 0 ? `${Math.round(processingProgress)}%` : ''}</p>
            </>
          ) : (
            "動画を読み込み中..."
          )}
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