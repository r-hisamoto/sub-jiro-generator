import React, { useState, useCallback, useEffect, useRef } from 'react';
import { TransitionSlide } from './TransitionSlide';
import { TransitionEffectSelector } from './TransitionEffectSelector';
import { ColorOverlaySelector } from './ColorOverlaySelector';
import { FeedbackToastContainer } from './FeedbackToast';
import { analytics } from '../lib/analytics';
import type { TransitionEffect, AnimationEffect } from '../lib/transitions';
import type { ColorOverlay } from '../lib/colorOverlays';
import type { UserFeedback } from '../lib/analytics';

interface Slide {
  id: string;
  content: React.ReactNode;
  transition?: TransitionEffect;
  effect?: AnimationEffect;
}

interface SlideShowProps {
  slides: Slide[];
  autoPlay?: boolean;
  interval?: number;
}

type TabType = 'transitions' | 'overlay' | 'settings';

export function SlideShow({
  slides,
  autoPlay = false,
  interval = 5000,
}: SlideShowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [selectedTransition, setSelectedTransition] = useState<TransitionEffect>();
  const [selectedEffect, setSelectedEffect] = useState<AnimationEffect>();
  const [selectedOverlay, setSelectedOverlay] = useState<ColorOverlay>();
  const [slidesList, setSlidesList] = useState<Slide[]>(slides);
  const [activeTab, setActiveTab] = useState<TabType>('transitions');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [feedbackList, setFeedbackList] = useState<UserFeedback[]>([]);

  const frameRef = useRef<number>();
  const lastFrameTimeRef = useRef<number>();

  // フィードバックの購読
  useEffect(() => {
    const unsubscribe = analytics.subscribeFeedback((feedback) => {
      setFeedbackList((prev) => [...prev, feedback]);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // パフォーマンスモニタリング
  useEffect(() => {
    const monitorPerformance = (timestamp: number) => {
      if (lastFrameTimeRef.current) {
        const frameTime = timestamp - lastFrameTimeRef.current;
        const frameRate = 1000 / frameTime;

        analytics.recordMetrics({
          renderTime: frameTime,
          frameRate,
          memoryUsage: (performance as any).memory?.usedJSHeapSize / (1024 * 1024) || 0,
        });
      }

      lastFrameTimeRef.current = timestamp;
      frameRef.current = requestAnimationFrame(monitorPerformance);
    };

    frameRef.current = requestAnimationFrame(monitorPerformance);
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  const goToNextSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % slidesList.length);
    analytics.trackAction('slide_change', { direction: 'next' });
  }, [slidesList.length]);

  const goToPrevSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + slidesList.length) % slidesList.length);
    analytics.trackAction('slide_change', { direction: 'prev' });
  }, [slidesList.length]);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
    analytics.trackAction('playback_toggle', { isPlaying: !isPlaying });
  }, [isPlaying]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
      analytics.trackAction('fullscreen_toggle', { isFullscreen: true });
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
      analytics.trackAction('fullscreen_toggle', { isFullscreen: false });
    }
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(goToNextSlide, interval);
    return () => clearInterval(timer);
  }, [isPlaying, interval, goToNextSlide]);

  const handleTransitionChange = useCallback((transition: TransitionEffect | undefined) => {
    setSelectedTransition(transition);
    if (transition) {
      setSlidesList(prev => {
        const newSlides = [...prev];
        newSlides[currentIndex] = {
          ...newSlides[currentIndex],
          transition,
        };
        return newSlides;
      });
      analytics.trackAction('transition_change', transition);
    }
  }, [currentIndex]);

  const handleEffectChange = useCallback((effect: AnimationEffect | undefined) => {
    setSelectedEffect(effect);
    if (effect) {
      setSlidesList(prev => {
        const newSlides = [...prev];
        newSlides[currentIndex] = {
          ...newSlides[currentIndex],
          effect,
        };
        return newSlides;
      });
      analytics.trackAction('effect_change', effect);
    }
  }, [currentIndex]);

  const handleBulkApplyTransitions = useCallback((selectedTransitions: TransitionEffect[]) => {
    if (selectedTransitions.length === 0) return;
    setSlidesList(prev => {
      const newSlides = [...prev];
      newSlides.forEach((slide, index) => {
        if (selectedTransitions.length === 1) {
          newSlides[index] = { ...slide, transition: selectedTransitions[0] };
        } else if (selectedTransitions.length === 2) {
          newSlides[index] = { ...slide, transition: selectedTransitions[index % 2] };
        } else {
          newSlides[index] = { 
            ...slide, 
            transition: selectedTransitions[index % selectedTransitions.length] 
          };
        }
      });
      return newSlides;
    });
    analytics.trackAction('bulk_transition_apply', { transitions: selectedTransitions });
  }, []);

  const handleOverlayChange = useCallback((overlay: ColorOverlay) => {
    setSelectedOverlay(overlay);
    analytics.trackAction('overlay_change', overlay);
  }, []);

  const handleFeedbackDismiss = useCallback((feedback: UserFeedback) => {
    setFeedbackList((prev) => prev.filter((f) => f !== feedback));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* プレビューエリア */}
          <div className="relative">
            <div 
              className={`relative w-full ${isFullscreen ? 'h-screen' : 'h-[60vh]'} bg-gray-900 overflow-hidden`}
              style={{ filter: selectedOverlay?.cssFilter }}
            >
              {slidesList.map((slide, index) => (
                <TransitionSlide
                  key={slide.id}
                  isActive={index === currentIndex}
                  transition={slide.transition || selectedTransition}
                  effect={slide.effect || selectedEffect}
                >
                  {slide.content}
                </TransitionSlide>
              ))}
            </div>

            {/* コントロールオーバーレイ */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <button
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                    onClick={goToPrevSlide}
                  >
                    ←
                  </button>
                  <button
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                    onClick={togglePlay}
                  >
                    {isPlaying ? '■' : '▶'}
                  </button>
                  <button
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                    onClick={goToNextSlide}
                  >
                    →
                  </button>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-white text-sm">
                    {currentIndex + 1} / {slidesList.length}
                  </span>
                  <button
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                    onClick={toggleFullscreen}
                  >
                    {isFullscreen ? '↙' : '↗'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 設定パネル */}
          <div className="border-t">
            <div className="flex border-b">
              <button
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'transitions'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('transitions')}
              >
                トランジション・エフェクト
              </button>
              <button
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'overlay'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('overlay')}
              >
                カラーオーバーレイ
              </button>
              <button
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'settings'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('settings')}
              >
                設定
              </button>
            </div>

            <div className="p-6">
              {activeTab === 'transitions' && (
                <TransitionEffectSelector
                  selectedTransition={selectedTransition}
                  selectedEffect={selectedEffect}
                  onTransitionChange={handleTransitionChange}
                  onEffectChange={handleEffectChange}
                  onBulkApplyTransitions={handleBulkApplyTransitions}
                />
              )}
              {activeTab === 'overlay' && (
                <ColorOverlaySelector
                  selectedOverlay={selectedOverlay}
                  onChange={handleOverlayChange}
                />
              )}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      自動再生設定
                    </h3>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isPlaying}
                          onChange={togglePlay}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-600">自動再生を有効にする</span>
                      </label>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">間隔:</span>
                        <input
                          type="number"
                          value={interval / 1000}
                          onChange={(e) => interval = Number(e.target.value) * 1000}
                          className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          min="1"
                          max="60"
                        />
                        <span className="text-sm text-gray-600">秒</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      使用統計
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <dl className="grid grid-cols-2 gap-4">
                        {Object.entries(analytics.getUsageStats()).map(([key, value]) => (
                          <div key={key}>
                            <dt className="text-sm font-medium text-gray-500">
                              {key}
                            </dt>
                            <dd className="mt-1 text-lg font-semibold text-gray-900">
                              {typeof value === 'number' ? value.toFixed(1) : value}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <FeedbackToastContainer
        feedbackList={feedbackList}
        onDismiss={handleFeedbackDismiss}
      />
    </div>
  );
}

export type { SlideShowProps, Slide }; 