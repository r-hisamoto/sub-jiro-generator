import { BGMTrack } from '@/types';

interface FadeOptions {
  startTime: number;
  duration: number;
  type: 'in' | 'out';
  curve: 'linear' | 'exponential' | 'logarithmic';
}

interface CrossFadeOptions {
  trackA: BGMTrack;
  trackB: BGMTrack;
  duration: number;
  curve: 'linear' | 'exponential' | 'logarithmic';
}

/**
 * フェードエフェクトを適用する関数
 */
export function applyFadeEffect(audioContext: AudioContext, source: AudioBufferSourceNode, options: FadeOptions): GainNode {
  const gainNode = audioContext.createGain();
  const startValue = options.type === 'in' ? 0 : 1;
  const endValue = options.type === 'in' ? 1 : 0;
  
  gainNode.gain.setValueAtTime(startValue, options.startTime);
  
  switch (options.curve) {
    case 'exponential':
      gainNode.gain.exponentialRampToValueAtTime(endValue, options.startTime + options.duration);
      break;
    case 'logarithmic':
      // カスタムの対数カーブを実装
      const steps = 100;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const value = options.type === 'in'
          ? Math.log(t * 9 + 1) / Math.log(10)
          : Math.log((1 - t) * 9 + 1) / Math.log(10);
        gainNode.gain.linearRampToValueAtTime(
          value,
          options.startTime + (options.duration * t)
        );
      }
      break;
    default:
      gainNode.gain.linearRampToValueAtTime(endValue, options.startTime + options.duration);
  }

  source.connect(gainNode);
  return gainNode;
}

/**
 * クロスフェードを適用する関数
 */
export function applyCrossFade(
  audioContext: AudioContext,
  sourceA: AudioBufferSourceNode,
  sourceB: AudioBufferSourceNode,
  options: CrossFadeOptions
): [GainNode, GainNode] {
  const gainNodeA = audioContext.createGain();
  const gainNodeB = audioContext.createGain();
  
  sourceA.connect(gainNodeA);
  sourceB.connect(gainNodeB);
  
  const startTime = Math.max(options.trackA.startTime, options.trackB.startTime);
  
  // トラックAのフェードアウト
  applyFadeEffect(audioContext, sourceA, {
    startTime,
    duration: options.duration,
    type: 'out',
    curve: options.curve
  });
  
  // トラックBのフェードイン
  applyFadeEffect(audioContext, sourceB, {
    startTime,
    duration: options.duration,
    type: 'in',
    curve: options.curve
  });
  
  return [gainNodeA, gainNodeB];
}

/**
 * 波形データを生成する関数
 */
export async function generateWaveformData(audioBuffer: AudioBuffer, samples: number = 100): Promise<number[]> {
  const channelData = audioBuffer.getChannelData(0);
  const blockSize = Math.floor(channelData.length / samples);
  const waveform: number[] = [];
  
  for (let i = 0; i < samples; i++) {
    const start = blockSize * i;
    let sum = 0;
    
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(channelData[start + j]);
    }
    
    waveform.push(sum / blockSize);
  }
  
  // 正規化
  const max = Math.max(...waveform);
  return waveform.map(value => value / max);
}

/**
 * オーディオファイルを読み込んでAudioBufferを生成する関数
 */
export async function loadAudioFile(url: string, audioContext: AudioContext): Promise<AudioBuffer> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return await audioContext.decodeAudioData(arrayBuffer);
}

/**
 * 波形キャンバスを描画する関数
 */
export function drawWaveform(
  canvas: HTMLCanvasElement,
  waveformData: number[],
  color: string = '#4B5563',
  backgroundColor: string = '#F3F4F6'
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  const { width, height } = canvas;
  const middle = height / 2;
  
  // 背景をクリア
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);
  
  // 波形を描画
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  
  const step = width / waveformData.length;
  
  waveformData.forEach((value, index) => {
    const x = step * index;
    const amplitude = value * (height / 2);
    
    if (index === 0) {
      ctx.moveTo(x, middle + amplitude);
    } else {
      ctx.lineTo(x, middle + amplitude);
    }
  });
  
  waveformData.reverse().forEach((value, index) => {
    const x = width - (step * index);
    const amplitude = value * (height / 2);
    ctx.lineTo(x, middle - amplitude);
  });
  
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = color + '40'; // 40は透明度
  ctx.fill();
} 