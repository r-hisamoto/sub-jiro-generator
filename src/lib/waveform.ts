/**
 * 波形データの構造
 */
export interface WaveformData {
  peaks: number[];
  duration: number;
  samplesPerPixel: number;
  sampleRate: number;
}

/**
 * 波形描画のオプション
 */
export interface WaveformOptions {
  width: number;
  height: number;
  waveColor?: string;
  progressColor?: string;
  backgroundColor?: string;
  cursorColor?: string;
  barWidth?: number;
  barGap?: number;
  pixelsPerSecond?: number;
}

/**
 * オーディオデータから波形データを生成
 */
export const generateWaveformData = async (
  audioBuffer: AudioBuffer,
  options: { width: number; pixelsPerSecond?: number }
): Promise<WaveformData> => {
  const { width, pixelsPerSecond = 100 } = options;
  const duration = audioBuffer.duration;
  const sampleRate = audioBuffer.sampleRate;
  const samplesPerPixel = Math.floor(sampleRate / pixelsPerSecond);
  const numberOfChannels = audioBuffer.numberOfChannels;
  const peaks: number[] = [];

  // 各チャンネルのデータを結合
  const channelData: Float32Array[] = [];
  for (let channel = 0; channel < numberOfChannels; channel++) {
    channelData.push(audioBuffer.getChannelData(channel));
  }

  // ピークデータを計算
  for (let i = 0; i < width; i++) {
    const start = i * samplesPerPixel;
    const end = start + samplesPerPixel;
    let min = 1.0;
    let max = -1.0;

    for (let j = start; j < end; j++) {
      let value = 0;
      // 全チャンネルの平均を取る
      for (let channel = 0; channel < numberOfChannels; channel++) {
        value += channelData[channel][j] || 0;
      }
      value /= numberOfChannels;

      if (value < min) min = value;
      if (value > max) max = value;
    }

    // 正規化
    peaks.push((Math.abs(min) + Math.abs(max)) / 2);
  }

  return {
    peaks,
    duration,
    samplesPerPixel,
    sampleRate
  };
};

/**
 * 波形をキャンバスに描画
 */
export const drawWaveform = (
  ctx: CanvasRenderingContext2D,
  waveformData: WaveformData,
  options: WaveformOptions,
  currentTime: number = 0
): void => {
  const {
    width,
    height,
    waveColor = '#4a5568',
    progressColor = '#3182ce',
    backgroundColor = '#ffffff',
    cursorColor = '#e53e3e',
    barWidth = 2,
    barGap = 1
  } = options;

  // 背景をクリア
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  const middle = height / 2;
  const barCount = waveformData.peaks.length;
  const progressWidth = (currentTime / waveformData.duration) * width;

  // 波形を描画
  for (let i = 0; i < barCount; i++) {
    const x = i * (barWidth + barGap);
    const peak = waveformData.peaks[i];
    const barHeight = peak * height;

    // プログレスに応じて色を変更
    ctx.fillStyle = x < progressWidth ? progressColor : waveColor;

    // 上下対称に描画
    ctx.fillRect(
      x,
      middle - barHeight / 2,
      barWidth,
      barHeight
    );
  }

  // 現在位置のカーソルを描画
  const cursorX = (currentTime / waveformData.duration) * width;
  ctx.strokeStyle = cursorColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cursorX, 0);
  ctx.lineTo(cursorX, height);
  ctx.stroke();
};

/**
 * 時間からX座標を計算
 */
export const timeToX = (
  time: number,
  duration: number,
  width: number
): number => {
  return (time / duration) * width;
};

/**
 * X座標から時間を計算
 */
export const xToTime = (
  x: number,
  duration: number,
  width: number
): number => {
  return (x / width) * duration;
}; 