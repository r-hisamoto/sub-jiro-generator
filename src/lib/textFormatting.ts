import { Subtitle, Word } from '@/types/subtitle';
import type { Tokenizer, TokenizerBuilder, IpadicFeatures } from 'kuromoji';

/**
 * 句読点の自動補完のためのオプション
 */
export interface PunctuationOptions {
  // 文の最大長さ（これを超えると句点を挿入）
  maxSentenceLength?: number;
  // 読点を入れる際の最小間隔（文字数）
  minCommaInterval?: number;
  // 句点の後のスペースを自動で調整するか
  adjustSpacing?: boolean;
  // ポーズに基づく句読点挿入の閾値（秒）
  pauseThreshold?: {
    period: number;   // 句点を入れるポーズの長さ
    comma: number;    // 読点を入れるポーズの長さ
  };
}

const DEFAULT_OPTIONS: PunctuationOptions = {
  maxSentenceLength: 30,
  minCommaInterval: 10,
  adjustSpacing: true,
  pauseThreshold: {
    period: 0.8,  // 0.8秒以上のポーズで句点
    comma: 0.3    // 0.3秒以上のポーズで読点
  }
};

/**
 * 漢字/ひらがな変換のためのオプション
 */
export interface KanaConversionOptions {
  // 漢字をひらがなに変換する単語の最大長さ
  maxKanjiLength?: number;
  // 数字を漢数字に変換するか
  convertNumbers?: boolean;
  // 人名・固有名詞を変換対象から除外するか
  preserveProperNouns?: boolean;
  // 特定の品詞のみを変換対象とするか
  targetPartsOfSpeech?: string[];
}

const DEFAULT_KANA_OPTIONS: KanaConversionOptions = {
  maxKanjiLength: 3,
  convertNumbers: false,
  preserveProperNouns: true,
  targetPartsOfSpeech: ['名詞', '動詞', '形容詞']
};

/**
 * 敬体/常体の変換のためのオプション
 */
export interface HonorificOptions {
  // 変換後の文体（'polite' = 敬体, 'plain' = 常体）
  targetStyle: 'polite' | 'plain';
  // 特定の表現を変換対象から除外するか
  preserveExpressions?: string[];
  // 引用文を変換対象から除外するか
  preserveQuotations?: boolean;
}

const DEFAULT_HONORIFIC_OPTIONS: HonorificOptions = {
  targetStyle: 'polite',
  preserveExpressions: [],
  preserveQuotations: true
};

/**
 * 文末表現の変換マッピング
 */
const HONORIFIC_MAPPINGS = {
  // 常体 -> 敬体
  plain: {
    'だ': 'です',
    'である': 'です',
    'だった': 'でした',
    'であった': 'でした',
    'している': 'しています',
    'してる': 'しています',
    'してない': 'していません',
    'しない': 'しません',
    'した': 'しました',
    'する': 'します',
    'できる': 'できます',
    'できた': 'できました',
    'わかる': 'わかります',
    'わかった': 'わかりました',
    'ない': 'ありません',
    'なかった': 'ありませんでした'
  },
  // 敬体 -> 常体
  polite: {
    'です': 'だ',
    'でした': 'だった',
    'しています': 'している',
    'していません': 'してない',
    'しません': 'しない',
    'しました': 'した',
    'します': 'する',
    'できます': 'できる',
    'できました': 'できた',
    'わかります': 'わかる',
    'わかりました': 'わかった',
    'ありません': 'ない',
    'ありませんでした': 'なかった'
  }
};

/**
 * 文末表現を検出する
 */
const detectSentenceStyle = (text: string): 'polite' | 'plain' | 'unknown' => {
  const politePatterns = /です|ます|でしょうか|ください/;
  const plainPatterns = /だ|である|だった|である|した$|する$|できる$|わかる$/;
  
  if (politePatterns.test(text)) return 'polite';
  if (plainPatterns.test(text)) return 'plain';
  return 'unknown';
};

/**
 * 引用文を検出する
 */
