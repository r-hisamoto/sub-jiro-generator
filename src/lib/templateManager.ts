import { StyleSettings } from './styleSettings';

export interface SubtitleTemplate {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  styleSettings: StyleSettings;
  patterns: Array<{
    id: string;
    name: string;
    text: string;
    startOffset: number;
    endOffset: number;
  }>;
}

export interface TemplateManagerOptions {
  storageKey?: string;
}

export class TemplateManager {
  private templates: Map<string, SubtitleTemplate>;
  private storageKey: string;

  constructor(options: TemplateManagerOptions = {}) {
    this.templates = new Map();
    this.storageKey = options.storageKey || 'subtitle-templates';
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const storedData = localStorage.getItem(this.storageKey);
      if (storedData) {
        const templates = JSON.parse(storedData) as SubtitleTemplate[];
        templates.forEach(template => {
          this.templates.set(template.id, template);
        });
      }
    } catch (error) {
      console.error('Failed to load templates from storage:', error);
    }
  }

  private saveToStorage() {
    try {
      const templates = Array.from(this.templates.values());
      localStorage.setItem(this.storageKey, JSON.stringify(templates));
    } catch (error) {
      console.error('Failed to save templates to storage:', error);
    }
  }

  createTemplate(template: Omit<SubtitleTemplate, 'id' | 'createdAt' | 'updatedAt'>): SubtitleTemplate {
    const now = new Date().toISOString();
    const newTemplate: SubtitleTemplate = {
      ...template,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now
    };
    this.templates.set(newTemplate.id, newTemplate);
    this.saveToStorage();
    return newTemplate;
  }

  updateTemplate(id: string, updates: Partial<Omit<SubtitleTemplate, 'id' | 'createdAt'>>): SubtitleTemplate | null {
    const template = this.templates.get(id);
    if (!template) return null;

    const updatedTemplate: SubtitleTemplate = {
      ...template,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.templates.set(id, updatedTemplate);
    this.saveToStorage();
    return updatedTemplate;
  }

  deleteTemplate(id: string): boolean {
    const deleted = this.templates.delete(id);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  getTemplate(id: string): SubtitleTemplate | null {
    return this.templates.get(id) || null;
  }

  getAllTemplates(): SubtitleTemplate[] {
    return Array.from(this.templates.values())
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  searchTemplates(query: string): SubtitleTemplate[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllTemplates().filter(template =>
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description.toLowerCase().includes(lowerQuery)
    );
  }

  exportTemplates(): string {
    return JSON.stringify(Array.from(this.templates.values()), null, 2);
  }

  importTemplates(jsonData: string): boolean {
    try {
      const templates = JSON.parse(jsonData) as SubtitleTemplate[];
      templates.forEach(template => {
        this.templates.set(template.id, template);
      });
      this.saveToStorage();
      return true;
    } catch (error) {
      console.error('Failed to import templates:', error);
      return false;
    }
  }

  applyTemplate(template: SubtitleTemplate, currentTime: number) {
    return template.patterns.map(pattern => ({
      id: crypto.randomUUID(),
      text: pattern.text,
      startTime: currentTime + pattern.startOffset,
      endTime: currentTime + pattern.endOffset
    }));
  }
} 