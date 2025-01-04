import { Subtitle } from '@/types/subtitle';
import { getTokenizer } from '@/lib/textFormatting';
import type { IpadicFeatures } from 'kuromoji';

/**
 * セグメント分割のためのオプション
 */
export interface SegmentAnalyzerOptions {
  // 最小セグメント長（秒）
  minSegmentDuration?: number;
  // 最大セグメント長（秒）
  maxSegmentDuration?: number;
  // ポーズの閾値（秒）
  pauseThreshold?: number;
  // 話題転換を検知する際の類似度閾値（0-1）
  topicSimilarityThreshold?: number;
  // 話題転換検知に使用する前後の字幕数
  contextWindowSize?: number;
}

const DEFAULT_OPTIONS: SegmentAnalyzerOptions = {
  minSegmentDuration: 60,    // 1分
  maxSegmentDuration: 300,   // 5分
  pauseThreshold: 2.0,       // 2秒
  topicSimilarityThreshold: 0.3,
  contextWindowSize: 5
};

/**
 * セグメントの情報
 */
export interface Segment {
  startTime: number;
  endTime: number;
  subtitles: Subtitle[];
  topic?: string;
}

/**
 * ポーズ情報に基づいてセグメントを分割
 */
export const splitByPause = (
  subtitles: Subtitle[],
  options: SegmentAnalyzerOptions = {}
): Segment[] => {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const segments: Segment[] = [];
  let currentSegment: Subtitle[] = [];
  let segmentStartTime = subtitles[0]?.startTime ?? 0;

  for (let i = 0; i < subtitles.length; i++) {
    const currentSubtitle = subtitles[i];
    const nextSubtitle = subtitles[i + 1];
    currentSegment.push(currentSubtitle);

    // セグメント分割の条件をチェック
    const shouldSplit = 
      // 次の字幕がない場合（最後のセグメント）
      !nextSubtitle ||
      // ポーズが閾値を超える場合
      (nextSubtitle.startTime - currentSubtitle.endTime > mergedOptions.pauseThreshold!) ||
      // 現在のセグメントが最大長を超える場合
      (currentSubtitle.endTime - segmentStartTime > mergedOptions.maxSegmentDuration!);

    if (shouldSplit) {
      // セグメントが最小長を超えている場合のみ追加
      if (currentSubtitle.endTime - segmentStartTime >= mergedOptions.minSegmentDuration!) {
        segments.push({
          startTime: segmentStartTime,
          endTime: currentSubtitle.endTime,
          subtitles: [...currentSegment]
        });
      }
      // 新しいセグメントの準備
      currentSegment = [];
      segmentStartTime = nextSubtitle?.startTime ?? currentSubtitle.endTime;
    }
  }

  return segments;
};

/**
 * 形態素解析を使用して話題の類似度を計算
 */
const calculateTopicSimilarity = async (
  text1: string,
  text2: string
): Promise<number> => {
  try {
    const tokenizer = await getTokenizer();
    const tokens1 = tokenizer.tokenize(text1);
    const tokens2 = tokenizer.tokenize(text2);

    // 重要な品詞（名詞、動詞、形容詞）のみを抽出
    const getKeywords = (tokens: IpadicFeatures[]) => 
      tokens
        .filter(token => ['名詞', '動詞', '形容詞'].includes(token.pos))
        .map(token => token.basic_form);

    const keywords1 = new Set(getKeywords(tokens1));
    const keywords2 = new Set(getKeywords(tokens2));

    // Jaccard係数で類似度を計算
    const intersection = new Set([...keywords1].filter(x => keywords2.has(x)));
    const union = new Set([...keywords1, ...keywords2]);

    return intersection.size / union.size;
  } catch (error) {
    console.error('Error in calculateTopicSimilarity:', error);
    return 0;
  }
};

/**
 * 話題の転換を検知してセグメントを分割
 */
export const splitByTopicChange = async (
  subtitles: Subtitle[],
  options: SegmentAnalyzerOptions = {}
): Promise<Segment[]> => {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const segments: Segment[] = [];
  let currentSegment: Subtitle[] = [];
  let segmentStartTime = subtitles[0]?.startTime ?? 0;

  // 前後のコンテキストを結合してテキストを生成
  const getContextText = (index: number, windowSize: number) => {
    const start = Math.max(0, index - windowSize);
    const end = Math.min(subtitles.length, index + windowSize + 1);
    return subtitles.slice(start, end).map(s => s.text).join(' ');
  };

  for (let i = 0; i < subtitles.length; i++) {
    const currentSubtitle = subtitles[i];
    currentSegment.push(currentSubtitle);

    // 一定間隔ごとに話題の転換を検知
    if (currentSegment.length >= mergedOptions.contextWindowSize!) {
      const prevContext = getContextText(i - mergedOptions.contextWindowSize!, mergedOptions.contextWindowSize!);
      const nextContext = getContextText(i, mergedOptions.contextWindowSize!);
      
      const similarity = await calculateTopicSimilarity(prevContext, nextContext);
      
      // 話題の転換を検知した場合、またはセグメントが最大長を超えた場合
      const shouldSplit = 
        similarity < mergedOptions.topicSimilarityThreshold! ||
        (currentSubtitle.endTime - segmentStartTime > mergedOptions.maxSegmentDuration!);

      if (shouldSplit && currentSubtitle.endTime - segmentStartTime >= mergedOptions.minSegmentDuration!) {
        segments.push({
          startTime: segmentStartTime,
          endTime: currentSubtitle.endTime,
          subtitles: [...currentSegment],
          topic: await detectTopic(currentSegment)
        });
        currentSegment = [];
        segmentStartTime = subtitles[i + 1]?.startTime ?? currentSubtitle.endTime;
      }
    }
  }

  // 最後のセグメントを追加
  if (currentSegment.length > 0) {
    const lastSubtitle = currentSegment[currentSegment.length - 1];
    segments.push({
      startTime: segmentStartTime,
      endTime: lastSubtitle.endTime,
      subtitles: currentSegment,
      topic: await detectTopic(currentSegment)
    });
  }

  return segments;
};

/**
 * セグメントの主要なトピックを検出
 */
const detectTopic = async (subtitles: Subtitle[]): Promise<string> => {
  try {
    const tokenizer = await getTokenizer();
    const text = subtitles.map(s => s.text).join(' ');
    const tokens = tokenizer.tokenize(text);

    // 名詞の出現頻度を計算
    const nounFreq = new Map<string, number>();
    tokens
      .filter(token => token.pos === '名詞')
      .forEach(token => {
        const noun = token.basic_form;
        nounFreq.set(noun, (nounFreq.get(noun) || 0) + 1);
      });

    // 出現頻度でソートして上位3つの名詞を取得
    const topNouns = Array.from(nounFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([noun]) => noun);

    return topNouns.join('、');
  } catch (error) {
    console.error('Error in detectTopic:', error);
    return '';
  }
}; 