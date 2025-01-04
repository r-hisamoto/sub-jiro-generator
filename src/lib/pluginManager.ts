export interface SubtitlePlugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  hooks: {
    onSubtitleCreate?: (subtitle: {
      id: string;
      text: string;
      startTime: number;
      endTime: number;
    }) => Promise<{
      id: string;
      text: string;
      startTime: number;
      endTime: number;
    }>;
    onSubtitleUpdate?: (subtitle: {
      id: string;
      text: string;
      startTime: number;
      endTime: number;
    }) => Promise<{
      id: string;
      text: string;
      startTime: number;
      endTime: number;
    }>;
    onSubtitleDelete?: (id: string) => Promise<void>;
    onExport?: (subtitles: Array<{
      id: string;
      text: string;
      startTime: number;
      endTime: number;
    }>) => Promise<string>;
    onImport?: (data: string) => Promise<Array<{
      id: string;
      text: string;
      startTime: number;
      endTime: number;
    }>>;
  };
  settings?: {
    [key: string]: {
      type: 'string' | 'number' | 'boolean' | 'select';
      label: string;
      description?: string;
      default: any;
      options?: Array<{
        label: string;
        value: any;
      }>;
    };
  };
}

export interface PluginManagerOptions {
  storageKey?: string;
}

export class PluginManager {
  private plugins: Map<string, SubtitlePlugin>;
  private settings: Map<string, { [key: string]: any }>;
  private storageKey: string;

  constructor(options: PluginManagerOptions = {}) {
    this.plugins = new Map();
    this.settings = new Map();
    this.storageKey = options.storageKey || 'subtitle-plugins';
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const storedData = localStorage.getItem(this.storageKey);
      if (storedData) {
        const data = JSON.parse(storedData);
        Object.entries(data.plugins || {}).forEach(([id, plugin]) => {
          this.plugins.set(id, plugin as SubtitlePlugin);
        });
        Object.entries(data.settings || {}).forEach(([id, settings]) => {
          this.settings.set(id, settings as { [key: string]: any });
        });
      }
    } catch (error) {
      console.error('Failed to load plugins from storage:', error);
    }
  }

  private saveToStorage() {
    try {
      const data = {
        plugins: Object.fromEntries(this.plugins.entries()),
        settings: Object.fromEntries(this.settings.entries())
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save plugins to storage:', error);
    }
  }

  registerPlugin(plugin: SubtitlePlugin): boolean {
    if (this.plugins.has(plugin.id)) {
      return false;
    }

    this.plugins.set(plugin.id, plugin);
    if (plugin.settings) {
      const defaultSettings = Object.fromEntries(
        Object.entries(plugin.settings).map(([key, setting]) => [key, setting.default])
      );
      this.settings.set(plugin.id, defaultSettings);
    }
    this.saveToStorage();
    return true;
  }

  unregisterPlugin(id: string): boolean {
    const deleted = this.plugins.delete(id);
    if (deleted) {
      this.settings.delete(id);
      this.saveToStorage();
    }
    return deleted;
  }

  getPlugin(id: string): SubtitlePlugin | null {
    return this.plugins.get(id) || null;
  }

  getAllPlugins(): SubtitlePlugin[] {
    return Array.from(this.plugins.values());
  }

  getPluginSettings(id: string): { [key: string]: any } | null {
    return this.settings.get(id) || null;
  }

  updatePluginSettings(id: string, settings: { [key: string]: any }): boolean {
    const plugin = this.plugins.get(id);
    if (!plugin || !plugin.settings) {
      return false;
    }

    // 設定値のバリデーション
    for (const [key, value] of Object.entries(settings)) {
      const settingDef = plugin.settings[key];
      if (!settingDef) continue;

      if (settingDef.type === 'select' && settingDef.options) {
        if (!settingDef.options.some(opt => opt.value === value)) {
          return false;
        }
      } else if (typeof value !== settingDef.type) {
        return false;
      }
    }

    this.settings.set(id, { ...this.settings.get(id), ...settings });
    this.saveToStorage();
    return true;
  }

  async executeHook<T extends keyof SubtitlePlugin['hooks']>(
    hookName: T,
    ...args: Parameters<NonNullable<SubtitlePlugin['hooks'][T]>>
  ): Promise<ReturnType<NonNullable<SubtitlePlugin['hooks'][T]>> | null> {
    for (const plugin of this.plugins.values()) {
      const hook = plugin.hooks[hookName];
      if (hook) {
        try {
          // @ts-ignore
          const result = await hook(...args);
          return result;
        } catch (error) {
          console.error(`Error executing ${hookName} hook for plugin ${plugin.id}:`, error);
        }
      }
    }
    return null;
  }

  exportPlugins(): string {
    return JSON.stringify({
      plugins: Array.from(this.plugins.values()),
      settings: Object.fromEntries(this.settings.entries())
    }, null, 2);
  }

  importPlugins(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      if (data.plugins) {
        data.plugins.forEach((plugin: SubtitlePlugin) => {
          this.registerPlugin(plugin);
        });
      }
      if (data.settings) {
        Object.entries(data.settings).forEach(([id, settings]) => {
          this.updatePluginSettings(id, settings as { [key: string]: any });
        });
      }
      return true;
    } catch (error) {
      console.error('Failed to import plugins:', error);
      return false;
    }
  }
} 