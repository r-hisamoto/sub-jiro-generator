import React, { useState, useCallback } from 'react';
import { FileUpload } from '@/components/FileUpload/FileUpload';
import { VideoPlayer } from '@/components/VideoPlayer/VideoPlayer';
import { Timeline } from '@/components/Timeline/Timeline';
import { SubtitleEditor, Subtitle } from '@/components/SubtitleEditor/SubtitleEditor';
import { Progress } from '@/components/ui/progress';

export const Home: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setVideoUrl(URL.createObjectURL(selectedFile));
    setSubtitles([]);
    setIsGenerating(true);
    setProgress(0);

    try {
      // 字幕生成のシミュレーション
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setProgress(i);
      }

      // ダミーの字幕データ
      const dummySubtitles: Subtitle[] = [
        { id: '1', startTime: 0, endTime: 5, text: 'こんにちは' },
        { id: '2', startTime: 6, endTime: 10, text: '字幕のテストです' },
        { id: '3', startTime: 11, endTime: 15, text: 'よろしくお願いします' },
      ];
      setSubtitles(dummySubtitles);
    } catch (error) {
      console.error('字幕生成エラー:', error);
      alert('音声認識中にエラーが発生しました');
    } finally {
      setIsGenerating(false);
      setProgress(100);
    }
  }, []);

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handleDurationChange = useCallback((newDuration: number) => {
    setDuration(newDuration);
  }, []);

  const handleSubtitleUpdate = useCallback((id: string, text: string) => {
    setSubtitles(prev => prev.map(sub => 
      sub.id === id ? { ...sub, text } : sub
    ));
  }, []);

  const handleSubtitleDelete = useCallback((id: string) => {
    setSubtitles(prev => prev.filter(sub => sub.id !== id));
  }, []);

  const handleSubtitleAdd = useCallback((time: number) => {
    const newSubtitle: Subtitle = {
      id: Date.now().toString(),
      startTime: time,
      endTime: time + 5,
      text: '',
    };
    setSubtitles(prev => [...prev, newSubtitle]);
  }, []);

  const handleSubtitleClick = useCallback((id: string) => {
    const subtitle = subtitles.find(sub => sub.id === id);
    if (subtitle) {
      setCurrentTime(subtitle.startTime);
    }
  }, [subtitles]);

  return (
    <div className="container mx-auto p-4 space-y-6">
      {!file && (
        <FileUpload
          onFileSelect={handleFileSelect}
          accept="video/*"
        />
      )}

      {file && (
        <>
          <VideoPlayer
            src={videoUrl}
            currentTime={currentTime}
            onTimeUpdate={handleTimeUpdate}
            onDurationChange={handleDurationChange}
          />

          <Timeline
            duration={duration}
            currentTime={currentTime}
            subtitles={subtitles}
            onTimeChange={handleTimeUpdate}
            onSubtitleClick={handleSubtitleClick}
          />

          {isGenerating ? (
            <div className="space-y-2">
              <p className="text-center">字幕を生成中...</p>
              <Progress value={progress} />
              <p className="text-center text-sm text-gray-500">{progress}%</p>
            </div>
          ) : (
            <SubtitleEditor
              subtitles={subtitles}
              currentTime={currentTime}
              onUpdate={handleSubtitleUpdate}
              onDelete={handleSubtitleDelete}
              onAdd={handleSubtitleAdd}
            />
          )}
        </>
      )}
    </div>
  );
}; 