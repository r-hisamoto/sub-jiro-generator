import { useState, useEffect } from 'react';
import {
  DictionaryEntry,
  loadDictionary,
  addDictionaryEntry,
  removeDictionaryEntry,
  updateDictionaryEntry,
  getCategories
} from '@/lib/dictionaryManager';

interface DictionaryManagerProps {
  onClose: () => void;
  onDictionaryUpdate: () => void;
}

export function DictionaryManager({ onClose, onDictionaryUpdate }: DictionaryManagerProps) {
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [newEntry, setNewEntry] = useState<Omit<DictionaryEntry, 'id'>>({
    term: '',
    reading: '',
    correctText: '',
    category: '',
    description: ''
  });
  const [editingEntry, setEditingEntry] = useState<DictionaryEntry | null>(null);

  useEffect(() => {
    loadDictionaryData();
  }, []);

  const loadDictionaryData = () => {
    const loadedEntries = loadDictionary();
    setEntries(loadedEntries);
    setCategories(getCategories());
  };

  const handleAddEntry = () => {
    if (newEntry.term && newEntry.correctText && newEntry.category) {
      addDictionaryEntry(newEntry);
      setNewEntry({
        term: '',
        reading: '',
        correctText: '',
        category: newEntry.category, // カテゴリは維持
        description: ''
      });
      loadDictionaryData();
      onDictionaryUpdate();
    }
  };

  const handleUpdateEntry = () => {
    if (editingEntry) {
      updateDictionaryEntry(editingEntry);
      setEditingEntry(null);
      loadDictionaryData();
      onDictionaryUpdate();
    }
  };

  const handleDeleteEntry = (id: string) => {
    if (window.confirm('この辞書エントリを削除してもよろしいですか？')) {
      removeDictionaryEntry(id);
      loadDictionaryData();
      onDictionaryUpdate();
    }
  };

  const filteredEntries = entries.filter(entry => {
    const matchesCategory = !selectedCategory || entry.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      entry.term.includes(searchQuery) ||
      entry.reading.includes(searchQuery) ||
      entry.correctText.includes(searchQuery) ||
      (entry.description && entry.description.includes(searchQuery));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">辞書管理</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* 新規エントリ追加フォーム */}
        <div className="mb-6 p-4 bg-gray-50 rounded">
          <h3 className="text-lg font-semibold mb-4">新規エントリの追加</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">用語</label>
              <input
                type="text"
                value={newEntry.term}
                onChange={e => setNewEntry(prev => ({ ...prev, term: e.target.value }))}
                className="w-full p-2 border rounded"
                placeholder="認識される可能性のある表記"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">読み方</label>
              <input
                type="text"
                value={newEntry.reading}
                onChange={e => setNewEntry(prev => ({ ...prev, reading: e.target.value }))}
                className="w-full p-2 border rounded"
                placeholder="カタカナ表記"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">正しい表記</label>
              <input
                type="text"
                value={newEntry.correctText}
                onChange={e => setNewEntry(prev => ({ ...prev, correctText: e.target.value }))}
                className="w-full p-2 border rounded"
                placeholder="置換後の表記"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">カテゴリ</label>
              <input
                type="text"
                value={newEntry.category}
                onChange={e => setNewEntry(prev => ({ ...prev, category: e.target.value }))}
                className="w-full p-2 border rounded"
                placeholder="人名、専門用語など"
                list="categories"
              />
              <datalist id="categories">
                {categories.map(category => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">説明（オプション）</label>
              <input
                type="text"
                value={newEntry.description || ''}
                onChange={e => setNewEntry(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-2 border rounded"
                placeholder="補足説明"
              />
            </div>
          </div>
          <button
            onClick={handleAddEntry}
            disabled={!newEntry.term || !newEntry.correctText || !newEntry.category}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
          >
            追加
          </button>
        </div>

        {/* 検索・フィルタリング */}
        <div className="mb-4 flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="検索..."
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="w-48">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">すべてのカテゴリ</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        {/* エントリ一覧 */}
        <div className="border rounded">
          {filteredEntries.map(entry => (
            <div key={entry.id} className="p-4 border-b last:border-b-0">
              {editingEntry?.id === entry.id ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">用語</label>
                    <input
                      type="text"
                      value={editingEntry.term}
                      onChange={e => setEditingEntry(prev => prev ? { ...prev, term: e.target.value } : null)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">読み方</label>
                    <input
                      type="text"
                      value={editingEntry.reading}
                      onChange={e => setEditingEntry(prev => prev ? { ...prev, reading: e.target.value } : null)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">正しい表記</label>
                    <input
                      type="text"
                      value={editingEntry.correctText}
                      onChange={e => setEditingEntry(prev => prev ? { ...prev, correctText: e.target.value } : null)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">カテゴリ</label>
                    <input
                      type="text"
                      value={editingEntry.category}
                      onChange={e => setEditingEntry(prev => prev ? { ...prev, category: e.target.value } : null)}
                      className="w-full p-2 border rounded"
                      list="categories"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">説明</label>
                    <input
                      type="text"
                      value={editingEntry.description || ''}
                      onChange={e => setEditingEntry(prev => prev ? { ...prev, description: e.target.value } : null)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div className="col-span-2 flex gap-2">
                    <button
                      onClick={handleUpdateEntry}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => setEditingEntry(null)}
                      className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex gap-2 items-center mb-1">
                      <span className="font-medium">{entry.term}</span>
                      {entry.reading && (
                        <span className="text-gray-500">（{entry.reading}）</span>
                      )}
                      <span>→</span>
                      <span className="font-medium text-green-600">{entry.correctText}</span>
                    </div>
                    <div className="text-sm">
                      <span className="bg-gray-100 px-2 py-1 rounded">{entry.category}</span>
                      {entry.description && (
                        <span className="ml-2 text-gray-500">{entry.description}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingEntry(entry)}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      削除
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {filteredEntries.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              エントリが見つかりません
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 