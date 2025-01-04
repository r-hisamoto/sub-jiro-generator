import { useState, useRef, useCallback, useMemo } from 'react';
import { Subtitle } from '@/types';
import { searchStockVideos } from '@/lib/stockServices';
import type { StockVideo } from '@/lib/stockServices';
import { generateImagesFromSeed } from '@/lib/aiImageService';
import { analyzeImage, generatePromptSuggestions } from '@/lib/imageAnalyzer';
import debounce from 'lodash/debounce';
import { addImageToLibrary } from '@/lib/imageLibrary';
import { BGMManager } from './BGMManager';

interface SlideShowEditorProps {
  subtitles: Subtitle[];
  onSlidesUpdate: (slides: SlideItem[]) => void;
}

export interface SlideItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  startTime: number;
  endTime: number;
  transition: 'fade' | 'slide' | 'none';
  duration?: number;
  source?: 'pexels' | 'pixabay';
  author?: string;
  authorUrl?: string;
  originalStartTime?: number;
  originalEndTime?: number;
}

interface AutoCutOptions {
  minDuration: number;
  maxDuration: number;
  randomOrder: boolean;
}

interface AIGenerateOptions {
  numImages: number;
  prompt: string;
  negativePrompt: string;
  randomOrder: boolean;
}

interface GenerationProgress {
  current: number;
  total: number;
}

interface PromptSuggestion {
  prompt: string;
  negativePrompt: string;
  explanation: string;
}

interface BGMTrack {
  id: string;
  name: string;
  url: string;
  duration: number;
  startTime: number;
  volume: number;
  loop: boolean;
}

