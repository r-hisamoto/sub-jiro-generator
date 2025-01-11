import { useState, useEffect, useCallback, KeyboardEvent as ReactKeyboardEvent } from 'react';
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
import { Keyboard } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ShortcutManager,
  ShortcutAction,
  DEFAULT_SHORTCUTS,
  ShortcutSetting
} from '@/lib/shortcutManager';

interface ShortcutSettingsDialogProps {
  settings: ShortcutSetting[];
  onSettingsChange: (settings: ShortcutSetting[]) => void;
}

const ShortcutSettingsDialog: React.FC<ShortcutSettingsDialogProps> = ({
  settings,
  onSettingsChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [shortcutManager] = useState(() => new ShortcutManager(settings));
  const [editingAction, setEditingAction] = useState<string | null>(null);
  const [recordingKeys, setRecordingKeys] = useState(false);
  const [currentKeys, setCurrentKeys] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const handleKeyDown = useCallback((event: ReactKeyboardEvent) => {
    if (!recordingKeys) return;

    event.preventDefault();
    const key = shortcutManager['getPressedKeyCombo'](event);
    if (!currentKeys.includes(key)) {
      setCurrentKeys([...currentKeys, key]);
    }
  }, [recordingKeys, currentKeys, shortcutManager]);

  const startRecording = (actionId: string) => {
    setEditingAction(actionId);
    setRecordingKeys(true);
    setCurrentKeys([]);
  };

  const stopRecording = () => {
    if (editingAction && currentKeys.length > 0) {
      const conflicts = shortcutManager.getConflictingActions(editingAction, currentKeys);
      if (conflicts.length === 0) {
        shortcutManager.setKeysForAction(editingAction, currentKeys);
        onSettingsChange(shortcutManager.exportSettings());
      } else {
        // 競合がある場合は警告を表示
        const conflictingActions = conflicts
          .map(id => DEFAULT_SHORTCUTS.find(a => a.id === id)?.name)
          .filter(Boolean)
          .join(', ');
        alert(`以下のショートカットと競合しています：${conflictingActions}`);
      }
    }
    setEditingAction(null);
    setRecordingKeys(false);
    setCurrentKeys([]);
  };

  const resetToDefaults = () => {
    if (confirm('すべてのショートカットをデフォルト設定に戻しますか？')) {
      shortcutManager.resetToDefaults();
      onSettingsChange(shortcutManager.exportSettings());
    }
  };

  const filteredShortcuts = DEFAULT_SHORTCUTS.filter(action =>
    selectedCategory === 'all' ? true : action.category === selectedCategory
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Keyboard className="w-4 h-4 mr-2" />
          ショートカット設定
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-4xl"
        onKeyDown={handleKeyDown}
        onKeyUp={() => recordingKeys && stopRecording()}
      >
        <DialogHeader>
          <DialogTitle>ショートカット設定</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="カテゴリーを選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="edit">編集</SelectItem>
                <SelectItem value="playback">再生</SelectItem>
                <SelectItem value="navigation">ナビゲーション</SelectItem>
                <SelectItem value="other">その他</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={resetToDefaults}
            >
              デフォルトに戻す
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>アクション</TableHead>
                <TableHead>説明</TableHead>
                <TableHead>ショートカット</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShortcuts.map((action) => (
                <TableRow key={action.id}>
                  <TableCell>{action.name}</TableCell>
                  <TableCell>{action.description}</TableCell>
                  <TableCell>
                    {editingAction === action.id ? (
                      <div className="bg-muted p-2 rounded">
                        {currentKeys.length > 0
                          ? currentKeys.join(' または ')
                          : 'キーを入力してください...'}
                      </div>
                    ) : (
                      shortcutManager.getKeysForAction(action.id).join(' または ')
                    )}
                  </TableCell>
                  <TableCell>
                    {editingAction === action.id ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => stopRecording()}
                      >
                        完了
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startRecording(action.id)}
                      >
                        変更
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShortcutSettingsDialog; 