import { useState, useEffect } from 'react';
import { WebGPUService } from '../services/webgpu/WebGPUService';
import { WhisperService } from '../services/whisper/WhisperService';
import { TextFileUpload } from './TextFileUpload';
import { matchSubtitles, optimizeSubtitleTiming } from '@/lib/subtitleMatcher';
import { reviewTranscription } from '@/lib/transcriptionReviewer';
import type { Subtitle } from '@/types';
import { DictionaryManager } from './DictionaryManager';
import { applyDictionary } from '@/lib/dictionaryManager';
import { SlideShowEditor, SlideItem } from './SlideShowEditor';
import { PerformanceService } from '../services/performance/PerformanceService';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface TranscriptionResult {
  text: string;
  startTime: number;
  endTime: number;
}

interface WhisperSegment {
  text: string;
  start: number;
  end: number;
}

interface WhisperResponse {
  segments: WhisperSegment[];
}

interface ReviewSuggestion {
  originalText: string;
  suggestedText: string;
  confidence: number;
  reason: string;
}

interface BatchEdit {
  searchText: string;
  replaceText: string;
  count: number;
  isRegex: boolean;
}

interface TranscriptionManagerProps {
  mode?: 'video' | 'audio';
}

export const TranscriptionManager: React.FC<TranscriptionManagerProps> = ({ mode = 'video' }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<TranscriptionResult[]>([]);
  const [scriptText, setScriptText] = useState<string>('');
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [suggestions, setSuggestions] = useState<ReviewSuggestion[]>([]);
  const [services, setServices] = useState<{
    webGPU: WebGPUService | null;
    whisper: WhisperService | null;
  }>({ webGPU: null, whisper: null });
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  
  // Add the missing state variables
  const [showBatchEditModal, setShowBatchEditModal] = useState(false);
  const [showDictionaryModal, setShowDictionaryModal] = useState(false);
  const [batchEdits, setBatchEdits] = useState<BatchEdit[]>([]);
  const [newBatchEdit, setNewBatchEdit] = useState<BatchEdit>({
    searchText: '',
    replaceText: '',
    count: 0,
    isRegex: false
  });
  const [slides, setSlides] = useState<SlideItem[]>([]);

  useEffect(() => {
    const initializeServices = async () => {
      try {
        setIsLoading(true);
        const webGPUService = new WebGPUService();
        const performanceService = new PerformanceService();
        
        // OpenAI APIキーの取得と確認
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        console.log('APIキーの状態:', {
          exists: !!apiKey,
          length: apiKey?.length || 0
        });

        if (!apiKey) {
          throw new Error('OpenAI APIキーが設定されていません。環境変数を確認してください。');
        }

        // WhisperServiceの初期化
        const whisperService = new WhisperService(
          webGPUService,
          performanceService,
          apiKey
        );

        setServices({
          webGPU: webGPUService,
          whisper: whisperService
        });
      } catch (error) {
        console.error('サービスの初期化エラー:', error);
        setError(error instanceof Error ? error.message : 'サービスの初期化に失敗しました');
        toast({
          variant: "destructive",
          title: "エラー",
          description: error instanceof Error ? error.message : 'サービスの初期化に失敗しました',
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeServices();
  }, [toast]);

  const handleFileUpload = async (file: File) => {
    if (!services.whisper) {
      setError('音声解析サービスが初期化されていません');
      return;
    }

    // ファイルタイプのチェック
    const isVideo = file.type.startsWith('video/');
    const isAudio = file.type.startsWith('audio/');

    if (!isVideo && !isAudio) {
      setError('対応していないファイル形式です。音声ファイル（MP3, WAV）または動画ファイル（MP4, WebM）をアップロードしてください。');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // 進捗状況の更新
      const handleProgress = (progress: number) => {
        console.log(`音声解析の進捗: ${progress}%`);
        setProgress(progress);
      };

      // 音声解析の実行
      console.log('音声解析を開始します:', { 
        fileName: file.name, 
        fileType: file.type, 
        fileSize: file.size,
        hasWhisperService: !!services.whisper,
        hasApiKey: !!services.whisper?.apiKey
      });

      const result = await services.whisper.transcribe(file, handleProgress);
      
      if (!result) {
        throw new Error('音声解析結果が空です');
      }

      console.log('音声解析結果:', { result, length: result.length });

      // 音声認識結果をセグメントに分割（句点で区切る）
      const segments = result.split(/[。．.!！?？]/).filter(Boolean).map((text, index, array) => {
        // 簡易的な時間計算（全体の長さを文の数で割って推定）
        const duration = file.size / 1024 / array.length; // 1KBを1秒として計算
        const startTime = index * duration;
        const endTime = (index + 1) * duration;
        
        return {
          text: applyDictionary(text.trim() + '。'), // 句点を追加
          startTime,
          endTime
        };
      });

      if (segments.length === 0) {
        throw new Error('音声認識結果のセグメントが空です');
      }

      console.log('音声認識結果をセグメントに分割:', segments);
      setTranscription(segments);

      // AIによる解析結果のレビュー
      const reviews = reviewTranscription(segments);
      setSuggestions(reviews);

      // スクリプトテキストが既にある場合は照合を実行
      if (scriptText) {
        const matched = matchSubtitles(segments, scriptText);
        const optimized = optimizeSubtitleTiming(matched);
        setSubtitles(optimized);
      } else {
        // スクリプトがない場合は音声認識結果から直接字幕を生成
        const directSubtitles = segments.map((segment, index) => ({
          id: `subtitle-${index}`,
          text: segment.text,
          startTime: segment.startTime,
          endTime: segment.endTime
        }));
        setSubtitles(optimizeSubtitleTiming(directSubtitles));
      }
    } catch (error) {
      console.error('音声解析エラー:', error);
      setError(error instanceof Error ? error.message : '音声解析中にエラーが発生しました');
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  const handleSuggestionApply = (suggestion: ReviewSuggestion) => {
    // 同じ間違いが他にもないかチェック
    const allOccurrences = subtitles.filter(subtitle => 
      subtitle.text.includes(suggestion.originalText)
    );

    if (allOccurrences.length > 1) {
      // 同じ間違いが複数ある場合、一括編集として追加
      const newEdit: BatchEdit = {
        searchText: suggestion.originalText,
        replaceText: suggestion.suggestedText,
        count: allOccurrences.length,
        isRegex: false
      };
      setBatchEdits(current => [...current, newEdit]);
      setShowBatchEditModal(true);
    } else {
      // 1つだけの場合は直接適用
      setSubtitles(current =>
        current.map(subtitle =>
          subtitle.text === suggestion.originalText
            ? { ...subtitle, text: suggestion.suggestedText }
            : subtitle
        )
      );
    }
  };

  const handleBatchEditApply = (edit: BatchEdit) => {
    setSubtitles(current =>
      current.map(subtitle => {
        let newText = subtitle.text;
        if (edit.isRegex) {
          try {
            const regex = new RegExp(edit.searchText, 'g');
            newText = subtitle.text.replace(regex, edit.replaceText);
          } catch (error) {
            console.error('Invalid regex:', error);
          }
        } else {
          newText = subtitle.text.replaceAll(edit.searchText, edit.replaceText);
        }
        return newText !== subtitle.text ? { ...subtitle, text: newText } : subtitle;
      })
    );
  };

  const handleBatchEditSave = () => {
    if (newBatchEdit.searchText && newBatchEdit.replaceText) {
      const count = subtitles.filter(subtitle => 
        newBatchEdit.isRegex
          ? new RegExp(newBatchEdit.searchText, 'g').test(subtitle.text)
          : subtitle.text.includes(newBatchEdit.searchText)
      ).length;

      if (count > 0) {
        setBatchEdits(current => [...current, { ...newBatchEdit, count }]);
        setNewBatchEdit({
          searchText: '',
          replaceText: '',
          count: 0,
          isRegex: false
        });
      }
    }
  };

  const handleTextFileLoaded = (text: string) => {
    setScriptText(text);
    
    // 音声認識結果が既にある場合は照合を実行
    if (transcription.length > 0) {
      const matched = matchSubtitles(transcription, text);
      const optimized = optimizeSubtitleTiming(matched);
      setSubtitles(optimized);
    }
  };

  const handleDictionaryUpdate = () => {
    // 辞書が更新されたら、現在の字幕に再適用
    if (subtitles.length > 0) {
      setSubtitles(current =>
        current.map(subtitle => ({
          ...subtitle,
          text: applyDictionary(subtitle.text)
        }))
      );
    }
  };

  const handleSlidesUpdate = (newSlides: SlideItem[]) => {
    setSlides(newSlides);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">
            1. {mode === 'video' ? '動画' : '音声'}ファイルをアップロード
          </h3>
          <input
            type="file"
            accept={mode === 'video' ? "video/*" : "audio/*"}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
            disabled={isLoading}
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">2. テキストファイルをアップロード（オプション）</h3>
          <TextFileUpload onTextLoaded={handleTextFileLoaded} />
        </div>
      </div>

      {isLoading && (
        <div className="text-center p-4 bg-blue-50 rounded">
          <p>処理中...</p>
          {progress > 0 && (
            <Progress value={progress} className="w-full mt-2" />
          )}
        </div>
      )}

      {error && (
        <div className="text-center p-4 bg-red-50 text-red-600 rounded">
          <p>{error}</p>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">AIによる編集提案</h3>
          <div className="border rounded p-4 max-h-[300px] overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="mb-4 p-3 bg-yellow-50 rounded">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">{suggestion.reason}</p>
                    <div className="flex gap-2 items-center">
                      <span className="line-through text-gray-500">{suggestion.originalText}</span>
                      <span>→</span>
                      <span className="font-medium">{suggestion.suggestedText}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSuggestionApply(suggestion)}
                    className="ml-4 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    適用
                  </button>
                </div>
                <div className="mt-2">
                  <div className="text-xs text-gray-500">
                    信頼度: {Math.round(suggestion.confidence * 100)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {subtitles.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">生成された字幕</h3>
          <div className="border rounded p-4 max-h-[400px] overflow-y-auto">
            {subtitles.map((subtitle) => (
              <div key={subtitle.id} className="mb-2 p-2 bg-gray-50 rounded">
                <div className="text-sm text-gray-500">
                  {Math.floor(subtitle.startTime / 60)}:
                  {Math.floor(subtitle.startTime % 60).toString().padStart(2, '0')} - 
                  {Math.floor(subtitle.endTime / 60)}:
                  {Math.floor(subtitle.endTime % 60).toString().padStart(2, '0')}
                </div>
                <div>{subtitle.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {mode === 'audio' && subtitles.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">スライドショー作成</h3>
          <SlideShowEditor
            subtitles={subtitles}
            onSlidesUpdate={handleSlidesUpdate}
          />
        </div>
      )}

      {/* 一括編集モーダル */}
      {showBatchEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h3 className="text-xl font-semibold mb-4">一括編集</h3>
            
            {/* 新規一括編集の入力フォーム */}
            <div className="mb-6 p-4 bg-gray-50 rounded">
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">検索テキスト</label>
                  <input
                    type="text"
                    value={newBatchEdit.searchText}
                    onChange={e => setNewBatchEdit(prev => ({ ...prev, searchText: e.target.value }))}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">置換テキスト</label>
                  <input
                    type="text"
                    value={newBatchEdit.replaceText}
                    onChange={e => setNewBatchEdit(prev => ({ ...prev, replaceText: e.target.value }))}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newBatchEdit.isRegex}
                    onChange={e => setNewBatchEdit(prev => ({ ...prev, isRegex: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">正規表現を使用</span>
                </label>
                <button
                  onClick={handleBatchEditSave}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  追加
                </button>
              </div>
            </div>

            {/* 一括編集リスト */}
            <div className="max-h-[300px] overflow-y-auto">
              {batchEdits.map((edit, index) => (
                <div key={index} className="flex items-center justify-between p-3 border-b">
                  <div className="flex-1">
                    <div className="flex gap-2 items-center">
                      <span className="line-through text-gray-500">{edit.searchText}</span>
                      <span>→</span>
                      <span className="font-medium">{edit.replaceText}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {edit.count}箇所で見つかりました
                      {edit.isRegex && ' (正規表現)'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleBatchEditApply(edit)}
                      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      適用
                    </button>
                    <button
                      onClick={() => setBatchEdits(current => current.filter((_, i) => i !== index))}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowBatchEditModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 一括編集ボタン */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowBatchEditModal(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          一括編集
        </button>
      </div>

      {/* 辞書管理ボタン */}
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setShowDictionaryModal(true)}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          辞書管理
        </button>
        <button
          onClick={() => setShowBatchEditModal(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          一括編集
        </button>
      </div>

      {showDictionaryModal && (
        <DictionaryManager
          onClose={() => setShowDictionaryModal(false)}
          onDictionaryUpdate={handleDictionaryUpdate}
        />
      )}
    </div>
  );
};