const detectQuotation = (text: string): { start: number; end: number; }[] => {
  const quotations: { start: number; end: number; }[] = [];
  const stack: number[] = [];
  
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '「' || text[i] === '『') {
      stack.push(i);
    } else if ((text[i] === '」' || text[i] === '』') && stack.length > 0) {
      const start = stack.pop()!;
      quotations.push({ start, end: i });
    }
  }
  
  return quotations;
};

/**
 * 文末表現を変換する
 */
export const convertHonorificStyle = (
  text: string,
  options: HonorificOptions = DEFAULT_HONORIFIC_OPTIONS
): string => {
  const mergedOptions = { ...DEFAULT_HONORIFIC_OPTIONS, ...options };
  const { targetStyle, preserveExpressions, preserveQuotations } = mergedOptions;
  
  // 引用文の位置を検出
  const quotations = preserveQuotations ? detectQuotation(text) : [];
  
  // 文を分割
  const sentences = text.split(/([。．.！!？?])/);
  let result = '';
  let currentPos = 0;
  
  for (let i = 0; i < sentences.length; i += 2) {
    const sentence = sentences[i] + (sentences[i + 1] || '');
    if (!sentence) continue;
    
    // 引用文内かどうかをチェック
    const inQuotation = quotations.some(q => 
      currentPos >= q.start && currentPos <= q.end
    );
    
    if (!inQuotation) {
      let converted = sentence;
      const currentStyle = detectSentenceStyle(sentence);
      
      if (currentStyle !== 'unknown' && currentStyle !== targetStyle) {
        const mappings = targetStyle === 'polite' ? 
          HONORIFIC_MAPPINGS.plain : 
          HONORIFIC_MAPPINGS.polite;
        
        // 除外表現をチェック
        const shouldPreserve = preserveExpressions?.some(expr => 
          sentence.includes(expr)
        );
        
        if (!shouldPreserve) {
          // 文末表現を変換
          for (const [from, to] of Object.entries(mappings)) {
            const pattern = new RegExp(`${from}([。．.！!？?]|$)`, 'g');
            converted = converted.replace(pattern, `${to}$1`);
          }
        }
      }
      
      result += converted;
    } else {
      result += sentence;
    }
    
    currentPos += sentence.length;
  }
  
  return result;
};

/**
 * 字幕テキストの敬体/常体を変換
 */
export const convertSubtitleHonorific = (
  subtitle: Subtitle,
  options?: HonorificOptions
): Subtitle => {
  const convertedText = convertHonorificStyle(subtitle.text, options);
  return { ...subtitle, text: convertedText };
};

/**
 * 複数の字幕テキストの敬体/常体を変換
 */
export const convertSubtitlesHonorific = (
  subtitles: Subtitle[],
  options?: HonorificOptions
): Subtitle[] => {
  return subtitles.map(subtitle => convertSubtitleHonorific(subtitle, options));
};

/**
 * 字幕テキストに句読点を自動補完する
 */
export const autoCompletePunctuation = (
  text: string,
  options: PunctuationOptions = {}
): string => {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const {
    maxSentenceLength,
    minCommaInterval,
    adjustSpacing
  } = mergedOptions;

  // 基本的な句読点の補完
  let formatted = text
    // 文末が句点で終わっていない場合は追加
    .replace(/([^。．.！!？?」】］\s])\s*$/g, '$1。')
    // 長い文を句点で区切る
    .replace(new RegExp(`([^。．.！!？?」】］\\s]{${maxSentenceLength},})([^、。．.！!？?」】］\\s])`, 'g'), '$1。$2')
    // 読点の間隔を調整
    .replace(new RegExp(`([^、。．.！!？?」】］\\s]{${minCommaInterval},})([^、。．.！!？?」】］\\s])`, 'g'), '$1、$2');

  // 文法規則に基づく補完
  formatted = completePunctuationWithGrammar(formatted);

  // スペースの調整
  if (adjustSpacing) {
    formatted = formatted
      // 句読点の後のスペースを削除
      .replace(/([。、．.！!？?」】］])\s+/g, '$1')
      // 句点の後に改行を入れる
      .replace(/([。．.！!？?])/g, '$1\n');
  }

  return formatted;
};

