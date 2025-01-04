import { Subtitle } from '@/types';

interface ReviewResult {
  originalText: string;
  suggestedText: string;
  confidence: number;
  reason: string;
}

interface TranscriptionSegment {
  text: string;
  startTime: number;
  endTime: number;
}

// 文脈から不自然な表現を検出する
function detectContextualAnomalies(segments: TranscriptionSegment[]): ReviewResult[] {
  const results: ReviewResult[] = [];
  const contextWindow = 3; // 前後3文を参照

  segments.forEach((segment, index) => {
    const start = Math.max(0, index - contextWindow);
    const end = Math.min(segments.length, index + contextWindow + 1);
    const context = segments.slice(start, end);
    
    // 文脈上の不自然さを検出
    const anomalies = findAnomalies(segment.text, context);
    if (anomalies) {
      results.push(anomalies);
    }
  });

  return results;
}

// 文法的な問題を検出する
function detectGrammaticalIssues(text: string): ReviewResult | null {
  // 一般的な文法パターンとの比較
  const patterns = [
    {
      pattern: /です(?!。|か|が|けど|ね|よ)/,
      suggestion: (match: string) => `${match}。`,
      reason: '文末の句点が抜けている可能性があります'
    },
    {
      pattern: /([あ-んア-ン])([あ-んア-ン])\1\2/,
      suggestion: (match: string) => match.slice(0, 2),
      reason: '音声認識による単語の重複が発生している可能性があります'
    },
    {
      pattern: /([、。！？])\1+/,
      suggestion: (match: string) => match[0],
      reason: '句読点が重複しています'
    }
  ];

  for (const { pattern, suggestion, reason } of patterns) {
    if (pattern.test(text)) {
      const suggestedText = text.replace(pattern, suggestion);
      return {
        originalText: text,
        suggestedText,
        confidence: 0.8,
        reason
      };
    }
  }

  return null;
}

// 音声認識の一般的なエラーパターンを検出する
function detectCommonMistakes(text: string): ReviewResult | null {
  const commonMistakes = [
    {
      pattern: /えーと|あのー|んー/g,
      suggestion: '',
      reason: 'フィラー（間投詞）を削除することを推奨します'
    },
    {
      pattern: /([0-9]+)年/g,
      suggestion: (match: string, num: string) => `${num}年`,
      reason: '数字の読み方が正しく認識されていない可能性があります'
    }
  ];

  for (const { pattern, suggestion, reason } of commonMistakes) {
    if (pattern.test(text)) {
      const suggestedText = text.replace(pattern, suggestion);
      return {
        originalText: text,
        suggestedText,
        confidence: 0.9,
        reason
      };
    }
  }

  return null;
}

function findAnomalies(text: string, context: TranscriptionSegment[]): ReviewResult | null {
  // 文脈から不自然な表現を検出
  const contextText = context.map(s => s.text).join(' ');
  
  // 突然の話題の変更を検出
  const topics = extractTopics(contextText);
  const currentTopics = extractTopics(text);
  
  if (!hasCommonElements(topics, currentTopics) && topics.length > 0) {
    return {
      originalText: text,
      suggestedText: text, // 具体的な提案はないが、確認を促す
      confidence: 0.7,
      reason: '前後の文脈と話題が大きく異なっている可能性があります。内容を確認してください。'
    };
  }

  // 文の途中で途切れている可能性を検出
  if (text.length > 3 && !text.match(/[。！？\n]$/)) {
    const nextSegment = context.find(s => s.startTime > context[Math.floor(context.length / 2)].startTime);
    if (nextSegment) {
      return {
        originalText: text,
        suggestedText: `${text}${nextSegment.text}`,
        confidence: 0.6,
        reason: '文が途中で途切れている可能性があります。次のセグメントと結合することを検討してください。'
      };
    }
  }

  return null;
}

// 文章から主要な名詞を抽出する簡易的な実装
function extractTopics(text: string): string[] {
  // 簡易的な実装として、2文字以上の名詞っぽい表現を抽出
  const words = text.match(/[一-龯ぁ-んァ-ヶー]{2,}/g) || [];
  return Array.from(new Set(words));
}

function hasCommonElements(arr1: string[], arr2: string[]): boolean {
  return arr1.some(item => arr2.includes(item));
}

export function reviewTranscription(segments: TranscriptionSegment[]): ReviewResult[] {
  const reviews: ReviewResult[] = [];

  // 文脈からの異常検出
  const contextualAnomalies = detectContextualAnomalies(segments);
  reviews.push(...contextualAnomalies);

  // 各セグメントの個別チェック
  segments.forEach(segment => {
    // 文法チェック
    const grammarIssue = detectGrammaticalIssues(segment.text);
    if (grammarIssue) {
      reviews.push(grammarIssue);
    }

    // 一般的な間違いのチェック
    const commonMistake = detectCommonMistakes(segment.text);
    if (commonMistake) {
      reviews.push(commonMistake);
    }
  });

  // 重複する提案を除去
  return Array.from(new Set(reviews));
} 