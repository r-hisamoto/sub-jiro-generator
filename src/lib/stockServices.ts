export interface StockVideo {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  duration: number;
  width: number;
  height: number;
  source: 'pexels' | 'pixabay';
  author: string;
  authorUrl: string;
}

interface PexelsVideo {
  id: number;
  width: number;
  height: number;
  duration: number;
  video_files: {
    id: number;
    quality: string;
    file_type: string;
    width: number;
    height: number;
    link: string;
  }[];
  url: string;
  image: string;
  user: {
    name: string;
    url: string;
  };
}

interface PixabayVideo {
  id: number;
  pageURL: string;
  type: string;
  tags: string;
  duration: number;
  width: number;
  height: number;
  videos: {
    large: { url: string; width: number; height: number; };
    medium: { url: string; width: number; height: number; };
    small: { url: string; width: number; height: number; };
  };
  userImageURL: string;
  user: string;
  user_id: number;
}

export async function searchPexelsVideos(query: string, page: number = 1): Promise<StockVideo[]> {
  const PEXELS_API_KEY = process.env.NEXT_PUBLIC_PEXELS_API_KEY;
  if (!PEXELS_API_KEY) {
    throw new Error('Pexels API キーが設定されていません');
  }

  const response = await fetch(
    `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&page=${page}&per_page=20`,
    {
      headers: {
        Authorization: PEXELS_API_KEY
      }
    }
  );

  if (!response.ok) {
    throw new Error('Pexels APIの呼び出しに失敗しました');
  }

  const data = await response.json();
  return data.videos.map((video: PexelsVideo) => {
    const bestQualityVideo = video.video_files
      .sort((a, b) => (b.width * b.height) - (a.width * a.height))[0];

    return {
      id: `pexels-${video.id}`,
      title: `Pexels Video ${video.id}`,
      url: bestQualityVideo.link,
      thumbnailUrl: video.image,
      duration: video.duration,
      width: video.width,
      height: video.height,
      source: 'pexels' as const,
      author: video.user.name,
      authorUrl: video.user.url
    };
  });
}

export async function searchPixabayVideos(query: string, page: number = 1): Promise<StockVideo[]> {
  const PIXABAY_API_KEY = process.env.NEXT_PUBLIC_PIXABAY_API_KEY;
  if (!PIXABAY_API_KEY) {
    throw new Error('Pixabay API キーが設定されていません');
  }

  const response = await fetch(
    `https://pixabay.com/api/videos/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&page=${page}&per_page=20`
  );

  if (!response.ok) {
    throw new Error('Pixabay APIの呼び出しに失敗しました');
  }

  const data = await response.json();
  return data.hits.map((video: PixabayVideo) => ({
    id: `pixabay-${video.id}`,
    title: video.tags.split(',')[0],
    url: video.videos.large.url,
    thumbnailUrl: video.userImageURL,
    duration: video.duration,
    width: video.videos.large.width,
    height: video.videos.large.height,
    source: 'pixabay' as const,
    author: video.user,
    authorUrl: `https://pixabay.com/users/${video.user}-${video.user_id}/`
  }));
}

export async function searchStockVideos(query: string, page: number = 1): Promise<StockVideo[]> {
  try {
    const [pexelsVideos, pixabayVideos] = await Promise.all([
      searchPexelsVideos(query, page),
      searchPixabayVideos(query, page)
    ]);

    return [...pexelsVideos, ...pixabayVideos];
  } catch (error) {
    console.error('フリー素材の検索に失敗しました:', error);
    return [];
  }
} 