export function SlideShowEditor({ subtitles, onSlidesUpdate }: SlideShowEditorProps) {
  const [slides, setSlides] = useState<SlideItem[]>([]);
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [showStockSearch, setShowStockSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StockVideo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [autoCutOptions, setAutoCutOptions] = useState<AutoCutOptions>({
    minDuration: 5,
    maxDuration: 15,
    randomOrder: true
  });
  const [showAIGenerate, setShowAIGenerate] = useState(false);
  const [seedImage, setSeedImage] = useState<File | null>(null);
  const [seedImageUrl, setSeedImageUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiOptions, setAIOptions] = useState<AIGenerateOptions>({
    numImages: 4,
    prompt: 'same character, different pose',
    negativePrompt: 'bad quality, blurry',
    randomOrder: true
  });
  const seedImageInputRef = useRef<HTMLInputElement>(null);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);
  const [promptSuggestions, setPromptSuggestions] = useState<PromptSuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedPromptIndex, setSelectedPromptIndex] = useState<number>(-1);
  const [bgmTracks, setBgmTracks] = useState<BGMTrack[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const previewRef = useRef<HTMLVideoElement>(null);

  // スライドショーの総再生時間を計算
  const totalDuration = useMemo(() => {
    if (slides.length === 0) return 0;
    return slides[slides.length - 1].endTime;
  }, [slides]);

  // プレビュー再生の制御
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (previewRef.current) {
      if (!isPlaying) {
        previewRef.current.play();
      } else {
        previewRef.current.pause();
      }
    }
  };

  // 時間更新の処理
  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    setCurrentTime(e.currentTarget.currentTime);
  };

  // 検索を実行する関数
  const performSearch = useCallback(
    debounce(async (query: string, page: number) => {
      if (!query) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchStockVideos(query, page);
        setSearchResults(prev => page === 1 ? results : [...prev, ...results]);
      } catch (error) {
        console.error('動画の検索に失敗しました:', error);
      } finally {
        setIsSearching(false);
      }
    }, 500),
    []
  );

  // 検索クエリが変更されたときの処理
  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query);
    setSearchPage(1);
    performSearch(query, 1);
  };

  // さらに読み込むボタンの処理
  const handleLoadMore = () => {
    const nextPage = searchPage + 1;
    setSearchPage(nextPage);
    performSearch(searchQuery, nextPage);
  };

  // フリー素材の動画を自動カットして追加する処理
  const handleStockVideoSelect = async (video: StockVideo) => {
    const segments: SlideItem[] = [];
    let currentTime = 0;

    while (currentTime < video.duration) {
      // ランダムな長さを生成（5-30秒）
      const segmentDuration = Math.min(
        video.duration - currentTime,
        Math.random() * (autoCutOptions.maxDuration - autoCutOptions.minDuration) + autoCutOptions.minDuration
      );

      segments.push({
        id: `slide-${Date.now()}-${currentTime}`,
        type: 'video',
        url: video.url,
        startTime: currentTime,
        endTime: currentTime + segmentDuration,
        transition: 'fade',
        source: video.source,
        author: video.author,
        authorUrl: video.authorUrl,
        originalStartTime: currentTime, // 元の動画内での開始時間
        originalEndTime: currentTime + segmentDuration // 元の動画内での終了時間
      });

      currentTime += segmentDuration;
    }

    // ランダムに並び替え（オプション）
    if (autoCutOptions.randomOrder) {
      segments.sort(() => Math.random() - 0.5);
    }

    // タイムラインに合わせて時間を再調整
    const adjustedSegments = segments.map((segment, index) => {
      const timelineStartTime = index === 0 ? 0 : segments[index - 1]?.endTime || 0;
      const duration = segment.originalEndTime - segment.originalStartTime;
      return {
        ...segment,
        startTime: timelineStartTime,
        endTime: timelineStartTime + duration
      };
    });

    setSlides(current => [...current, ...adjustedSegments]);
    onSlidesUpdate([...slides, ...adjustedSegments]);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newSlides: SlideItem[] = await Promise.all(
      files.map(async (file, index) => {
        const url = URL.createObjectURL(file);
        const isVideo = file.type.startsWith('video/');
        
        // 動画の場合は長さを取得
        let duration = 3; // デフォルトの表示時間（秒）
        if (isVideo) {
          const video = document.createElement('video');
          video.src = url;
          await new Promise(resolve => {
            video.onloadedmetadata = resolve;
          });
          duration = video.duration;
        }

        const startTime = index === 0 ? 0 : slides[slides.length - 1]?.endTime || 0;
        return {
          id: `slide-${Date.now()}-${index}`,
          type: isVideo ? 'video' : 'image',
          url,
          startTime,
          endTime: startTime + duration,
          transition: 'fade',
          duration: isVideo ? undefined : duration
        };
      })
    );

    setSlides(current => [...current, ...newSlides]);
    onSlidesUpdate([...slides, ...newSlides]);
  };

  const handleSlideUpdate = (id: string, updates: Partial<SlideItem>) => {
    setSlides(current =>
      current.map(slide =>
        slide.id === id
          ? { ...slide, ...updates }
          : slide
      )
    );
  };

  const handleSlideDurationChange = (id: string, duration: number) => {
    const slideIndex = slides.findIndex(s => s.id === id);
    if (slideIndex === -1) return;

    const updatedSlides = [...slides];
    const slide = updatedSlides[slideIndex];
    const newEndTime = slide.startTime + duration;

    // 更新対象のスライドの長さを変更
    updatedSlides[slideIndex] = {
      ...slide,
      endTime: newEndTime,
      duration: slide.type === 'image' ? duration : undefined
    };

    // 後続のスライドの開始時間と終了時間を調整
    for (let i = slideIndex + 1; i < updatedSlides.length; i++) {
      const prevSlide = updatedSlides[i - 1];
      const currentSlide = updatedSlides[i];
      const newStartTime = prevSlide.endTime;
      const slideDuration = currentSlide.endTime - currentSlide.startTime;
      
      updatedSlides[i] = {
        ...currentSlide,
        startTime: newStartTime,
        endTime: newStartTime + slideDuration
      };
    }

    setSlides(updatedSlides);
    onSlidesUpdate(updatedSlides);
  };

  const handleSlideDelete = (id: string) => {
    const slideIndex = slides.findIndex(s => s.id === id);
    if (slideIndex === -1) return;

    const updatedSlides = slides.filter(s => s.id !== id);
    
    // 後続のスライドの時間を調整
    for (let i = slideIndex; i < updatedSlides.length; i++) {
      const prevSlide = updatedSlides[i - 1];
      const currentSlide = updatedSlides[i];
      const newStartTime = prevSlide ? prevSlide.endTime : 0;
      const slideDuration = currentSlide.endTime - currentSlide.startTime;
      
      updatedSlides[i] = {
        ...currentSlide,
        startTime: newStartTime,
        endTime: newStartTime + slideDuration
      };
    }

    setSlides(updatedSlides);
    onSlidesUpdate(updatedSlides);
  };

  // シード画像の選択処理
  const handleSeedImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSeedImage(file);
      const url = URL.createObjectURL(file);
      setSeedImageUrl(url);

      // 画像解析とプロンプト生成
      setIsAnalyzing(true);
      try {
        const analysis = await analyzeImage(url);
        const suggestions = await generatePromptSuggestions(analysis);
        setPromptSuggestions(suggestions);
        
        // 最初の提案を自動選択
        if (suggestions.length > 0) {
          setSelectedPromptIndex(0);
          setAIOptions(prev => ({
            ...prev,
            prompt: suggestions[0].prompt,
            negativePrompt: suggestions[0].negativePrompt
          }));
        }
      } catch (error) {
        console.error('画像解析エラー:', error);
        alert('画像の解析に失敗しました');
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  // プロンプト提案の選択処理
  const handlePromptSelect = (index: number) => {
    setSelectedPromptIndex(index);
    const suggestion = promptSuggestions[index];
    setAIOptions(prev => ({
      ...prev,
      prompt: suggestion.prompt,
      negativePrompt: suggestion.negativePrompt
    }));
  };

  // AI画像生成処理
  const handleGenerateImages = async () => {
    if (!seedImageUrl) {
      alert('シード画像を選択してください');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress({ current: 0, total: aiOptions.numImages });

    try {
      const generatedImages = await generateImagesFromSeed(seedImageUrl, {
        ...aiOptions,
        onProgress: (progress) => {
          setGenerationProgress(progress);
        }
      });

      // 生成された画像をライブラリに保存
      const savedImages = await Promise.all(
        generatedImages.map(img => 
          addImageToLibrary(img.url, {
            sourceImage: seedImageUrl,
            prompt: aiOptions.prompt,
            negativePrompt: aiOptions.negativePrompt,
            folder: 'キャラクター',
            tags: promptSuggestions[selectedPromptIndex]?.explanation
              ? extractTagsFromExplanation(promptSuggestions[selectedPromptIndex].explanation)
              : [],
            seed: img.seed,
            model: 'consistent-character'
          })
        )
      );

      let newSlides = savedImages.map((img): SlideItem => ({
        id: img.id,
        type: 'image',
        url: img.url,
        startTime: 0,
        endTime: 3,
        transition: 'fade',
        duration: 3
      }));

      if (aiOptions.randomOrder) {
        newSlides.sort(() => Math.random() - 0.5);
      }

      newSlides = newSlides.map((slide, index) => ({
        ...slide,
        startTime: index === 0 ? 0 : newSlides[index - 1].endTime,
        endTime: (index === 0 ? 0 : newSlides[index - 1].endTime) + (slide.duration || 3)
      }));

      setSlides(current => [...current, ...newSlides]);
      onSlidesUpdate([...slides, ...newSlides]);
      setShowAIGenerate(false);
    } catch (error) {
      console.error('AI画像生成エラー:', error);
      alert('画像生成に失敗しました');
    } finally {
      setIsGenerating(false);
      setGenerationProgress(null);
    }
  };

  // 説明文からタグを抽出する関数
  function extractTagsFromExplanation(explanation: string): string[] {
    const tags: string[] = [];
    
    // キャラクター特徴に関するキーワード
    const characterFeatures = [
      'ポーズ', '表情', '髪型', '服装', '表情',
      '笑顔', '真剣', '楽しい', '悲しい', '怒り'
    ];

    // 画風に関するキーワード
    const styleFeatures = [
      'アニメ調', 'リアル', '漫画調', 'イラスト',
      'デフォルメ', '写実的', '水彩', 'デジタル'
    ];

    // 状況に関するキーワード
    const situationFeatures = [
      '戦闘', '日常', '学校', '仕事', '冒険',
      '室内', '屋外', '都会', '自然', '夜'
    ];

    // 各カテゴリーのキーワードを検索
    [...characterFeatures, ...styleFeatures, ...situationFeatures].forEach(keyword => {
      if (explanation.includes(keyword)) {
        tags.push(keyword);
      }
    });

    return tags;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">スライドショー編集</h3>
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            画像・動画を追加
          </button>
          <button
            onClick={() => setShowStockSearch(true)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            フリー素材を検索
          </button>
          <button
            onClick={() => setShowAIGenerate(true)}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            AI画像を生成
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* AI画像生成モーダル */}
      {showAIGenerate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">AI画像生成</h3>
              <button
                onClick={() => setShowAIGenerate(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <h4 className="font-medium mb-2">シード画像</h4>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400"
                onClick={() => seedImageInputRef.current?.click()}
              >
                {seedImageUrl ? (
                  <img
                    src={seedImageUrl}
                    alt="シード画像"
                    className="max-h-48 mx-auto"
                  />
                ) : (
                  <div className="text-gray-500">
                    クリックして画像をアップロード
                  </div>
                )}
              </div>
              <input
                ref={seedImageInputRef}
                type="file"
                accept="image/*"
                onChange={handleSeedImageSelect}
                className="hidden"
              />
            </div>

            {isAnalyzing && (
              <div className="mb-4 text-center text-gray-600">
                <p>画像を解析中...</p>
              </div>
            )}

            {promptSuggestions.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium mb-2">プロンプト提案</h4>
                <div className="space-y-2">
                  {promptSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded cursor-pointer transition-colors ${
                        selectedPromptIndex === index
                          ? 'bg-purple-100 border-2 border-purple-500'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                      onClick={() => handlePromptSelect(index)}
                    >
                      <div className="font-medium mb-1">提案 {index + 1}</div>
                      <div className="text-sm text-gray-600 mb-2">
                        {suggestion.explanation}
                      </div>
                      <div className="text-xs text-gray-500">
                        <div>プロンプト: {suggestion.prompt}</div>
                        <div>ネガティブ: {suggestion.negativePrompt}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">生成する枚数</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={aiOptions.numImages}
                  onChange={e => setAIOptions(prev => ({
                    ...prev,
                    numImages: Math.min(100, Math.max(1, parseInt(e.target.value)))
                  }))}
                  className="w-full p-2 border rounded"
                />
                <p className="text-xs text-gray-500 mt-1">
                  ※ 20枚以上の場合は自動的に複数回に分けて生成されます
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">プロンプト</label>
              <input
                type="text"
                value={aiOptions.prompt}
                onChange={e => setAIOptions(prev => ({
                  ...prev,
                  prompt: e.target.value
                }))}
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">ネガティブプロンプト</label>
              <input
                type="text"
                value={aiOptions.negativePrompt}
                onChange={e => setAIOptions(prev => ({
                  ...prev,
                  negativePrompt: e.target.value
                }))}
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={aiOptions.randomOrder}
                  onChange={e => setAIOptions(prev => ({
                    ...prev,
                    randomOrder: e.target.checked
                  }))}
                  className="rounded"
                />
                <span className="text-sm">ランダムに並び替える</span>
              </label>
            </div>

            {generationProgress && (
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-purple-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${(generationProgress.current / generationProgress.total) * 100}%` }}
                  ></div>
                </div>
                <p className="text-sm text-center mt-2">
                  {generationProgress.current} / {generationProgress.total} 枚生成完了
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAIGenerate(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                キャンセル
              </button>
              <button
                onClick={handleGenerateImages}
                disabled={!seedImageUrl || isGenerating || isAnalyzing}
                className={`px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 ${
                  (!seedImageUrl || isGenerating || isAnalyzing) && 'opacity-50 cursor-not-allowed'
                }`}
              >
                {isGenerating ? '生成中...' : '生成開始'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* フリー素材検索モーダル */}
      {showStockSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">フリー素材検索</h3>
              <button
                onClick={() => setShowStockSearch(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* 自動カット設定 */}
            <div className="mb-4 p-4 bg-gray-50 rounded">
              <h4 className="font-medium mb-2">自動カット設定</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">最小長さ（秒）</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={autoCutOptions.minDuration}
                    onChange={e => setAutoCutOptions(prev => ({
                      ...prev,
                      minDuration: Math.min(parseInt(e.target.value), prev.maxDuration)
                    }))}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">最大長さ（秒）</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={autoCutOptions.maxDuration}
                    onChange={e => setAutoCutOptions(prev => ({
                      ...prev,
                      maxDuration: Math.max(parseInt(e.target.value), prev.minDuration)
                    }))}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
              <div className="mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={autoCutOptions.randomOrder}
                    onChange={e => setAutoCutOptions(prev => ({
                      ...prev,
                      randomOrder: e.target.checked
                    }))}
                    className="rounded"
                  />
                  <span className="text-sm">ランダムに並び替える</span>
                </label>
              </div>
            </div>

            <div className="mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchQueryChange(e.target.value)}
                placeholder="キーワードを入力して動画を検索..."
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              {searchResults.map((video) => (
                <div
                  key={video.id}
                  className="border rounded overflow-hidden cursor-pointer hover:border-blue-500"
                  onClick={() => handleStockVideoSelect(video)}
                >
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full aspect-video object-cover"
                  />
                  <div className="p-2">
                    <div className="font-medium truncate">{video.title}</div>
                    <div className="text-sm text-gray-500">
                      {video.duration}秒 • {video.source}
                    </div>
                    <div className="text-xs text-gray-400">
                      By <a
                        href={video.authorUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="hover:underline"
                      >
                        {video.author}
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {isSearching && (
              <div className="text-center py-4">
                <p>検索中...</p>
              </div>
            )}

            {searchResults.length > 0 && !isSearching && (
              <div className="text-center mt-4">
                <button
                  onClick={handleLoadMore}
                  className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
                >
                  さらに読み込む
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BGM管理セクション */}
      <div className="mt-4">
        <BGMManager
          tracks={bgmTracks}
          onTracksChange={setBgmTracks}
          totalDuration={totalDuration}
          isPlaying={isPlaying}
          currentTime={currentTime}
        />
      </div>

      {/* プレビュー */}
      <div className="mt-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium">プレビュー</h4>
          <button
            onClick={handlePlayPause}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {isPlaying ? '停止' : '再生'}
          </button>
        </div>
        <div className="aspect-video bg-black rounded overflow-hidden">
          {selectedSlideId && (
            <div className="relative w-full h-full">
              {(() => {
                const slide = slides.find(s => s.id === selectedSlideId);
                if (!slide) return null;

                if (slide.type === 'video') {
                  return (
                    <video
                      ref={previewRef}
                      src={slide.url}
                      className="w-full h-full object-contain"
                      controls
                      onLoadedMetadata={(e) => {
                        const video = e.target as HTMLVideoElement;
                        video.currentTime = slide.originalStartTime || 0;
                      }}
                      onTimeUpdate={handleTimeUpdate}
                    />
                  );
                } else {
                  return (
                    <img
                      src={slide.url}
                      alt="プレビュー"
                      className="w-full h-full object-contain"
                    />
                  );
                }
              })()}
            </div>
          )}
        </div>
      </div>

      {/* タイムライン */}
      <div className="relative">
        <div className="h-20 bg-gray-100 rounded overflow-hidden">
          {/* スライド */}
          {slides.map(slide => (
            <div
              key={slide.id}
              className={`absolute h-1/2 top-0 cursor-pointer ${
                selectedSlideId === slide.id ? 'border-2 border-blue-500' : 'border border-gray-300'
              }`}
              style={{
                left: `${(slide.startTime / totalDuration) * 100}%`,
                width: `${((slide.endTime - slide.startTime) / totalDuration) * 100}%`,
                backgroundColor: slide.type === 'video' ? '#93c5fd' : '#fcd34d'
              }}
              onClick={() => setSelectedSlideId(slide.id)}
            >
              <div className="p-1 text-xs truncate">
                {slide.type === 'video' ? '動画' : '画像'}
              </div>
            </div>
          ))}

          {/* BGMトラック */}
          {bgmTracks.map(track => (
            <div
              key={track.id}
              className="absolute h-1/3 bottom-0 bg-purple-200 border border-purple-300 cursor-pointer"
              style={{
                left: `${(track.startTime / totalDuration) * 100}%`,
                width: `${(track.duration / totalDuration) * 100}%`,
                opacity: track.volume
              }}
              title={track.name}
            >
              <div className="p-1 text-xs truncate">
                {track.name}
              </div>
            </div>
          ))}

          {/* 再生位置インジケータ */}
          {isPlaying && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500"
              style={{
                left: `${(currentTime / totalDuration) * 100}%`
              }}
            />
          )}
        </div>
      </div>

      {/* 選択したスライドの編集フォーム */}
      {selectedSlideId && (
        <div className="p-4 bg-gray-50 rounded">
          <h4 className="font-medium mb-4">スライド設定</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">表示時間（秒）</label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={(slides.find(s => s.id === selectedSlideId)?.duration || 3).toString()}
                onChange={e => handleSlideDurationChange(selectedSlideId, parseFloat(e.target.value))}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">トランジション</label>
              <select
                value={slides.find(s => s.id === selectedSlideId)?.transition}
                onChange={e => handleSlideUpdate(selectedSlideId, { transition: e.target.value as 'fade' | 'slide' | 'none' })}
                className="w-full p-2 border rounded"
              >
                <option value="fade">フェード</option>
                <option value="slide">スライド</option>
                <option value="none">なし</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={() => handleSlideDelete(selectedSlideId)}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              削除
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 