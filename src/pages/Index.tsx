import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import FileUpload from "@/components/FileUpload";
import VideoPlayer from "@/components/VideoPlayer";
import Timeline from "@/components/Timeline";
import SubtitleEditor from "@/components/SubtitleEditor";
import { Subtitle, VideoFile } from "@/types/subtitle";
import { downloadSRT } from "@/lib/subtitleUtils";
import { Download } from "lucide-react";

const Index = () => {
  const [videoFile, setVideoFile] = useState<VideoFile | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [selectedSubtitle, setSelectedSubtitle] = useState<Subtitle | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (file: VideoFile) => {
    setVideoFile(file);
    // ここで音声認識APIを呼び出し、字幕を生成する処理を追加予定
    // 現在はダミーデータを使用
    setSubtitles([
      {
        id: "1",
        startTime: 1,
        endTime: 4,
        text: "こんにちは、これはテスト用の字幕です。",
      },
      {
        id: "2",
        startTime: 5,
        endTime: 8,
        text: "音声認識APIと連携することで、自動で字幕を生成できます。",
      },
    ]);
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

  return (
    <div className="container py-6 space-y-6">
      <h1 className="text-3xl font-bold text-center">字幕生成ツール</h1>

      {!videoFile ? (
        <FileUpload onFileSelect={handleFileSelect} />
      ) : (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={handleExport}>
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
                duration={100} // 動画の実際の長さを設定する必要があります
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