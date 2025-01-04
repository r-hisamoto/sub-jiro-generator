interface GenerateImageOptions {
  numImages: number;
  prompt?: string;
  negativePrompt?: string;
  seed?: number;
  onProgress?: (progress: { current: number; total: number }) => void;
}

interface GeneratedImage {
  id: string;
  url: string;
  seed: number;
}

const MAX_IMAGES_PER_REQUEST = 20;

async function generateImagesBatch(
  seedImageUrl: string,
  options: GenerateImageOptions,
  batchSize: number,
  startIndex: number
): Promise<GeneratedImage[]> {
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
        version: "436dd19c0a3e2283b86d12c0c0dae28c0edec7974f18815b5c9990a3d1ee7d1e",
        input: {
          image: seedImageUrl,
          prompt: options.prompt || "same character, different pose",
          negative_prompt: options.negativePrompt || "bad quality, blurry",
          num_outputs: batchSize,
          seed: (options.seed || Math.floor(Math.random() * 1000000)) + startIndex
        }
      })
    });

    if (!response.ok) {
      throw new Error('画像生成リクエストに失敗しました');
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
      throw new Error('画像生成に失敗しました');
    }

    return result.output.map((url: string, index: number) => ({
      id: `generated-${Date.now()}-${startIndex + index}`,
      url,
      seed: (options.seed || 0) + startIndex + index
    }));
  } catch (error) {
    console.error('AI画像生成エラー:', error);
    throw error;
  }
}

export async function generateImagesFromSeed(
  seedImageUrl: string,
  options: GenerateImageOptions
): Promise<GeneratedImage[]> {
  const totalImages = options.numImages;
  const batches: Promise<GeneratedImage[]>[] = [];
  let processedImages = 0;

  while (processedImages < totalImages) {
    const remainingImages = totalImages - processedImages;
    const batchSize = Math.min(remainingImages, MAX_IMAGES_PER_REQUEST);
    
    batches.push(
      generateImagesBatch(seedImageUrl, options, batchSize, processedImages)
        .then(images => {
          processedImages += images.length;
          options.onProgress?.({ current: processedImages, total: totalImages });
          return images;
        })
    );

    processedImages += batchSize;
  }

  const results = await Promise.all(batches);
  return results.flat();
} 