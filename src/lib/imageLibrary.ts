interface StoredImage {
  id: string;
  url: string;
  fileName: string;
  tags: string[];
  createdAt: string;
  sourceImage?: string;
  prompt?: string;
  negativePrompt?: string;
  folder: string;
  metadata: {
    width: number;
    height: number;
    seed?: number;
    model?: string;
  };
}

interface ImageLibraryState {
  images: StoredImage[];
  folders: string[];
  tags: string[];
}

// ローカルストレージのキー
const LIBRARY_STATE_KEY = 'ai_image_library_state';

// 画像ライブラリの状態を読み込む
export function loadLibraryState(): ImageLibraryState {
  const savedState = localStorage.getItem(LIBRARY_STATE_KEY);
  if (savedState) {
    return JSON.parse(savedState);
  }
  return {
    images: [],
    folders: ['未分類', 'キャラクター', '背景', '小物'],
    tags: []
  };
}

// 画像ライブラリの状態を保存
function saveLibraryState(state: ImageLibraryState) {
  localStorage.setItem(LIBRARY_STATE_KEY, JSON.stringify(state));
}

// 画像をライブラリに追加
export async function addImageToLibrary(
  imageUrl: string,
  options: {
    sourceImage?: string;
    prompt?: string;
    negativePrompt?: string;
    folder?: string;
    tags?: string[];
    seed?: number;
    model?: string;
  }
): Promise<StoredImage> {
  // 画像をBlobとして取得
  const response = await fetch(imageUrl);
  const blob = await response.blob();

  // ファイル名を生成
  const fileName = `ai_image_${Date.now()}.png`;

  // 画像の寸法を取得
  const dimensions = await getImageDimensions(blob);

  // 新しい画像エントリを作成
  const newImage: StoredImage = {
    id: `img_${Date.now()}`,
    url: imageUrl,
    fileName,
    tags: options.tags || [],
    createdAt: new Date().toISOString(),
    sourceImage: options.sourceImage,
    prompt: options.prompt,
    negativePrompt: options.negativePrompt,
    folder: options.folder || '未分類',
    metadata: {
      width: dimensions.width,
      height: dimensions.height,
      seed: options.seed,
      model: options.model
    }
  };

  // 状態を更新
  const state = loadLibraryState();
  state.images.push(newImage);
  
  // 新しいタグを追加
  const newTags = options.tags?.filter(tag => !state.tags.includes(tag)) || [];
  if (newTags.length > 0) {
    state.tags = [...state.tags, ...newTags];
  }

  // フォルダが存在しない場合は追加
  if (options.folder && !state.folders.includes(options.folder)) {
    state.folders.push(options.folder);
  }

  saveLibraryState(state);
  return newImage;
}

// 画像の寸法を取得
async function getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height
      });
    };
    img.src = URL.createObjectURL(blob);
  });
}

// 画像を検索
export function searchImages(options: {
  folder?: string;
  tags?: string[];
  searchText?: string;
  sortBy?: 'date' | 'name';
  sortOrder?: 'asc' | 'desc';
}): StoredImage[] {
  const state = loadLibraryState();
  let results = state.images;

  // フォルダでフィルタリング
  if (options.folder) {
    results = results.filter(img => img.folder === options.folder);
  }

  // タグでフィルタリング
  if (options.tags && options.tags.length > 0) {
    results = results.filter(img => 
      options.tags!.every(tag => img.tags.includes(tag))
    );
  }

  // テキスト検索
  if (options.searchText) {
    const searchLower = options.searchText.toLowerCase();
    results = results.filter(img =>
      img.fileName.toLowerCase().includes(searchLower) ||
      img.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
      img.prompt?.toLowerCase().includes(searchLower)
    );
  }

  // ソート
  if (options.sortBy) {
    results.sort((a, b) => {
      let comparison = 0;
      switch (options.sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'name':
          comparison = a.fileName.localeCompare(b.fileName);
          break;
      }
      return options.sortOrder === 'desc' ? -comparison : comparison;
    });
  }

  return results;
}

// 画像のタグを更新
export function updateImageTags(imageId: string, tags: string[]): StoredImage {
  const state = loadLibraryState();
  const imageIndex = state.images.findIndex(img => img.id === imageId);
  if (imageIndex === -1) {
    throw new Error('画像が見つかりません');
  }

  // 画像のタグを更新
  state.images[imageIndex] = {
    ...state.images[imageIndex],
    tags
  };

  // 新しいタグをライブラリに追加
  const newTags = tags.filter(tag => !state.tags.includes(tag));
  if (newTags.length > 0) {
    state.tags = [...state.tags, ...newTags];
  }

  saveLibraryState(state);
  return state.images[imageIndex];
}

// 画像のフォルダを更新
export function updateImageFolder(imageId: string, folder: string): StoredImage {
  const state = loadLibraryState();
  const imageIndex = state.images.findIndex(img => img.id === imageId);
  if (imageIndex === -1) {
    throw new Error('画像が見つかりません');
  }

  // フォルダが存在しない場合は追加
  if (!state.folders.includes(folder)) {
    state.folders.push(folder);
  }

  // 画像のフォルダを更新
  state.images[imageIndex] = {
    ...state.images[imageIndex],
    folder
  };

  saveLibraryState(state);
  return state.images[imageIndex];
}

// フォルダを追加
export function addFolder(name: string): string[] {
  const state = loadLibraryState();
  if (!state.folders.includes(name)) {
    state.folders.push(name);
    saveLibraryState(state);
  }
  return state.folders;
}

// 利用可能なタグ一覧を取得
export function getAvailableTags(): string[] {
  const state = loadLibraryState();
  return state.tags;
}

// 利用可能なフォルダ一覧を取得
export function getAvailableFolders(): string[] {
  const state = loadLibraryState();
  return state.folders;
} 