/**
 * 字幕オブジェクトの配列に対して句読点の自動補完を適用
 */
export const autoCompletePunctuationForSubtitles = (
  subtitles: Subtitle[],
  options?: PunctuationOptions
): Subtitle[] => {
  return subtitles.map((subtitle, index) => {
    let text = subtitle.text;

    // ポーズ情報がある場合は活用
    if (subtitle.pauseAfter !== undefined) {
      text = completePunctuationWithPause(text, subtitle.pauseAfter, options?.pauseThreshold);
    }

    // 単語レベルのタイミング情報がある場合は活用
    if (subtitle.words) {
      text = completePunctuationWithWordTiming(text, subtitle.words);
    }

    // 基本的な句読点補完を適用
    text = autoCompletePunctuation(text, options);

    return { ...subtitle, text };
  });
};

/**
 * 音声の区切り（ポーズ）情報に基づいて句読点を補完
 */
export const completePunctuationWithPause = (
  text: string,
  pauseDuration: number,
  thresholds = DEFAULT_OPTIONS.pauseThreshold!
): string => {
  if (pauseDuration >= thresholds.period) {
    // 長いポーズの場合は句点を追加
    return text.replace(/([^。．.！!？?」】］\s])$/, '$1。');
  } else if (pauseDuration >= thresholds.comma) {
    // 短いポーズの場合は読点を追加
    return text.replace(/([^、。．.！!？?」】］\s])$/, '$1、');
  }
  return text;
};

/**
 * 単語レベルのタイミング情報を使用して句読点を補完
 */
export const completePunctuationWithWordTiming = (
  text: string,
  words: Word[]
): string => {
  let result = text;
  const thresholds = DEFAULT_OPTIONS.pauseThreshold!;
  
  // 単語間の間隔を分析
  for (let i = 0; i < words.length - 1; i++) {
    const gap = words[i + 1].startTime - words[i].endTime;
    const pos = words[i].text.length;
    
    if (gap >= thresholds.period) {
      // 長いギャップがある場合は句点を追加
      result = result.slice(0, pos) + '。' + result.slice(pos);
    } else if (gap >= thresholds.comma) {
      // 短いギャップがある場合は読点を追加
      result = result.slice(0, pos) + '、' + result.slice(pos);
    }
  }
  
  return result;
};

/**
 * 文法規則に基づいて句読点を補完
 */
export const completePunctuationWithGrammar = (text: string): string => {
  return text
    // 接続詞の後に読点を追加
    .replace(/(しかし|けれども|ところが|したがって|そのため|なお|また|および|あるいは|または|もしくは)([^、。．.！!？?」】］\s])/g, '$1、$2')
    // 引用の後に読点を追加
    .replace(/([」】］])([^、。．.！!？?」】］\s])/g, '$1、$2')
    // 従属節の後に読点を追加
    .replace(/(ので|から|けど|が|のに)([^、。．.！!？?」】］\s])/g, '$1、$2')
    // 助詞の後の読点
    .replace(/(では|には|からは|までは)([^、。．.！!？?」】］\s])/g, '$1、$2')
    // 接続助詞の後の読点
    .replace(/(ながら|つつ|ものの|一方|他方)([^、。．.！!？?」】］\s])/g, '$1、$2');
};

/**
 * 漢字をひらがなに変換する
 */
export const convertKanjiToHiragana = async (
  text: string,
  options: KanaConversionOptions = {}
): Promise<string> => {
  const mergedOptions = { ...DEFAULT_KANA_OPTIONS, ...options };
  
  try {
    // kuromoji.jsを使用して形態素解析を行う
    const tokenizer = await getTokenizer();
    const tokens = tokenizer.tokenize(text);
    
    let result = '';
    let lastPos = 0;
    
    for (const token of tokens) {
      const {
        surface_form: surface,
        reading,
        pos,
        pos_detail_1: posDetail
      } = token;
      
      // 変換対象かどうかを判定
      const shouldConvert = (
        // 指定された品詞に含まれているか
        mergedOptions.targetPartsOfSpeech?.includes(pos) &&
        // 漢字を含んでいるか
        /[\u4E00-\u9FFF]/.test(surface) &&
        // 最大長を超えていないか
        surface.length <= (mergedOptions.maxKanjiLength ?? DEFAULT_KANA_OPTIONS.maxKanjiLength!) &&
        // 固有名詞を除外するか
        !(mergedOptions.preserveProperNouns && posDetail === '固有名詞')
      );
      
      if (shouldConvert && reading) {
        // カタカナをひらがなに変換
        const hiragana = reading.replace(/[\u30A1-\u30F6]/g, (match: string) => {
          return String.fromCharCode(match.charCodeAt(0) - 0x60);
        });
        result += hiragana;
      } else {
        result += surface;
      }
      
      lastPos += surface.length;
    }
    
    return result;
    
  } catch (error) {
    console.error('Error in convertKanjiToHiragana:', error);
    return text;
  }
};

