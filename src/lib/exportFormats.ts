import { Subtitle } from '@/types/subtitle';

/**
 * WebVTTのスタイル設定のためのオプション
 */
export interface WebVTTStyleOptions {
  // フォントサイズ（例: '16px'）
  fontSize?: string;
  // フォントファミリー
  fontFamily?: string;
  // テキストの色（例: '#FFFFFF'）
  color?: string;
  // 背景色（例: '#000000'）
  backgroundColor?: string;
  // テキストの位置（'start' | 'middle' | 'end'）
  position?: 'start' | 'middle' | 'end';
  // テキストの配置（'start' | 'center' | 'end'）
  align?: 'start' | 'center' | 'end';
  // 行の位置（例: '10%'）
  line?: string;
}

const DEFAULT_WEBVTT_STYLE: WebVTTStyleOptions = {
  fontSize: '16px',
  fontFamily: 'sans-serif',
  color: '#FFFFFF',
  backgroundColor: '#000000',
  position: 'middle',
  align: 'center',
  line: '90%'
};

/**
 * 時間をWebVTT形式に変換する（HH:MM:SS.mmm）
 */
const formatTimeToWebVTT = (timeInSeconds: number): string => {
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  const milliseconds = Math.floor((timeInSeconds % 1) * 1000);

  return `${hours.toString().padStart(2, '0')}:${
    minutes.toString().padStart(2, '0')}:${
    seconds.toString().padStart(2, '0')}.${
    milliseconds.toString().padStart(3, '0')}`;
};

/**
 * WebVTTのスタイル設定を生成する
 */
const generateWebVTTStyle = (options: WebVTTStyleOptions = {}): string => {
  const mergedOptions = { ...DEFAULT_WEBVTT_STYLE, ...options };
  
  return `STYLE
::cue {
  font-size: ${mergedOptions.fontSize};
  font-family: ${mergedOptions.fontFamily};
  color: ${mergedOptions.color};
  background-color: ${mergedOptions.backgroundColor};
}`;
};

/**
 * 字幕をWebVTT形式に変換する
 */
export const convertToWebVTT = (
  subtitles: Subtitle[],
  styleOptions?: WebVTTStyleOptions
): string => {
  const header = 'WEBVTT\n\n';
  const style = styleOptions ? generateWebVTTStyle(styleOptions) + '\n\n' : '';
  
  const content = subtitles.map((subtitle, index) => {
    const cue = `${index + 1}\n${
      formatTimeToWebVTT(subtitle.startTime)} --> ${
      formatTimeToWebVTT(subtitle.endTime)}${
      styleOptions ? ` line:${styleOptions.line} position:${styleOptions.position} align:${styleOptions.align}` : ''
    }\n${subtitle.text}\n`;
    return cue;
  }).join('\n');
  
  return header + style + content;
};

/**
 * WebVTTファイルをダウンロードする
 */
export const downloadWebVTT = (
  subtitles: Subtitle[],
  filename: string,
  styleOptions?: WebVTTStyleOptions
): void => {
  const content = convertToWebVTT(subtitles, styleOptions);
  const blob = new Blob([content], { type: 'text/vtt' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.vtt') ? filename : `${filename}.vtt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}; 