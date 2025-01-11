import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Replace } from 'lucide-react';
import { SearchOptions, ReplaceOptions, searchSubtitles, replaceSubtitles } from '@/lib/searchReplace';
import { formatTimeToSRT } from '@/lib/utils';
import type { Subtitle } from '@/types/subtitle';

interface SearchReplaceDialogProps {
  subtitles: Subtitle[];
  onReplace: (newSubtitles: Subtitle[]) => void;
}

const SearchReplaceDialog: React.FC<SearchReplaceDialogProps> = ({
  subtitles,
  onReplace
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    caseSensitive: false,
    useRegex: false,
    wholeWord: false
  });
  const [showReplace, setShowReplace] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    subtitleId: string;
    text: string;
    startTime: number;
    endTime: number;
    matches: { start: number; end: number; text: string; }[];
  }[]>([]);

  const handleSearch = () => {
    if (!searchText) return;
    const results = searchSubtitles(subtitles, searchText, searchOptions);
    setSearchResults(results);
  };

  const handleReplace = () => {
    if (!searchText) return;
    const newSubtitles = replaceSubtitles(
      subtitles,
      searchText,
      replaceText,
      { ...searchOptions, replaceAll: true }
    );
    onReplace(newSubtitles);
    setSearchResults([]);
  };

  const handleReplaceOne = (subtitleId: string) => {
    const subtitle = subtitles.find(s => s.id === subtitleId);
    if (!subtitle) return;

    const newSubtitles = replaceSubtitles(
      [subtitle],
      searchText,
      replaceText,
      { ...searchOptions, replaceAll: false }
    );

    const updatedSubtitles = subtitles.map(s =>
      s.id === subtitleId ? newSubtitles[0] : s
    );

    onReplace(updatedSubtitles);
    handleSearch(); // 検索結果を更新
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Search className="w-4 h-4 mr-2" />
          検索/置換
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>検索/置換</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>検索文字列</Label>
              <div className="flex space-x-2">
                <Input
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="検索する文字列を入力..."
                />
                <Button onClick={handleSearch}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {showReplace && (
              <div className="space-y-2">
                <Label>置換文字列</Label>
                <div className="flex space-x-2">
                  <Input
                    value={replaceText}
                    onChange={(e) => setReplaceText(e.target.value)}
                    placeholder="置換後の文字列を入力..."
                  />
                  <Button onClick={handleReplace}>
                    <Replace className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="caseSensitive"
                checked={searchOptions.caseSensitive}
                onCheckedChange={(checked) => setSearchOptions({
                  ...searchOptions,
                  caseSensitive: checked as boolean
                })}
              />
              <Label htmlFor="caseSensitive">大文字/小文字を区別</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="useRegex"
                checked={searchOptions.useRegex}
                onCheckedChange={(checked) => setSearchOptions({
                  ...searchOptions,
                  useRegex: checked as boolean
                })}
              />
              <Label htmlFor="useRegex">正規表現を使用</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="wholeWord"
                checked={searchOptions.wholeWord}
                onCheckedChange={(checked) => setSearchOptions({
                  ...searchOptions,
                  wholeWord: checked as boolean
                })}
              />
              <Label htmlFor="wholeWord">単語単位で検索</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showReplace"
                checked={showReplace}
                onCheckedChange={(checked) => setShowReplace(checked as boolean)}
              />
              <Label htmlFor="showReplace">置換モード</Label>
            </div>
          </div>

          <div className="border rounded-lg">
            <div className="p-2 border-b bg-muted">
              検索結果: {searchResults.length}件
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {searchResults.map((result, index) => (
                <div key={`${result.subtitleId}-${index}`} className="p-4 border-b last:border-b-0">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      {formatTimeToSRT(result.startTime)} → {formatTimeToSRT(result.endTime)}
                    </div>
                    {showReplace && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReplaceOne(result.subtitleId)}
                      >
                        置換
                      </Button>
                    )}
                  </div>
                  <div className="mt-2">
                    {result.text.split('').map((char, i) => {
                      const match = result.matches.find(m => i >= m.start && i < m.end);
                      return (
                        <span
                          key={i}
                          className={match ? 'bg-yellow-200' : undefined}
                        >
                          {char}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SearchReplaceDialog; 