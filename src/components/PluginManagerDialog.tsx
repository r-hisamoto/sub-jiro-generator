import { useState, useEffect } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Puzzle, FileUp, FileDown, Trash2, Settings2 } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import {
  PluginManager,
  SubtitlePlugin
} from '@/lib/pluginManager';

interface PluginManagerDialogProps {
  onPluginChange: () => void;
}

const PluginManagerDialog: React.FC<PluginManagerDialogProps> = ({
  onPluginChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pluginManager] = useState(() => new PluginManager());
  const [plugins, setPlugins] = useState<SubtitlePlugin[]>([]);
  const [editingPluginId, setEditingPluginId] = useState<string | null>(null);

  useEffect(() => {
    setPlugins(pluginManager.getAllPlugins());
  }, [pluginManager]);

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const jsonData = e.target?.result as string;
      if (pluginManager.importPlugins(jsonData)) {
        setPlugins(pluginManager.getAllPlugins());
        onPluginChange();
      } else {
        alert('プラグインのインポートに失敗しました。');
      }
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    const jsonData = pluginManager.exportPlugins();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subtitle-plugins.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleUninstall = (id: string) => {
    if (confirm('このプラグインをアンインストールしてもよろしいですか？')) {
      pluginManager.unregisterPlugin(id);
      setPlugins(pluginManager.getAllPlugins());
      onPluginChange();
    }
  };

  const handleSettingChange = (pluginId: string, key: string, value: any) => {
    const settings = pluginManager.getPluginSettings(pluginId);
    if (settings) {
      pluginManager.updatePluginSettings(pluginId, {
        ...settings,
        [key]: value
      });
      setPlugins([...plugins]); // 再レンダリングのトリガー
      onPluginChange();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Puzzle className="w-4 h-4 mr-2" />
          プラグイン
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>プラグイン管理</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
              >
                <FileDown className="w-4 h-4 mr-2" />
                エクスポート
              </Button>
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('import-plugin')?.click()}
                >
                  <FileUp className="w-4 h-4 mr-2" />
                  インポート
                </Button>
                <input
                  type="file"
                  id="import-plugin"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名前</TableHead>
                  <TableHead>説明</TableHead>
                  <TableHead>バージョン</TableHead>
                  <TableHead>作者</TableHead>
                  <TableHead className="w-[100px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plugins.map((plugin) => (
                  <TableRow key={plugin.id}>
                    <TableCell>{plugin.name}</TableCell>
                    <TableCell>{plugin.description}</TableCell>
                    <TableCell>{plugin.version}</TableCell>
                    <TableCell>{plugin.author}</TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        {plugin.settings && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingPluginId(plugin.id)}
                          >
                            <Settings2 className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUninstall(plugin.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        {editingPluginId && (
          <Dialog>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>プラグイン設定</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {(() => {
                  const plugin = pluginManager.getPlugin(editingPluginId);
                  const settings = pluginManager.getPluginSettings(editingPluginId);
                  if (!plugin || !plugin.settings || !settings) return null;

                  return Object.entries(plugin.settings).map(([key, setting]) => (
                    <div key={key} className="space-y-2">
                      <Label>{setting.label}</Label>
                      {setting.description && (
                        <p className="text-sm text-muted-foreground">
                          {setting.description}
                        </p>
                      )}
                      {setting.type === 'string' && (
                        <Input
                          value={settings[key]}
                          onChange={(e) => handleSettingChange(editingPluginId, key, e.target.value)}
                        />
                      )}
                      {setting.type === 'number' && (
                        <Input
                          type="number"
                          value={settings[key]}
                          onChange={(e) => handleSettingChange(editingPluginId, key, parseFloat(e.target.value))}
                        />
                      )}
                      {setting.type === 'boolean' && (
                        <Switch
                          checked={settings[key]}
                          onCheckedChange={(checked) => handleSettingChange(editingPluginId, key, checked)}
                        />
                      )}
                      {setting.type === 'select' && setting.options && (
                        <Select
                          value={settings[key]}
                          onValueChange={(value) => handleSettingChange(editingPluginId, key, value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {setting.options.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  ));
                })()}
                <Button
                  onClick={() => setEditingPluginId(null)}
                  className="w-full"
                >
                  完了
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PluginManagerDialog; 