import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Subtitle } from '../types/subtitle';

interface Props {
  subtitles: Subtitle[];
  currentTime: number;
  onSubtitleUpdate: (subtitle: Subtitle) => void;
  onSubtitleDelete: (id: string) => void;
  onSubtitleAdd: (time: number) => void;
}

export const SubtitleEditor: React.FC<Props> = ({
  subtitles,
  currentTime,
  onSubtitleUpdate,
  onSubtitleDelete,
  onSubtitleAdd
}) => {
  const [activeSubtitle, setActiveSubtitle] = useState<string | null>(null);
  const [selectedSubtitles, setSelectedSubtitles] = useState<Set<string>>(new Set());

  useEffect(() => {
    const current = subtitles.find(
      s => currentTime >= s.startTime && currentTime <= s.endTime
    );
    setActiveSubtitle(current?.id ?? null);
  }, [currentTime, subtitles]);

  const handleTextChange = (id: string, text: string) => {
    const subtitle = subtitles.find(s => s.id === id);
    if (subtitle) {
      onSubtitleUpdate({ ...subtitle, text });
    }
  };

  const handleDelete = (id: string) => {
    onSubtitleDelete(id);
  };

  const handleAddSubtitle = () => {
    onSubtitleAdd(currentTime);
  };

  const toggleSelectAll = () => {
    if (selectedSubtitles.size === subtitles.length) {
      setSelectedSubtitles(new Set());
    } else {
      setSelectedSubtitles(new Set(subtitles.map(s => s.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedSubtitles);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedSubtitles(newSelected);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <Button
          onClick={handleAddSubtitle}
          aria-label="現在位置に字幕を追加"
        >
          現在位置に字幕を追加
        </Button>
        <div className="flex gap-2">
          <Button
            onClick={toggleSelectAll}
            variant="secondary"
            aria-label="すべての字幕を選択"
          >
            すべての字幕を選択
          </Button>
        </div>
      </div>

      <div
        className="flex flex-col gap-2 h-[500px] overflow-y-auto"
        role="list"
        aria-label="字幕リスト"
        data-testid="subtitle-list"
      >
        {subtitles.map(subtitle => (
          <div
            key={subtitle.id}
            className={`p-4 border rounded ${
              activeSubtitle === subtitle.id ? 'border-primary' : 'border-gray-200'
            }`}
            role="listitem"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500">
                {formatTime(subtitle.startTime)} - {formatTime(subtitle.endTime)}
              </span>
              <div className="flex gap-2">
                <input
                  type="checkbox"
                  checked={selectedSubtitles.has(subtitle.id)}
                  onChange={() => toggleSelect(subtitle.id)}
                  aria-label={`字幕${subtitle.id}を選択`}
                />
                <Button
                  onClick={() => handleDelete(subtitle.id)}
                  variant="destructive"
                  size="sm"
                  aria-label={`字幕${subtitle.id}を削除`}
                >
                  削除
                </Button>
              </div>
            </div>
            <Textarea
              value={subtitle.text}
              onChange={e => handleTextChange(subtitle.id, e.target.value)}
              disabled={activeSubtitle !== subtitle.id}
              aria-label={`字幕${subtitle.id}のテキスト`}
              rows={3}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};