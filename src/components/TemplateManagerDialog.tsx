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
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, FileUp, FileDown, Plus, Trash2, Edit2, Copy } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  TemplateManager,
  SubtitleTemplate
} from '@/lib/templateManager';
import { StyleSettings, DEFAULT_STYLE_SETTINGS } from '@/lib/styleSettings';

interface TemplateManagerDialogProps {
  currentTime: number;
  styleSettings: StyleSettings;
  onApplyTemplate: (subtitles: Array<{
    id: string;
    text: string;
    startTime: number;
    endTime: number;
  }>) => void;
}

const TemplateManagerDialog: React.FC<TemplateManagerDialogProps> = ({
  currentTime,
  styleSettings,
  onApplyTemplate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [templateManager] = useState(() => new TemplateManager());
  const [templates, setTemplates] = useState<SubtitleTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<SubtitleTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState<Partial<SubtitleTemplate>>({
    name: '',
    description: '',
    styleSettings: DEFAULT_STYLE_SETTINGS,
    patterns: []
  });

  useEffect(() => {
    setTemplates(templateManager.getAllTemplates());
  }, [templateManager]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setTemplates(query ? templateManager.searchTemplates(query) : templateManager.getAllTemplates());
  };

  const handleCreateTemplate = () => {
    if (!newTemplate.name) return;

    const template = templateManager.createTemplate({
      name: newTemplate.name,
      description: newTemplate.description || '',
      styleSettings: newTemplate.styleSettings || styleSettings,
      patterns: newTemplate.patterns || []
    });

    setTemplates(templateManager.getAllTemplates());
    setNewTemplate({
      name: '',
      description: '',
      styleSettings: DEFAULT_STYLE_SETTINGS,
      patterns: []
    });
  };

  const handleUpdateTemplate = () => {
    if (!editingTemplate) return;

    templateManager.updateTemplate(editingTemplate.id, editingTemplate);
    setTemplates(templateManager.getAllTemplates());
    setEditingTemplate(null);
  };

  const handleDeleteTemplate = (id: string) => {
    if (confirm('このテンプレートを削除してもよろしいですか？')) {
      templateManager.deleteTemplate(id);
      setTemplates(templateManager.getAllTemplates());
    }
  };

  const handleApplyTemplate = (template: SubtitleTemplate) => {
    const subtitles = templateManager.applyTemplate(template, currentTime);
    onApplyTemplate(subtitles);
    setIsOpen(false);
  };

  const handleExport = () => {
    const jsonData = templateManager.exportTemplates();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subtitle-templates.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const jsonData = e.target?.result as string;
      if (templateManager.importTemplates(jsonData)) {
        setTemplates(templateManager.getAllTemplates());
      } else {
        alert('テンプレートのインポートに失敗しました。');
      }
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Save className="w-4 h-4 mr-2" />
          テンプレート
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>字幕テンプレート管理</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Input
              placeholder="テンプレートを検索..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-[300px]"
            />
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
                  onClick={() => document.getElementById('import-file')?.click()}
                >
                  <FileUp className="w-4 h-4 mr-2" />
                  インポート
                </Button>
                <input
                  type="file"
                  id="import-file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">新規テンプレート</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>名前</Label>
                  <Input
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({
                      ...newTemplate,
                      name: e.target.value
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>説明</Label>
                  <Textarea
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate({
                      ...newTemplate,
                      description: e.target.value
                    })}
                  />
                </div>
                <Button
                  onClick={handleCreateTemplate}
                  disabled={!newTemplate.name}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  テンプレートを作成
                </Button>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">テンプレート一覧</h3>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>名前</TableHead>
                      <TableHead>説明</TableHead>
                      <TableHead className="w-[120px]">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell>{template.name}</TableCell>
                        <TableCell>{template.description}</TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApplyTemplate(template)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingTemplate(template)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTemplate(template.id)}
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
          </div>
        </div>

        {editingTemplate && (
          <Dialog>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>テンプレートを編集</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>名前</Label>
                  <Input
                    value={editingTemplate.name}
                    onChange={(e) => setEditingTemplate({
                      ...editingTemplate,
                      name: e.target.value
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>説明</Label>
                  <Textarea
                    value={editingTemplate.description}
                    onChange={(e) => setEditingTemplate({
                      ...editingTemplate,
                      description: e.target.value
                    })}
                  />
                </div>
                <Button
                  onClick={handleUpdateTemplate}
                  className="w-full"
                >
                  更新
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TemplateManagerDialog; 