/**
 * 字幕テキストの漢字をひらがなに変換
 */
export const convertSubtitleKanji = async (
  subtitle: Subtitle,
  options?: KanaConversionOptions
): Promise<Subtitle> => {
  const convertedText = await convertKanjiToHiragana(subtitle.text, options);
  return { ...subtitle, text: convertedText };
};

/**
 * 複数の字幕テキストの漢字をひらがなに変換
 */
export const convertSubtitlesKanji = async (
  subtitles: Subtitle[],
  options?: KanaConversionOptions
): Promise<Subtitle[]> => {
  const convertedSubtitles = await Promise.all(
    subtitles.map(subtitle => convertSubtitleKanji(subtitle, options))
  );
  return convertedSubtitles;
};

// Kuromojiのトークナイザーをシングルトンとして保持
let tokenizer: Tokenizer<IpadicFeatures> | null = null;

export const getTokenizer = async (): Promise<Tokenizer<IpadicFeatures>> => {
  if (tokenizer) return tokenizer;
  
  const kuromoji = await import('kuromoji');
  return new Promise((resolve, reject) => {
    (kuromoji as unknown as { 
      builder: (options: { dicPath: string }) => TokenizerBuilder<IpadicFeatures> 
    }).builder({ dicPath: '/dict' })
      .build((err: Error | null, _tokenizer: Tokenizer<IpadicFeatures>) => {
        if (err) {
          reject(err);
        } else {
          tokenizer = _tokenizer;
          resolve(tokenizer);
        }
      });
  });
};

/**
 * 敬語レベルの定義
 */
export type HonorificLevel = 'humble' | 'polite' | 'respectful' | 'casual';

/**
 * 敬語・口語変換のためのオプション
 */
export interface SpeechStyleOptions {
  // 変換後の敬語レベル
  targetLevel: HonorificLevel;
  // フォーマル度（0-1の範囲、1が最もフォーマル）
  formalityLevel: number;
  // 特定の表現を変換対象から除外するか
  preserveExpressions?: string[];
  // 引用文を変換対象から除外するか
  preserveQuotations?: boolean;
}

const DEFAULT_SPEECH_STYLE_OPTIONS: SpeechStyleOptions = {
  targetLevel: 'polite',
  formalityLevel: 0.7,
  preserveExpressions: [],
  preserveQuotations: true
};

/**
 * 敬語表現の変換マッピング
 */
