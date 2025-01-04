import { useEffect, useRef, useState } from 'react';
import {
  WaveformData,
  WaveformOptions,
  generateWaveformData,
  drawWaveform,
  timeToX,
  xToTime
} from '@/lib/waveform';
import { cn } from '@/lib/utils';

interface WaveformProps {
  audioUrl: string;
  currentTime: number;
  duration: number;
  onTimeChange?: (time: number) => void;
  onRegionChange?: (start: number, end: number) => void;
  className?: string;
  options?: Partial<WaveformOptions>;
}

const Waveform: React.FC<WaveformProps> = ({
  audioUrl,
  currentTime,
  duration,
  onTimeChange,
  onRegionChange,
  className,
  options = {}
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [waveformData, setWaveformData] = useState<WaveformData | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isRegionSelecting, setIsRegionSelecting] = useState(false);
  const [regionStart, setRegionStart] = useState<number | null>(null);
  const [regionEnd, setRegionEnd] = useState<number | null>(null);

  // 波形データの生成
  useEffect(() => {
    const loadAudio = async () => {
      try {
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const data = await generateWaveformData(audioBuffer, {
          width: containerRef.current?.clientWidth || 800,
          pixelsPerSecond: options.pixelsPerSecond || 100
        });

        setWaveformData(data);
      } catch (error) {
        console.error('Error loading audio:', error);
      }
    };

    loadAudio();
  }, [audioUrl, options.pixelsPerSecond]);

  // 波形の描画
  useEffect(() => {
    if (!canvasRef.current || !waveformData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const defaultOptions: WaveformOptions = {
      width: canvas.width,
      height: canvas.height,
      waveColor: '#4a5568',
      progressColor: '#3182ce',
      backgroundColor: '#ffffff',
      cursorColor: '#e53e3e',
      barWidth: 2,
      barGap: 1,
      ...options
    };

    drawWaveform(ctx, waveformData, defaultOptions, currentTime);

    // 選択領域の描画
    if (regionStart !== null && regionEnd !== null) {
      const x1 = timeToX(regionStart, duration, canvas.width);
      const x2 = timeToX(regionEnd, duration, canvas.width);
      ctx.fillStyle = 'rgba(49, 130, 206, 0.2)';
      ctx.fillRect(x1, 0, x2 - x1, canvas.height);
    }
  }, [waveformData, currentTime, options, regionStart, regionEnd, duration]);

  // キャンバスのリサイズ処理
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current || !containerRef.current) return;

      const { width, height } = containerRef.current.getBoundingClientRect();
      canvasRef.current.width = width;
      canvasRef.current.height = height;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // マウスイベントハンドラ
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = xToTime(x, duration, rect.width);

    if (e.shiftKey) {
      setIsRegionSelecting(true);
      setRegionStart(time);
      setRegionEnd(time);
    } else {
      setIsDragging(true);
      onTimeChange?.(time);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = xToTime(x, duration, rect.width);

    if (isDragging) {
      onTimeChange?.(time);
    } else if (isRegionSelecting && regionStart !== null) {
      setRegionEnd(time);
      onRegionChange?.(regionStart, time);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsRegionSelecting(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setIsRegionSelecting(false);
  };

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full h-24', className)}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-pointer"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
};

export default Waveform; 