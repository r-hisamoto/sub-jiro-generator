import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { Subtitle } from '@/types/subtitle';

/**
 * 字幕バーナーのスタイル設定のためのオプション
 */
export interface SubtitleBurnerOptions {
  // フォントサイズ（ピクセル）
  fontSize?: number;
  // フォントファミリー（システムにインストールされているフォント名）
  fontFamily?: string;
  // テキストの色（16進数）
  color?: string;
  // 背景色（16進数）
  backgroundColor?: string;
  // テキストの位置（x, y座標、%指定可）
  position?: {
    x: string;
    y: string;
  };
  // 出力ファイルの形式
  outputFormat?: 'mp4' | 'webm' | 'mov';
  // エンコード設定
  encodingOptions?: {
    // ビデオコーデック
    videoCodec?: 'libx264' | 'libvpx-vp9';
    // ビデオビットレート（kbps）
    videoBitrate?: number;
    // CRF（品質）値（0-51、低いほど高品質）
    crf?: number;
    // プリセット（エンコード速度と圧縮率のバランス）
    preset?: 'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 'medium' | 'slow' | 'slower' | 'veryslow';
  };
}

const DEFAULT_BURNER_OPTIONS: SubtitleBurnerOptions = {
  fontSize: 32,
  fontFamily: 'sans-serif',
  color: '#FFFFFF',
  backgroundColor: '#000000',
  position: {
    x: '(w-text_w)/2',  // 中央揃え
    y: 'h-text_h-20'    // 下部に配置（20ピクセルのマージン）
  },
  outputFormat: 'mp4',
  encodingOptions: {
    videoCodec: 'libx264',
    videoBitrate: 2000,
    crf: 23,
    preset: 'medium'
  }
};

/**
 * 字幕をフィルタコマンドに変換する
 */
const generateSubtitleFilters = (
  subtitles: Subtitle[],
  options: SubtitleBurnerOptions
): string => {
  const filters: string[] = [];
  
  subtitles.forEach((subtitle, index) => {
    const startTime = subtitle.startTime;
    const endTime = subtitle.endTime;
    const text = subtitle.text.replace(/'/g, "'\\''");  // シングルクォートをエスケープ
    
    const drawtext = [
      `drawtext=text='${text}'`,
      `fontsize=${options.fontSize}`,
      `fontcolor=${options.color}`,
      `box=1`,
      `boxcolor=${options.backgroundColor}`,
      `x=${options.position?.x}`,
      `y=${options.position?.y}`,
      `enable='between(t,${startTime},${endTime})'`
    ].join(':');
    
    filters.push(drawtext);
  });
  
  return filters.join(',');
};

/**
 * 字幕を動画に焼き付ける
 */
export const burnSubtitles = async (
  videoFile: File,
  subtitles: Subtitle[],
  options: SubtitleBurnerOptions = {}
): Promise<Blob> => {
  const ffmpeg = new FFmpeg();
  const mergedOptions = { ...DEFAULT_BURNER_OPTIONS, ...options };
  
  try {
    // FFmpegを読み込む
    await ffmpeg.load();
    
    // 入力ファイルを書き込む
    await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile));
    
    // フィルタを生成
    const filters = generateSubtitleFilters(subtitles, mergedOptions);
    
    // エンコード設定を構築
    const {
      videoCodec,
      videoBitrate,
      crf,
      preset
    } = mergedOptions.encodingOptions!;
    
    // 出力ファイル名を構築
    const outputFilename = `output.${mergedOptions.outputFormat}`;
    
    // FFmpegコマンドを実行
    await ffmpeg.exec([
      '-i', 'input.mp4',
      '-vf', filters,
      '-c:v', videoCodec!,
      '-b:v', `${videoBitrate}k`,
      '-crf', crf!.toString(),
      '-preset', preset!,
      '-c:a', 'copy',
      outputFilename
    ]);
    
    // 出力ファイルを読み込む
    const data = await ffmpeg.readFile(outputFilename);
    
    // Blobを生成して返す
    return new Blob(
      [data],
      { type: `video/${mergedOptions.outputFormat}` }
    );
    
  } catch (error) {
    console.error('Error in burnSubtitles:', error);
    throw error;
  } finally {
    // リソースを解放
    await ffmpeg.terminate();
  }
};

/**
 * 字幕付き動画をダウンロードする
 */
export const downloadBurnedVideo = async (
  videoFile: File,
  subtitles: Subtitle[],
  filename: string,
  options?: SubtitleBurnerOptions
): Promise<void> => {
  try {
    const blob = await burnSubtitles(videoFile, subtitles, options);
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Error in downloadBurnedVideo:', error);
    throw error;
  }
}; 