const SPEECH_STYLE_MAPPINGS = {
  // 謙譲語
  humble: {
    'する': 'いたす',
    'やる': 'いたす',
    '行く': 'まいる',
    '来る': 'まいる',
    '言う': '申し上げる',
    '話す': '申し上げる',
    '聞く': '承る',
    '食べる': 'いただく',
    '飲む': 'いただく',
    '見る': '拝見する',
    '会う': 'お目にかかる',
    '知る': '存じる',
    '思う': '存じる',
    'わかる': '存じる'
  },
  // 丁寧語
  polite: {
    'する': 'します',
    'やる': 'やります',
    '行く': '行きます',
    '来る': '来ます',
    '言う': '言います',
    '話す': '話します',
    '聞く': '聞きます',
    '食べる': '食べます',
    '飲む': '飲みます',
    '見る': '見ます',
    '会う': '会います',
    '知る': '知ります',
    '思う': '思います',
    'わかる': 'わかります'
  },
  // 尊敬語
  respectful: {
    'する': 'なさる',
    'やる': 'なさる',
    '行く': 'いらっしゃる',
    '来る': 'いらっしゃる',
    '言う': 'おっしゃる',
    '話す': 'おっしゃる',
    '聞く': 'お聞きになる',
    '食べる': 'お召し上がりになる',
    '飲む': 'お召し上がりになる',
    '見る': 'ご覧になる',
    '会う': 'お会いになる',
    '知る': 'ご存知です',
    '思う': 'お考えになる',
    'わかる': 'おわかりになる'
  },
  // 口語
  casual: {
    'します': 'する',
    'やります': 'やる',
    '行きます': '行く',
    '来ます': '来る',
    '言います': '言う',
    '話します': '話す',
    '聞きます': '聞く',
    '食べます': '食べる',
    '飲みます': '飲む',
    '見ます': '見る',
    '会います': '会う',
    '知ります': '知る',
    '思います': '思う',
    'わかります': 'わかる'
  }
};

/**
 * フォーマル度に応じた接続表現のマッピング
 */
const FORMALITY_MAPPINGS = {
  high: {
    'けど': 'けれども',
    'だけど': 'ですけれども',
    'でも': 'けれども',
    'から': 'ですから',
    'なので': 'ですので',
    'じゃ': 'では',
    'じゃあ': 'それでは'
  },
  low: {
    'けれども': 'けど',
    'ですけれども': 'だけど',
    'ですから': 'から',
    'ですので': 'なので',
    'では': 'じゃ',
    'それでは': 'じゃあ'
  }
};

/**
 * 敬語レベルを判定する
 */
const detectHonorificLevel = (text: string): HonorificLevel => {
  // 謙譲語のパターン
  const humblePatterns = /いたし|まいり|申し上げ|承り|いただ|拝見|存じ/;
  // 尊敬語のパターン
  const respectfulPatterns = /なさい|いらっしゃい|おっしゃ|お[読聞食]みにな|ご覧にな|お考えにな/;
  // 丁寧語のパターン
  const politePatterns = /です|ます|ございます/;
  
  if (humblePatterns.test(text)) return 'humble';
  if (respectfulPatterns.test(text)) return 'respectful';
  if (politePatterns.test(text)) return 'polite';
  return 'casual';
};

/**
 * 敬語・口語を変換する
 */
export const convertSpeechStyle = (
  text: string,
  options: SpeechStyleOptions = DEFAULT_SPEECH_STYLE_OPTIONS
): string => {
  const mergedOptions = { ...DEFAULT_SPEECH_STYLE_OPTIONS, ...options };
  const { targetLevel, formalityLevel, preserveExpressions, preserveQuotations } = mergedOptions;
  
  // 引用文の位置を検出
  const quotations = preserveQuotations ? detectQuotation(text) : [];
  
  // 文を分割
  const sentences = text.split(/([。．.！!？?])/);
  let result = '';
  let currentPos = 0;
  
  for (let i = 0; i < sentences.length; i += 2) {
    const sentence = sentences[i] + (sentences[i + 1] || '');
    if (!sentence) continue;
    
    // 引用文内かどうかをチェック
    const inQuotation = quotations.some(q => 
      currentPos >= q.start && currentPos <= q.end
    );
    
    if (!inQuotation) {
      let converted = sentence;
      const currentLevel = detectHonorificLevel(sentence);
      
      if (currentLevel !== targetLevel) {
        const mappings = SPEECH_STYLE_MAPPINGS[targetLevel];
        
        // 除外表現をチェック
        const shouldPreserve = preserveExpressions?.some(expr => 
          sentence.includes(expr)
        );
        
        if (!shouldPreserve) {
          // 敬語表現を変換
          for (const [from, to] of Object.entries(mappings)) {
            const pattern = new RegExp(from, 'g');
            converted = converted.replace(pattern, to);
          }
          
          // フォーマル度に応じて接続表現を変換
          const formalityMappings = formalityLevel >= 0.5 ? 
            FORMALITY_MAPPINGS.high : 
            FORMALITY_MAPPINGS.low;
          
          for (const [from, to] of Object.entries(formalityMappings)) {
            const pattern = new RegExp(from, 'g');
            converted = converted.replace(pattern, to);
          }
        }
      }
      
      result += converted;
    } else {
      result += sentence;
    }
    
    currentPos += sentence.length;
  }
  
  return result;
};

