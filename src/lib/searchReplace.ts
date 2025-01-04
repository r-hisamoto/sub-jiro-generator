import { Subtitle } from '@/types/subtitle';

/**
 * 検索オプション
 */
export interface SearchOptions {
  // 大文字小文字を区別するか
  caseSensitive?: boolean;
  // 正規表現を使用するか
  useRegex?: boolean;
  // 単語単位で検索するか
  wholeWord?: boolean;
  // 検索範囲（時間）
  timeRange?: {
    start: number;
    end: number;
  };
}

/**
 * 検索結果
 */
export interface SearchResult {
  subtitleId: string;
  text: string;
  startTime: number;
  endTime: number;
  matches: {
    start: number;
    end: number;
    text: string;
  }[];
}

/**
 * 字幕テキストを検索
 */
export const searchSubtitles = (
  subtitles: Subtitle[],
  searchText: string,
  options: SearchOptions = {}
): SearchResult[] => {
  const {
    caseSensitive = false,
    useRegex = false,
    wholeWord = false,
    timeRange
  } = options;

  // 検索パターンを作成
  let pattern: RegExp;
  if (useRegex) {
    try {
      pattern = new RegExp(searchText, caseSensitive ? 'g' : 'gi');
    } catch (error) {
      console.error('Invalid regex pattern:', error);
      return [];
    }
  } else {
    const escaped = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const wordBoundary = wholeWord ? '\\b' : '';
    pattern = new RegExp(
      `${wordBoundary}${escaped}${wordBoundary}`,
      caseSensitive ? 'g' : 'gi'
    );
  }

  // 検索を実行
  return subtitles
    .filter(subtitle => {
      // 時間範囲でフィルタリング
      if (timeRange) {
        if (subtitle.startTime < timeRange.start || subtitle.endTime > timeRange.end) {
          return false;
        }
      }
      return pattern.test(subtitle.text);
    })
    .map(subtitle => {
      const matches: { start: number; end: number; text: string; }[] = [];
      let match;
      pattern.lastIndex = 0;  // 正規表現のインデックスをリセット

      while ((match = pattern.exec(subtitle.text)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0]
        });
      }

      return {
        subtitleId: subtitle.id,
        text: subtitle.text,
        startTime: subtitle.startTime,
        endTime: subtitle.endTime,
        matches
      };
    });
};

/**
 * 置換オプション
 */
export interface ReplaceOptions extends SearchOptions {
  // 一括置換するか
  replaceAll?: boolean;
}

/**
 * 字幕テキストを置換
 */
export const replaceSubtitles = (
  subtitles: Subtitle[],
  searchText: string,
  replaceText: string,
  options: ReplaceOptions = {}
): Subtitle[] => {
  const {
    caseSensitive = false,
    useRegex = false,
    wholeWord = false,
    timeRange,
    replaceAll = true
  } = options;

  // 検索パターンを作成
  let pattern: RegExp;
  if (useRegex) {
    try {
      pattern = new RegExp(searchText, caseSensitive ? 'g' : 'gi');
    } catch (error) {
      console.error('Invalid regex pattern:', error);
      return subtitles;
    }
  } else {
    const escaped = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const wordBoundary = wholeWord ? '\\b' : '';
    pattern = new RegExp(
      `${wordBoundary}${escaped}${wordBoundary}`,
      replaceAll ? 'g' : ''
    );
  }

  // 置換を実行
  return subtitles.map(subtitle => {
    // 時間範囲外の字幕はスキップ
    if (timeRange) {
      if (subtitle.startTime < timeRange.start || subtitle.endTime > timeRange.end) {
        return subtitle;
      }
    }

    return {
      ...subtitle,
      text: subtitle.text.replace(pattern, replaceText)
    };
  });
}; 