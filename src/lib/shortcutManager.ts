import { KeyboardEvent } from 'react';

export interface ShortcutAction {
  id: string;
  name: string;
  description: string;
  defaultKeys: string[];
  category: 'edit' | 'playback' | 'navigation' | 'other';
}

export interface ShortcutSetting {
  actionId: string;
  keys: string[];
}

export const DEFAULT_SHORTCUTS: ShortcutAction[] = [
  {
    id: 'play-pause',
    name: '再生/一時停止',
    description: '動画の再生/一時停止を切り替えます',
    defaultKeys: ['Space'],
    category: 'playback'
  },
  {
    id: 'seek-forward',
    name: '前進',
    description: '5秒前進します',
    defaultKeys: ['ArrowRight'],
    category: 'playback'
  },
  {
    id: 'seek-backward',
    name: '後退',
    description: '5秒後退します',
    defaultKeys: ['ArrowLeft'],
    category: 'playback'
  },
  {
    id: 'add-subtitle',
    name: '字幕追加',
    description: '現在の位置に新しい字幕を追加します',
    defaultKeys: ['Control+Enter'],
    category: 'edit'
  },
  {
    id: 'delete-subtitle',
    name: '字幕削除',
    description: '選択中の字幕を削除します',
    defaultKeys: ['Delete'],
    category: 'edit'
  },
  {
    id: 'save-project',
    name: 'プロジェクト保存',
    description: 'プロジェクトを保存します',
    defaultKeys: ['Control+S'],
    category: 'other'
  },
  {
    id: 'undo',
    name: '元に戻す',
    description: '直前の操作を取り消します',
    defaultKeys: ['Control+Z'],
    category: 'edit'
  },
  {
    id: 'redo',
    name: 'やり直し',
    description: '取り消した操作をやり直します',
    defaultKeys: ['Control+Shift+Z', 'Control+Y'],
    category: 'edit'
  }
];

export class ShortcutManager {
  private shortcuts: Map<string, string[]>;

  constructor(customSettings: ShortcutSetting[] = []) {
    this.shortcuts = new Map();
    this.loadDefaults();
    this.applyCustomSettings(customSettings);
  }

  private loadDefaults() {
    DEFAULT_SHORTCUTS.forEach(action => {
      this.shortcuts.set(action.id, [...action.defaultKeys]);
    });
  }

  private applyCustomSettings(settings: ShortcutSetting[]) {
    settings.forEach(setting => {
      if (this.shortcuts.has(setting.actionId)) {
        this.shortcuts.set(setting.actionId, [...setting.keys]);
      }
    });
  }

  getKeysForAction(actionId: string): string[] {
    return this.shortcuts.get(actionId) || [];
  }

  setKeysForAction(actionId: string, keys: string[]) {
    if (this.shortcuts.has(actionId)) {
      this.shortcuts.set(actionId, [...keys]);
    }
  }

  matchesShortcut(event: KeyboardEvent, actionId: string): boolean {
    const keys = this.getKeysForAction(actionId);
    const pressedKey = this.getPressedKeyCombo(event);
    return keys.includes(pressedKey);
  }

  private getPressedKeyCombo(event: KeyboardEvent): string {
    const parts: string[] = [];
    
    if (event.ctrlKey || event.metaKey) parts.push('Control');
    if (event.shiftKey) parts.push('Shift');
    if (event.altKey) parts.push('Alt');
    
    // スペースキーの特別処理
    if (event.code === 'Space') {
      parts.push('Space');
    }
    // 通常のキー
    else if (event.key !== 'Control' && event.key !== 'Shift' && event.key !== 'Alt') {
      parts.push(event.key);
    }

    return parts.join('+');
  }

  exportSettings(): ShortcutSetting[] {
    return Array.from(this.shortcuts.entries()).map(([actionId, keys]) => ({
      actionId,
      keys: [...keys]
    }));
  }

  resetToDefaults() {
    this.shortcuts.clear();
    this.loadDefaults();
  }

  getConflictingActions(actionId: string, keys: string[]): string[] {
    const conflicts: string[] = [];
    this.shortcuts.forEach((actionKeys, id) => {
      if (id !== actionId && this.hasOverlappingKeys(actionKeys, keys)) {
        conflicts.push(id);
      }
    });
    return conflicts;
  }

  private hasOverlappingKeys(keys1: string[], keys2: string[]): boolean {
    return keys1.some(key1 => keys2.includes(key1));
  }
} 