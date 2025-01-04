import { useState, useRef, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import {
  reorder,
  getTimeFromPosition,
  snapToGrid,
  calculateOverlap
} from '@/lib/dragAndDrop';
import {
  applyFadeEffect,
  applyCrossFade,
  generateWaveformData,
  loadAudioFile,
  drawWaveform
} from '@/lib/audioEffects';

interface BGMTrack {
  id: string;
  name: string;
  url: string;
  duration: number;
  startTime: number;
  volume: number;
  loop: boolean;
  fadeIn?: number;
  fadeOut?: number;
  crossFadeNext?: number;
}

interface BGMManagerProps {
  tracks: BGMTrack[];
  onTracksChange: (tracks: BGMTrack[]) => void;
  totalDuration: number;
  isPlaying: boolean;
  currentTime: number;
}

interface BulkEditOptions {
  fadeIn?: number;
  fadeOut?: number;
  volume?: number;
  loop?: boolean;
}

export function BGMManager({
  tracks,
  onTracksChange,
  totalDuration,
  isPlaying,
  currentTime
}: BGMManagerProps) {
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [showAddTrack, setShowAddTrack] = useState(false);
  const [waveforms, setWaveforms] = useState<{ [key: string]: number[] }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext>();
  const audioBuffersRef = useRef<{ [key: string]: AudioBuffer }>({});
  const audioNodesRef = useRef<{ [key: string]: AudioNode[] }>({});
  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [bulkEditOptions, setBulkEditOptions] = useState<BulkEditOptions>({});
  const timelineRef = useRef<HTMLDivElement>(null);

  // AudioContextの初期化
  useEffect(() => {
    audioContextRef.current = new AudioContext();
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  // 波形データの生成と描画
  useEffect(() => {
    tracks.forEach(async (track) => {
      if (!waveforms[track.id] && audioContextRef.current) {
        try {
          const audioBuffer = await loadAudioFile(track.url, audioContextRef.current);
          audioBuffersRef.current[track.id] = audioBuffer;
          const waveformData = await generateWaveformData(audioBuffer);
          setWaveforms(prev => ({ ...prev, [track.id]: waveformData }));
          
          const canvas = canvasRefs.current[track.id];
          if (canvas) {
            drawWaveform(canvas, waveformData);
          }
        } catch (error) {
          console.error('波形データの生成に失敗しました:', error);
        }
      }
    });
  }, [tracks, waveforms]);

  // 音声の再生制御
  useEffect(() => {
    if (!audioContextRef.current) return;

    // 既存のノードをクリーンアップ
    Object.values(audioNodesRef.current).forEach(nodes => {
      nodes.forEach(node => node.disconnect());
    });
    audioNodesRef.current = {};

    if (isPlaying) {
      tracks.forEach(async (track) => {
        const audioBuffer = audioBuffersRef.current[track.id];
        if (!audioBuffer) return;

        const source = audioContextRef.current!.createBufferSource();
        source.buffer = audioBuffer;
        source.loop = track.loop;

        const nodes: AudioNode[] = [];
        let lastNode: AudioNode = source;

        // フェードイン
        if (track.fadeIn) {
          const gainNode = applyFadeEffect(audioContextRef.current!, source, {
            startTime: track.startTime,
            duration: track.fadeIn,
            type: 'in',
            curve: 'logarithmic'
          });
          lastNode = gainNode;
          nodes.push(gainNode);
        }

        // フェードアウト
        if (track.fadeOut) {
          const gainNode = applyFadeEffect(audioContextRef.current!, lastNode, {
            startTime: track.startTime + track.duration - track.fadeOut,
            duration: track.fadeOut,
            type: 'out',
            curve: 'logarithmic'
          });
          lastNode = gainNode;
          nodes.push(gainNode);
        }

        // クロスフェード
        if (track.crossFadeNext) {
          const nextTrack = tracks[tracks.indexOf(track) + 1];
          if (nextTrack) {
            const nextBuffer = audioBuffersRef.current[nextTrack.id];
            if (nextBuffer) {
              const nextSource = audioContextRef.current!.createBufferSource();
              nextSource.buffer = nextBuffer;
              
              const [gainNodeA, gainNodeB] = applyCrossFade(
                audioContextRef.current!,
                source,
                nextSource,
                {
                  trackA: track,
                  trackB: nextTrack,
                  duration: track.crossFadeNext,
                  curve: 'logarithmic'
                }
              );
              
              nodes.push(gainNodeA, gainNodeB);
              lastNode = gainNodeB;
            }
          }
        }

        // 最終的な音量調整
        const volumeNode = audioContextRef.current!.createGain();
        volumeNode.gain.value = track.volume;
        lastNode.connect(volumeNode);
        volumeNode.connect(audioContextRef.current!.destination);
        nodes.push(volumeNode);

        audioNodesRef.current[track.id] = nodes;
        
        // 再生開始
        const offset = Math.max(0, currentTime - track.startTime);
        if (offset < track.duration) {
          source.start(0, offset);
        }
      });
    }

    return () => {
      // クリーンアップ
      Object.values(audioNodesRef.current).forEach(nodes => {
        nodes.forEach(node => node.disconnect());
      });
      audioNodesRef.current = {};
    };
  }, [isPlaying, currentTime, tracks]);

  // 音声ファイルの追加処理
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    
    // 音声ファイルの長さを取得
    const audio = new Audio(url);
    await new Promise(resolve => {
      audio.onloadedmetadata = resolve;
    });

    const newTrack: BGMTrack = {
      id: `bgm-${Date.now()}`,
      name: file.name,
      url,
      duration: audio.duration,
      startTime: 0,
      volume: 1,
      loop: false,
      fadeIn: 0,
      fadeOut: 0,
      crossFadeNext: 0
    };

    onTracksChange([...tracks, newTrack]);
    setShowAddTrack(false);
  };

  // トラックの更新処理
  const handleTrackUpdate = (id: string, updates: Partial<BGMTrack>) => {
    onTracksChange(
      tracks.map(track =>
        track.id === id
          ? { ...track, ...updates }
          : track
      )
    );
  };

  // トラックの削除処理
  const handleTrackDelete = (id: string) => {
    onTracksChange(tracks.filter(track => track.id !== id));
    setSelectedTrackId(null);
  };

  // キーボードショートカットの設定
  useKeyboardShortcuts([
    {
      key: 'Delete',
      handler: () => {
        selectedTracks.forEach(id => handleTrackDelete(id));
      }
    },
    {
      key: 'a',
      ctrl: true,
      handler: () => {
        setSelectedTracks(tracks.map(track => track.id));
      }
    },
    {
      key: 'e',
      ctrl: true,
      handler: () => {
        if (selectedTracks.length > 0) {
          setShowBulkEdit(true);
        }
      }
    }
  ]);

  // ドラッグ＆ドロップの処理
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = reorder(
      tracks,
      result.source.index,
      result.destination.index
    );

    onTracksChange(items);
  };

  // タイムライン上でのドラッグ処理
  const handleTrackDrag = (trackId: string, clientX: number) => {
    if (!timelineRef.current) return;

    const containerRect = timelineRef.current.getBoundingClientRect();
    const newTime = getTimeFromPosition(clientX, containerRect, totalDuration);
    const snappedTime = snapToGrid(newTime, 0.1); // 0.1秒単位でスナップ

    handleTrackUpdate(trackId, { startTime: snappedTime });
  };

  // 一括編集の適用
  const handleBulkEdit = () => {
    const updatedTracks = tracks.map(track => {
      if (!selectedTracks.includes(track.id)) return track;

      return {
        ...track,
        ...bulkEditOptions
      };
    });

    onTracksChange(updatedTracks);
    setShowBulkEdit(false);
    setBulkEditOptions({});
  };

  // トラックの選択処理
  const handleTrackSelect = (id: string, event: React.MouseEvent) => {
    if (event.ctrlKey) {
      setSelectedTracks(prev =>
        prev.includes(id)
          ? prev.filter(trackId => trackId !== id)
          : [...prev, id]
      );
    } else {
      setSelectedTracks([id]);
    }
    setSelectedTrackId(id);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">BGM設定</h3>
        <button
          onClick={() => setShowAddTrack(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          BGMを追加
        </button>
      </div>

      {/* BGM追加モーダル */}
      {showAddTrack && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold">BGMを追加</h4>
              <button
                onClick={() => setShowAddTrack(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500"
                onClick={() => fileInputRef.current?.click()}
              >
                <p className="text-gray-600">クリックして音声ファイルを選択</p>
                <p className="text-sm text-gray-500 mt-2">
                  対応形式: MP3, WAV, OGG
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>
        </div>
      )}

      {/* 一括編集モーダル */}
      {showBulkEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold">一括編集</h4>
              <button
                onClick={() => setShowBulkEdit(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">フェードイン（秒）</label>
                <input
                  type="number"
                  min="0"
                  value={bulkEditOptions.fadeIn ?? ''}
                  onChange={e => setBulkEditOptions(prev => ({
                    ...prev,
                    fadeIn: parseFloat(e.target.value)
                  }))}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">フェードアウト（秒）</label>
                <input
                  type="number"
                  min="0"
                  value={bulkEditOptions.fadeOut ?? ''}
                  onChange={e => setBulkEditOptions(prev => ({
                    ...prev,
                    fadeOut: parseFloat(e.target.value)
                  }))}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">音量</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={bulkEditOptions.volume ?? 1}
                  onChange={e => setBulkEditOptions(prev => ({
                    ...prev,
                    volume: parseFloat(e.target.value)
                  }))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={bulkEditOptions.loop ?? false}
                    onChange={e => setBulkEditOptions(prev => ({
                      ...prev,
                      loop: e.target.checked
                    }))}
                    className="rounded"
                  />
                  <span className="text-sm">ループ再生</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowBulkEdit(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleBulkEdit}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  適用
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* トラックリスト */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="tracks">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2"
            >
              {tracks.map((track, index) => (
                <Draggable
                  key={track.id}
                  draggableId={track.id}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`p-4 rounded border ${
                        selectedTracks.includes(track.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200'
                      } ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                      onClick={(e) => handleTrackSelect(track.id, e)}
                    >
                      <div
                        {...provided.dragHandleProps}
                        className="flex justify-between items-center cursor-move"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{track.name}</div>
                          <div className="text-sm text-gray-500">
                            {Math.floor(track.duration / 60)}:{Math.floor(track.duration % 60).toString().padStart(2, '0')}
                          </div>
                        </div>
                      </div>

                      {/* 波形表示 */}
                      <div className="mt-2 h-24 bg-gray-100 rounded overflow-hidden">
                        <canvas
                          ref={el => canvasRefs.current[track.id] = el}
                          width="600"
                          height="96"
                          className="w-full h-full"
                        />
                      </div>

                      {selectedTrackId === track.id && (
                        <div className="mt-4 space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">開始時間（秒）</label>
                            <input
                              type="number"
                              min="0"
                              max={totalDuration}
                              value={track.startTime}
                              onChange={e => handleTrackUpdate(track.id, { startTime: parseFloat(e.target.value) })}
                              className="w-full p-2 border rounded"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-1">音量</label>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.1"
                              value={track.volume}
                              onChange={e => handleTrackUpdate(track.id, { volume: parseFloat(e.target.value) })}
                              className="w-full"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-1">フェードイン（秒）</label>
                            <input
                              type="number"
                              min="0"
                              max={track.duration}
                              value={track.fadeIn}
                              onChange={e => handleTrackUpdate(track.id, { fadeIn: parseFloat(e.target.value) })}
                              className="w-full p-2 border rounded"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-1">フェードアウト（秒）</label>
                            <input
                              type="number"
                              min="0"
                              max={track.duration}
                              value={track.fadeOut}
                              onChange={e => handleTrackUpdate(track.id, { fadeOut: parseFloat(e.target.value) })}
                              className="w-full p-2 border rounded"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-1">次のトラックとのクロスフェード（秒）</label>
                            <input
                              type="number"
                              min="0"
                              max={track.duration}
                              value={track.crossFadeNext}
                              onChange={e => handleTrackUpdate(track.id, { crossFadeNext: parseFloat(e.target.value) })}
                              className="w-full p-2 border rounded"
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={track.loop}
                                onChange={e => handleTrackUpdate(track.id, { loop: e.target.checked })}
                                className="rounded"
                              />
                              <span className="text-sm">ループ再生</span>
                            </label>

                            <button
                              onClick={() => handleTrackDelete(track.id)}
                              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                            >
                              削除
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* タイムライン */}
      <div
        ref={timelineRef}
        className="relative h-32 bg-gray-100 rounded overflow-hidden"
      >
        {/* ... existing timeline content ... */}
      </div>

      {/* ショートカットガイド */}
      <div className="mt-4 text-sm text-gray-500">
        <p>ショートカット:</p>
        <ul className="list-disc list-inside">
          <li>Ctrl + A: すべて選択</li>
          <li>Ctrl + E: 一括編集</li>
          <li>Delete: 選択したトラックを削除</li>
        </ul>
      </div>
    </div>
  );
} 