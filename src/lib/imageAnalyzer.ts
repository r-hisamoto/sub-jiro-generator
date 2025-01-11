interface ImageAnalysis {
  description: string;
  tags: string[];
  style: string[];
  colors: string[];
}

interface PromptSuggestion {
  prompt: string;
  negativePrompt: string;
  explanation: string;
}

// 画像解析用のモデルID
const LLAVA_MODEL = "yorickvp/llava-13b";

export async function analyzeImage(imageUrl: string): Promise<ImageAnalysis> {
  const REPLICATE_API_KEY = process.env.NEXT_PUBLIC_REPLICATE_API_KEY;
  if (!REPLICATE_API_KEY) {
    throw new Error('Replicate API キーが設定されていません');
  }

  try {
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: "e272157381e2a3bf12df3a8edd1f38d1dbd736bbb7437277c8b34175f8fce358",
        input: {
          image: imageUrl,
          prompt: "画像を詳しく分析してください。キャラクターの特徴、ポーズ、表情、服装、背景、色使い、画風などを日本語で説明してください。",
        }
      })
    });

    if (!response.ok) {
      throw new Error('画像解析リクエストに失敗しました');
    }

    const prediction = await response.json();
    
    let result = prediction;
    while (result.status !== 'succeeded' && result.status !== 'failed') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const statusResponse = await fetch(
        `https://api.replicate.com/v1/predictions/${prediction.id}`,
        {
          headers: {
            'Authorization': `Token ${REPLICATE_API_KEY}`,
          }
        }
      );
      result = await statusResponse.json();
    }

    if (result.status === 'failed') {
      throw new Error('画像解析に失敗しました');
    }

    // 解析結果をパースして構造化
    const analysis = parseAnalysisResult(result.output);
    return analysis;
  } catch (error) {
    console.error('画像解析エラー:', error);
    throw error;
  }
}

export async function generatePromptSuggestions(analysis: ImageAnalysis): Promise<PromptSuggestion[]> {
  const REPLICATE_API_KEY = process.env.NEXT_PUBLIC_REPLICATE_API_KEY;
  if (!REPLICATE_API_KEY) {
    throw new Error('Replicate API キーが設定されていません');
  }

  try {
    const prompt = `
以下の画像解析結果をもとに、キャラクターの一貫性を保ちながら異なるポーズやシチュエーションを生成するための最適なプロンプトを3つ提案してください。
各提案には以下を含めてください：
- プロンプト（英語）
- ネガティブプロンプト（英語）
- 提案の説明（日本語）

解析結果：
${analysis.description}
特徴：${analysis.tags.join(', ')}
スタイル：${analysis.style.join(', ')}
色使い：${analysis.colors.join(', ')}
`;

    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: "2facb4a474a0462c15041b78b1ad70952ea46b5ec6ad29583c0b29dbd4249591",
        input: {
          prompt: prompt,
          max_tokens: 1000,
        }
      })
    });

    if (!response.ok) {
      throw new Error('プロンプト生成リクエストに失敗しました');
    }

    const prediction = await response.json();
    
    let result = prediction;
    while (result.status !== 'succeeded' && result.status !== 'failed') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const statusResponse = await fetch(
        `https://api.replicate.com/v1/predictions/${prediction.id}`,
        {
          headers: {
            'Authorization': `Token ${REPLICATE_API_KEY}`,
          }
        }
      );
      result = await statusResponse.json();
    }

    if (result.status === 'failed') {
      throw new Error('プロンプト生成に失敗しました');
    }

    return parsePromptSuggestions(result.output);
  } catch (error) {
    console.error('プロンプト生成エラー:', error);
    throw error;
  }
}

function parseAnalysisResult(text: string): ImageAnalysis {
  // 解析結果のテキストから情報を抽出
  const tags = extractTags(text);
  const style = extractStyle(text);
  const colors = extractColors(text);

  return {
    description: text,
    tags,
    style,
    colors
  };
}

function parsePromptSuggestions(text: string): PromptSuggestion[] {
  // プロンプト生成結果をパースして構造化
  const suggestions = text.split('\n\n').filter(Boolean).map(suggestion => {
    const lines = suggestion.split('\n');
    return {
      prompt: lines.find(l => l.toLowerCase().includes('prompt:'))?.split(':')[1]?.trim() || '',
      negativePrompt: lines.find(l => l.toLowerCase().includes('negative'))?.split(':')[1]?.trim() || '',
      explanation: lines.find(l => l.includes('説明:'))?.split(':')[1]?.trim() || ''
    };
  });

  return suggestions;
}

// 解析結果から特徴的なタグを抽出
function extractTags(text: string): string[] {
  const commonTags = [
    'キャラクター', 'ポーズ', '表情', '髪型', '服装',
    '背景', 'アクセサリー', '雰囲気'
  ];
  
  return commonTags.filter(tag => text.includes(tag));
}

// 画風やスタイルに関する情報を抽出
function extractStyle(text: string): string[] {
  const styleKeywords = [
    'アニメ調', 'リアル', '漫画調', 'イラスト',
    'デフォルメ', '写実的', '水彩', 'デジタル'
  ];
  
  return styleKeywords.filter(style => text.includes(style));
}

// 色使いに関する情報を抽出
function extractColors(text: string): string[] {
  const colorKeywords = [
    '赤', '青', '緑', '黄色', '紫', 'ピンク',
    '白', '黒', '暖色', '寒色', 'パステル'
  ];
  
  return colorKeywords.filter(color => text.includes(color));
} 