/**
 * 字幕テキストの敬語・口語を変換
 */
export const convertSubtitleSpeechStyle = (
  subtitle: Subtitle,
  options?: SpeechStyleOptions
): Subtitle => {
  const convertedText = convertSpeechStyle(subtitle.text, options);
  return { ...subtitle, text: convertedText };
};

/**
 * 複数の字幕テキストの敬語・口語を変換
 */
export const convertSubtitlesSpeechStyle = (
  subtitles: Subtitle[],
  options?: SpeechStyleOptions
): Subtitle[] => {
  return subtitles.map(subtitle => convertSubtitleSpeechStyle(subtitle, options));
};

/**
 * 誤変換の可能性がある箇所の情報
 */
export interface MisconversionInfo {
  start: number;
  end: number;
  text: string;
  suggestion?: string;
  type: 'kana' | 'kanji' | 'other';
  confidence: number;
}

/**
 * 誤変換検出のオプション
 */
export interface MisconversionDetectionOptions {
  checkKana?: boolean;
  checkKanji?: boolean;
  minConfidence?: number;
  useCustomDictionary?: boolean;
}

/**
 * テキスト内の誤変換の可能性がある箇所を検出
 */
export const detectMisconversions = async (
  text: string,
  options: MisconversionDetectionOptions = {}
): Promise<MisconversionInfo[]> => {
  const {
    checkKana = true,
    checkKanji = true,
    minConfidence = 0.7,
    useCustomDictionary = true
  } = options;

  const misconversions: MisconversionInfo[] = [];
  const tokenizer = await getTokenizer();

  // 形態素解析を実行
  const tokens = tokenizer.tokenize(text);

  // カスタム辞書の読み込み
  const customDictionary = useCustomDictionary ? await loadDictionary() : new Map();

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const start = token.word_position;
    const end = start + token.surface_form.length;

    // カスタム辞書にある場合はスキップ
    if (customDictionary.has(token.surface_form)) {
      continue;
    }

    // かなチェック
    if (checkKana && token.reading && token.surface_form !== token.reading) {
      const confidence = calculateKanaConfidence(token);
      if (confidence >= minConfidence) {
        misconversions.push({
          start,
          end,
          text: token.surface_form,
          suggestion: token.reading,
          type: 'kana',
          confidence
        });
      }
    }

    // 漢字チェック
    if (checkKanji && /[\u4E00-\u9FFF]/.test(token.surface_form)) {
      const confidence = calculateKanjiConfidence(token);
      if (confidence >= minConfidence) {
        misconversions.push({
          start,
          end,
          text: token.surface_form,
          type: 'kanji',
          confidence
        });
      }
    }
  }

  return misconversions;
};

/**
 * かな変換の信頼度を計算
 */
const calculateKanaConfidence = (token: any): number => {
  // 品詞や文脈に基づいて信頼度を計算
  let confidence = 0.5;

  // 固有名詞は信頼度を下げる
  if (token.pos === '固有名詞') {
    confidence -= 0.3;
  }

  // 一般的な名詞は信頼度を上げる
  if (token.pos === '名詞' && token.pos_detail_1 === '一般') {
    confidence += 0.2;
  }

  return Math.max(0, Math.min(1, confidence));
};

/**
 * 漢字変換の信頼度を計算
 */
const calculateKanjiConfidence = (token: any): number => {
  // 品詞や文脈に基づいて信頼度を計算
  let confidence = 0.5;

  // 固有名詞は信頼度を下げる
  if (token.pos === '固有名詞') {
    confidence -= 0.3;
  }

  // 一般的な名詞は信頼度を上げる
  if (token.pos === '名詞' && token.pos_detail_1 === '一般') {
    confidence += 0.2;
  }

  return Math.max(0, Math.min(1, confidence));
}; 