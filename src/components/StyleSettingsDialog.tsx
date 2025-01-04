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
import { Palette } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  StyleSettings,
  DEFAULT_STYLE_SETTINGS,
  AVAILABLE_FONTS,
  convertStyleSettingsToCSS
} from '@/lib/styleSettings';

interface StyleSettingsDialogProps {
  settings: StyleSettings;
  onSettingsChange: (settings: StyleSettings) => void;
  previewText?: string;
}

const StyleSettingsDialog: React.FC<StyleSettingsDialogProps> = ({
  settings,
  onSettingsChange,
  previewText = 'プレビューテキスト'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState<StyleSettings>(settings);

  const handleSettingChange = <K extends keyof StyleSettings>(
    key: K,
    value: StyleSettings[K]
  ) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Palette className="w-4 h-4 mr-2" />
          スタイル設定
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>スタイル設定</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          {/* フォント設定 */}
          <div className="space-y-2">
            <Label>フォントファミリー</Label>
            <Select
              value={localSettings.fontFamily}
              onValueChange={(value) => handleSettingChange('fontFamily', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_FONTS.map(font => (
                  <SelectItem key={font} value={font}>
                    {font}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>フォントサイズ</Label>
            <Input
              value={localSettings.fontSize}
              onChange={(e) => handleSettingChange('fontSize', e.target.value)}
              placeholder="24px"
            />
          </div>
          <div className="space-y-2">
            <Label>フォントの太さ</Label>
            <Select
              value={localSettings.fontWeight}
              onValueChange={(value) => handleSettingChange('fontWeight', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">通常</SelectItem>
                <SelectItem value="bold">太字</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 色設定 */}
          <div className="space-y-2">
            <Label>テキストの色</Label>
            <div className="flex space-x-2">
              <Input
                type="color"
                value={localSettings.textColor}
                onChange={(e) => handleSettingChange('textColor', e.target.value)}
                className="w-12"
              />
              <Input
                value={localSettings.textColor}
                onChange={(e) => handleSettingChange('textColor', e.target.value)}
                placeholder="#FFFFFF"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>背景色</Label>
            <div className="flex space-x-2">
              <Input
                type="color"
                value={localSettings.backgroundColor}
                onChange={(e) => handleSettingChange('backgroundColor', e.target.value)}
                className="w-12"
              />
              <Input
                value={localSettings.backgroundColor}
                onChange={(e) => handleSettingChange('backgroundColor', e.target.value)}
                placeholder="#000000"
              />
            </div>
          </div>

          {/* 位置設定 */}
          <div className="space-y-2">
            <Label>位置</Label>
            <Select
              value={localSettings.position}
              onValueChange={(value: 'top' | 'middle' | 'bottom') => handleSettingChange('position', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="top">上</SelectItem>
                <SelectItem value="middle">中央</SelectItem>
                <SelectItem value="bottom">下</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>配置</Label>
            <Select
              value={localSettings.alignment}
              onValueChange={(value: 'left' | 'center' | 'right') => handleSettingChange('alignment', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">左揃え</SelectItem>
                <SelectItem value="center">中央揃え</SelectItem>
                <SelectItem value="right">右揃え</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* エフェクト設定 */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="outline"
                  checked={localSettings.outline}
                  onCheckedChange={(checked) => handleSettingChange('outline', checked as boolean)}
                />
                <Label htmlFor="outline">アウトライン</Label>
              </div>
              {localSettings.outline && (
                <div className="flex space-x-2 items-center">
                  <Input
                    type="color"
                    value={localSettings.outlineColor}
                    onChange={(e) => handleSettingChange('outlineColor', e.target.value)}
                    className="w-12"
                  />
                  <Input
                    value={localSettings.outlineColor}
                    onChange={(e) => handleSettingChange('outlineColor', e.target.value)}
                    placeholder="#000000"
                  />
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="shadow"
                  checked={localSettings.shadow}
                  onCheckedChange={(checked) => handleSettingChange('shadow', checked as boolean)}
                />
                <Label htmlFor="shadow">ドロップシャドウ</Label>
              </div>
              {localSettings.shadow && (
                <div className="flex space-x-2 items-center">
                  <Input
                    type="color"
                    value={localSettings.shadowColor}
                    onChange={(e) => handleSettingChange('shadowColor', e.target.value)}
                    className="w-12"
                  />
                  <Input
                    value={localSettings.shadowColor}
                    onChange={(e) => handleSettingChange('shadowColor', e.target.value)}
                    placeholder="#000000"
                  />
                </div>
              )}
            </div>
          </div>

          {/* プレビュー */}
          <div className="col-span-2 border rounded-lg p-4">
            <Label className="block mb-2">プレビュー</Label>
            <div className="bg-gray-800 p-4 rounded relative min-h-[200px] flex items-center justify-center">
              <div style={convertStyleSettingsToCSS(localSettings)}>
                {previewText}
              </div>
            </div>
          </div>

          {/* リセットボタン */}
          <div className="col-span-2">
            <Button
              variant="outline"
              onClick={() => {
                setLocalSettings(DEFAULT_STYLE_SETTINGS);
                onSettingsChange(DEFAULT_STYLE_SETTINGS);
              }}
              className="w-full"
            >
              デフォルト設定に戻す
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StyleSettingsDialog; 