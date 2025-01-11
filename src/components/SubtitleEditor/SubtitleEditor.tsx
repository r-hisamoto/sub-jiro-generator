import { useCallback, useMemo, useState, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils';
import type { Subtitle } from '@/types';
import type { VirtualItem } from '@tanstack/react-virtual';

export interface SubtitleEditorProps {
  className?: string;
  subtitles: Subtitle[];
  currentTime: number;
  onUpdate: (subtitle: Subtitle) => void;
  onDelete: (id: string) => void;
  onAdd?: (time: number) => void;
}

export const SubtitleEditor: React.FC<SubtitleEditorProps> = ({
  className,
  subtitles,
  currentTime,
  onUpdate,
  onDelete,
  onAdd,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingTime, setEditingTime] = useState<string | null>(null);

  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: subtitles.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5,
  });

  const isSubtitleActive = useCallback((subtitle: Subtitle) => {
    return currentTime >= subtitle.startTime && currentTime <= subtitle.endTime;
  }, [currentTime]);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === subtitles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(subtitles.map(s => s.id)));
    }
  }, [subtitles, selectedIds]);

  const handleDeleteSelected = useCallback(() => {
    selectedIds.forEach(id => onDelete(id));
    setSelectedIds(new Set());
  }, [selectedIds, onDelete]);

  const handleTimeEdit = useCallback((subtitle: Subtitle, timeStr: string) => {
    const [minutes, seconds] = timeStr.split(':').map(Number);
    if (!isNaN(minutes) && !isNaN(seconds)) {
      const newTime = minutes * 60 + seconds;
      onUpdate({
        ...subtitle,
        startTime: newTime,
        endTime: newTime + (subtitle.endTime - subtitle.startTime)
      });
    }
  }, [onUpdate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, subtitle: Subtitle) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      onDelete(subtitle.id);
    }
  }, [onDelete]);

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="flex justify-between items-center">
        <button
          onClick={() => onAdd?.(currentTime)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          aria-label="現在位置に字幕を追加"
        >
          現在位置に字幕を追加
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleSelectAll}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            aria-label={selectedIds.size === subtitles.length ? "すべての選択を解除" : "すべての字幕を選択"}
          >
            {selectedIds.size === subtitles.length ? "すべての選択を解除" : "すべての字幕を選択"}
          </button>
          {selectedIds.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              aria-label={`選択した${selectedIds.size}個の字幕を削除`}
            >
              選択した字幕を削除 ({selectedIds.size})
            </button>
          )}
        </div>
      </div>

      <div
        ref={parentRef}
        data-testid="subtitle-list"
        className="flex flex-col gap-2 h-[500px] overflow-y-auto"
        role="list"
        aria-label="字幕リスト"
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow: VirtualItem) => {
            const subtitle = subtitles[virtualRow.index];
            return (
              <div
                key={subtitle.id}
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                className={cn(
                  'flex gap-4 p-4 border rounded absolute top-0 left-0 w-full',
                  isSubtitleActive(subtitle) && 'border-blue-500 bg-blue-50',
                  selectedIds.has(subtitle.id) && 'border-gray-500 bg-gray-50'
                )}
                style={{
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                role="listitem"
                onKeyDown={(e) => handleKeyDown(e, subtitle)}
                tabIndex={0}
              >
                <div className="flex-1 flex flex-col gap-2">
                  <textarea
                    value={subtitle.text}
                    onChange={(e) => onUpdate({
                      ...subtitle,
                      text: e.target.value
                    })}
                    className="flex-1 min-h-[60px] p-2 border rounded"
                    aria-label={`字幕テキスト: ${subtitle.text}`}
                  />
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={editingTime === subtitle.id ? editingTime : `${Math.floor(subtitle.startTime / 60)}:${(subtitle.startTime % 60).toString().padStart(2, '0')}`}
                      onChange={(e) => setEditingTime(e.target.value)}
                      onBlur={() => {
                        if (editingTime) {
                          handleTimeEdit(subtitle, editingTime);
                          setEditingTime(null);
                        }
                      }}
                      className="w-20 text-center border rounded"
                      aria-label="開始時間"
                    />
                    <span>-</span>
                    <span>{Math.floor(subtitle.endTime / 60)}:{(subtitle.endTime % 60).toString().padStart(2, '0')}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => onDelete(subtitle.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    aria-label={`字幕「${subtitle.text}」を削除`}
                  >
                    削除
                  </button>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(subtitle.id)}
                    onChange={(e) => {
                      const newSelectedIds = new Set(selectedIds);
                      if (e.target.checked) {
                        newSelectedIds.add(subtitle.id);
                      } else {
                        newSelectedIds.delete(subtitle.id);
                      }
                      setSelectedIds(newSelectedIds);
                    }}
                    className="w-5 h-5"
                    aria-label={`字幕「${subtitle.text}」を選択`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}; 