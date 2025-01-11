import { Subtitle } from '@/types';

interface TranscriptionSegment {
  text: string;
  startTime: number;
  endTime: number;
}

export function matchSubtitles(
  transcription: TranscriptionSegment[],
  scriptText: string
): Subtitle[] {
  // テキストを文単位に分割
  const sentences = scriptText
    .split(/[。.!?！？\n]/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  // 文字列の類似度を計算する関数（レーベンシュタイン距離を使用）
  const calculateSimilarity = (str1: string, str2: string): number => {
    const matrix: number[][] = [];
    const len1 = str1.length;
    const len2 = str2.length;

    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
      for (let j = 1; j <= len2; j++) {
        if (i === 0) {
          matrix[i][j] = j;
        } else {
          const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j - 1] + cost
          );
        }
      }
    }

    // 類似度を0-1の範囲で返す（1が完全一致）
    const maxLength = Math.max(len1, len2);
    return 1 - matrix[len1][len2] / maxLength;
  };

  // 各文に最も近い音声認識結果を見つける
  const matchedSubtitles: Subtitle[] = [];
  let transcriptionIndex = 0;

  sentences.forEach((sentence, index) => {
    let bestMatch = {
      similarity: -1,
      segment: null as TranscriptionSegment | null,
    };

    // 現在位置から数セグメント先まで探索
    for (let i = 0; i < 3 && transcriptionIndex + i < transcription.length; i++) {
      const segment = transcription[transcriptionIndex + i];
      const similarity = calculateSimilarity(
        segment.text.toLowerCase(),
        sentence.toLowerCase()
      );

      if (similarity > bestMatch.similarity) {
        bestMatch = { similarity, segment };
      }
    }

    if (bestMatch.segment && bestMatch.similarity > 0.6) {
      matchedSubtitles.push({
        id: `subtitle-${index}`,
        text: sentence,
        startTime: bestMatch.segment.startTime,
        endTime: bestMatch.segment.endTime,
      });
      
      // 次の探索開始位置を更新
      transcriptionIndex = transcription.findIndex(
        seg => seg === bestMatch.segment
      ) + 1;
    } else {
      // マッチする音声セグメントが見つからない場合は、
      // 前の字幕の終了時間か0秒から開始する
      const prevSubtitle = matchedSubtitles[matchedSubtitles.length - 1];
      const startTime = prevSubtitle ? prevSubtitle.endTime : 0;
      
      matchedSubtitles.push({
        id: `subtitle-${index}`,
        text: sentence,
        startTime,
        endTime: startTime + 3, // デフォルトで3秒間表示
      });
    }
  });

  return matchedSubtitles;
}

// 字幕のタイミングを最適化する
export function optimizeSubtitleTiming(subtitles: Subtitle[]): Subtitle[] {
  return subtitles.map((subtitle, index) => {
    const next = subtitles[index + 1];
    const minDuration = 1; // 最小表示時間（秒）
    const maxDuration = 5; // 最大表示時間（秒）
    const gap = 0.1; // 字幕間のギャップ（秒）

    let duration = subtitle.endTime - subtitle.startTime;
    duration = Math.max(minDuration, Math.min(maxDuration, duration));

    let endTime = subtitle.startTime + duration;
    if (next) {
      endTime = Math.min(endTime, next.startTime - gap);
    }

    return {
      ...subtitle,
      endTime,
    };
  });
} 