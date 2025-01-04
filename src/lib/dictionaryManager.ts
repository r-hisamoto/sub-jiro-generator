export interface DictionaryEntry {
  id: string;
  term: string;
  reading: string;
  correctText: string;
  category: string;
  description?: string;
}

// ローカルストレージのキー
const DICTIONARY_STORAGE_KEY = 'subtitle-dictionary';

// 辞書データの保存
export function saveDictionary(entries: DictionaryEntry[]): void {
  localStorage.setItem(DICTIONARY_STORAGE_KEY, JSON.stringify(entries));
}

// 辞書データの読み込み
export function loadDictionary(): DictionaryEntry[] {
  const data = localStorage.getItem(DICTIONARY_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

// 辞書エントリの追加
export function addDictionaryEntry(entry: Omit<DictionaryEntry, 'id'>): DictionaryEntry {
  const entries = loadDictionary();
  const newEntry = {
    ...entry,
    id: `dict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  };
  entries.push(newEntry);
  saveDictionary(entries);
  return newEntry;
}

// 辞書エントリの削除
export function removeDictionaryEntry(id: string): void {
  const entries = loadDictionary();
  const filteredEntries = entries.filter(entry => entry.id !== id);
  saveDictionary(filteredEntries);
}

// 辞書エントリの更新
export function updateDictionaryEntry(entry: DictionaryEntry): void {
  const entries = loadDictionary();
  const index = entries.findIndex(e => e.id === entry.id);
  if (index !== -1) {
    entries[index] = entry;
    saveDictionary(entries);
  }
}

// テキストに対して辞書を適用
export function applyDictionary(text: string): string {
  const entries = loadDictionary();
  let result = text;

  // 長い用語から順に適用（短い用語が長い用語の一部である場合の誤置換を防ぐ）
  entries
    .sort((a, b) => b.term.length - a.term.length)
    .forEach(entry => {
      // 読み仮名とカタカナ表記の両方に対応
      const pattern = new RegExp(`(${entry.term}|${entry.reading})`, 'g');
      result = result.replace(pattern, entry.correctText);
    });

  return result;
}

// カテゴリ一覧の取得
export function getCategories(): string[] {
  const entries = loadDictionary();
  return Array.from(new Set(entries.map(entry => entry.category)));
}

// カテゴリでフィルタリング
export function getDictionaryByCategory(category: string): DictionaryEntry[] {
  const entries = loadDictionary();
  return entries.filter(entry => entry.category === category);
}

// 辞書エントリの検索
export function searchDictionary(query: string): DictionaryEntry[] {
  const entries = loadDictionary();
  const lowerQuery = query.toLowerCase();
  return entries.filter(entry =>
    entry.term.toLowerCase().includes(lowerQuery) ||
    entry.reading.toLowerCase().includes(lowerQuery) ||
    entry.correctText.toLowerCase().includes(lowerQuery) ||
    (entry.description && entry.description.toLowerCase().includes(lowerQuery))
  );
} 