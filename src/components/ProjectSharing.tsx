import { useState } from 'react';
import {
  ProjectSharingSettings,
  CollaboratorInfo,
  ProjectCollaboration,
  generateSharingLink
} from '@/lib/collaboration';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Share2, UserPlus, Copy, Link, Settings2 } from 'lucide-react';

interface ProjectSharingProps {
  projectId: string;
  initialSettings: ProjectSharingSettings;
  onSettingsChange: (settings: ProjectSharingSettings) => void;
}

const ProjectSharing: React.FC<ProjectSharingProps> = ({
  projectId,
  initialSettings,
  onSettingsChange
}) => {
  const [settings, setSettings] = useState<ProjectSharingSettings>(initialSettings);
  const [newCollaborator, setNewCollaborator] = useState<Partial<CollaboratorInfo>>({});
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  const handleAccessLevelChange = (level: 'private' | 'shared' | 'public') => {
    const newSettings = {
      ...settings,
      accessLevel: level,
      lastModified: new Date()
    };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleAddCollaborator = () => {
    if (newCollaborator.email && newCollaborator.role) {
      const collaborator: CollaboratorInfo = {
        userId: Math.random().toString(36).substr(2, 9), // 仮のID生成
        displayName: newCollaborator.email.split('@')[0],
        email: newCollaborator.email,
        role: newCollaborator.role as 'viewer' | 'editor' | 'admin',
        lastActive: new Date()
      };

      const newSettings = {
        ...settings,
        collaborators: [...settings.collaborators, collaborator],
        lastModified: new Date()
      };

      setSettings(newSettings);
      onSettingsChange(newSettings);
      setNewCollaborator({});
      setShowInviteDialog(false);
    }
  };

  const handleRemoveCollaborator = (userId: string) => {
    const newSettings = {
      ...settings,
      collaborators: settings.collaborators.filter(c => c.userId !== userId),
      lastModified: new Date()
    };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleCopyLink = () => {
    const link = generateSharingLink(projectId);
    navigator.clipboard.writeText(link);
    // TODO: 成功通知を表示
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">プロジェクト共有設定</h2>
        <div className="flex space-x-2">
          <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <UserPlus className="w-4 h-4 mr-2" />
                招待
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>コラボレーターを招待</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>メールアドレス</Label>
                  <Input
                    type="email"
                    placeholder="collaborator@example.com"
                    value={newCollaborator.email || ''}
                    onChange={(e) => setNewCollaborator({
                      ...newCollaborator,
                      email: e.target.value
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>権限</Label>
                  <Select
                    value={newCollaborator.role}
                    onValueChange={(value: 'viewer' | 'editor' | 'admin') => 
                      setNewCollaborator({
                        ...newCollaborator,
                        role: value
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="権限を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">閲覧者</SelectItem>
                      <SelectItem value="editor">編集者</SelectItem>
                      <SelectItem value="admin">管理者</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  onClick={handleAddCollaborator}
                  disabled={!newCollaborator.email || !newCollaborator.role}
                >
                  招待を送信
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings2 className="w-4 h-4 mr-2" />
                詳細設定
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>共有設定</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>アクセスレベル</Label>
                  <Select
                    value={settings.accessLevel}
                    onValueChange={(value: 'private' | 'shared' | 'public') => 
                      handleAccessLevelChange(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">非公開</SelectItem>
                      <SelectItem value="shared">限定共有</SelectItem>
                      <SelectItem value="public">公開</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>共有リンク</Label>
                  <div className="flex space-x-2">
                    <Input
                      readOnly
                      value={generateSharingLink(projectId)}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyLink}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名前</TableHead>
              <TableHead>メールアドレス</TableHead>
              <TableHead>権限</TableHead>
              <TableHead>最終アクティブ</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {settings.collaborators.map((collaborator) => (
              <TableRow key={collaborator.userId}>
                <TableCell>{collaborator.displayName}</TableCell>
                <TableCell>{collaborator.email}</TableCell>
                <TableCell>
                  <Select
                    value={collaborator.role}
                    onValueChange={(value: 'viewer' | 'editor' | 'admin') => {
                      const newSettings = {
                        ...settings,
                        collaborators: settings.collaborators.map(c =>
                          c.userId === collaborator.userId
                            ? { ...c, role: value }
                            : c
                        ),
                        lastModified: new Date()
                      };
                      setSettings(newSettings);
                      onSettingsChange(newSettings);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">閲覧者</SelectItem>
                      <SelectItem value="editor">編集者</SelectItem>
                      <SelectItem value="admin">管理者</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {collaborator.lastActive
                    ? new Date(collaborator.lastActive).toLocaleString()
                    : '未アクセス'}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveCollaborator(collaborator.userId)}
                  >
                    削除
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ProjectSharing; 