import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import FileUpload from "@/components/FileUpload";
import VideoPlayer from "@/components/VideoPlayer";
import Timeline from "@/components/Timeline";
import SubtitleEditor from "@/components/SubtitleEditor";
import { Subtitle, VideoFile } from "@/types/subtitle";
import { downloadSRT } from "@/lib/subtitleUtils";
import { generateSubtitles } from "@/lib/subtitleGenerator";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { Download, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [videoFile, setVideoFile] = useState<VideoFile | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [selectedSubtitle, setSelectedSubtitle] = useState<Subtitle | null>(null);
  const { transcribeAudio, isProcessing } = useSpeechRecognition();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileSelect = async (file: VideoFile) => {
    setVideoFile(file);
    
    toast({
      title: "音声認識開始",
      description: "動画から音声を認識しています...",
    });
    
    try {
      const transcription = await transcribeAudio(file.file);
      if (!transcription) {
        throw new Error("音声認識に失敗しました");
      }
      
      const generatedSubtitles = generateSubtitles(transcription);
      setSubtitles(generatedSubtitles);
      
      toast({
        title: "字幕生成完了",
        description: `${generatedSubtitles.length}個の字幕を生成しました`,
      });
    } catch (error) {
      console.error("Transcription error:", error);
      toast({
        title: "エラー",
        description: "音声認識中にエラーが発生しました。もう一度お試しください。",
        variant: "destructive",
      });
    }
  };

  const handleSubtitleUpdate = (updatedSubtitle: Subtitle) => {
    setSubtitles(
      subtitles.map((sub) =>
        sub.id === updatedSubtitle.id ? updatedSubtitle : sub
      )
    );
  };

  const handleExport = () => {
    if (!videoFile) return;
    downloadSRT(subtitles, videoFile.file.name);
    toast({
      title: "エクスポート完了",
      description: "字幕ファイルをダウンロードしました",
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">字幕生成ツール</h1>
        <Button variant="outline" onClick={handleSignOut}>
          <LogOut className="w-4 h-4 mr-2" />
          ログアウト
        </Button>
      </div>

      {!videoFile ? (
        <FileUpload onFileSelect={handleFileSelect} />
      ) : (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={handleExport} disabled={isProcessing}>
              <Download className="w-4 h-4 mr-2" />
              SRTファイルをエクスポート
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
              <VideoPlayer
                videoUrl={videoFile.url}
                currentTime={currentTime}
                subtitles={subtitles}
                onTimeUpdate={setCurrentTime}
              />
              <Timeline
                duration={100}
                currentTime={currentTime}
                subtitles={subtitles}
                onTimeChange={setCurrentTime}
                onSubtitleSelect={setSelectedSubtitle}
                selectedSubtitle={selectedSubtitle || undefined}
              />
            </div>
            <div>
              {selectedSubtitle && (
                <SubtitleEditor
                  subtitle={selectedSubtitle}
                  onUpdate={handleSubtitleUpdate}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;