import { PerformanceService } from '@/services/performance/PerformanceService';

export interface Term {
  id?: string;
  word: string;
  reading: string;
  meaning: string;
  examples: string[];
  tags: string[];
}

export interface SearchQuery {
  keyword: string;
  tags?: string[];
}

export interface Dictionary {
  id?: string;
  name: string;
  description?: string;
  terms: string[];
}

export interface CorrectionRule {
  id?: string;
  pattern: string;
  replacement: string;
  isRegex: boolean;
  isEnabled: boolean;
}

export interface RelatedTerm {
  id: string;
  relationship: string;
}

export interface Example {
  text: string;
  context: string;
}

export interface HistoryEntry {
  timestamp: Date;
  author: string;
  changes: Record<string, any>;
}

export class DictionaryService {
  private terms: Map<string, Term> = new Map();
  private dictionaries: Map<string, Dictionary> = new Map();
  private correctionRules: Map<string, CorrectionRule> = new Map();
  private synonyms: Map<string, string[]> = new Map();
  private relatedTerms: Map<string, RelatedTerm[]> = new Map();
  private examples: Map<string, Example[]> = new Map();
  private history: Map<string, HistoryEntry[]> = new Map();

  constructor(private performanceService: PerformanceService) {}

  async registerTerm(term: Term): Promise<Term> {
    this.performanceService.startMeasurement('registerTerm');

    const id = crypto.randomUUID();
    const newTerm = { ...term, id };
    this.terms.set(id, newTerm);

    this.addToHistory(id, {
      timestamp: new Date(),
      author: 'current-user',
      changes: { type: 'create', term: newTerm }
    });

    this.performanceService.endMeasurement('registerTerm');

    return newTerm;
  }

  async searchTerms(query: SearchQuery): Promise<Term[]> {
    this.performanceService.startMeasurement('searchTerms');

    const results = Array.from(this.terms.values()).filter(term => {
      const matchesKeyword = term.word.includes(query.keyword) ||
        term.reading.includes(query.keyword) ||
        term.meaning.includes(query.keyword);
      
      if (!matchesKeyword) return false;
      
      if (query.tags && !query.tags.every(tag => term.tags.includes(tag))) {
        return false;
      }
      
      return true;
    });

    this.performanceService.endMeasurement('searchTerms');

    return results;
  }

  async createDictionary(dictionary: Dictionary): Promise<Dictionary> {
    this.performanceService.startMeasurement('createDictionary');

    const id = crypto.randomUUID();
    const newDictionary = { ...dictionary, id };
    this.dictionaries.set(id, newDictionary);

    this.performanceService.endMeasurement('createDictionary');

    return newDictionary;
  }

  async addCorrectionRule(rule: CorrectionRule): Promise<CorrectionRule> {
    this.performanceService.startMeasurement('addCorrectionRule');

    const id = crypto.randomUUID();
    const newRule = { ...rule, id };
    this.correctionRules.set(id, newRule);

    this.performanceService.endMeasurement('addCorrectionRule');

    return newRule;
  }

  async updateSynonyms(termId: string, synonyms: string[]): Promise<{ termId: string; synonyms: string[] }> {
    this.performanceService.startMeasurement('updateSynonyms');

    if (!this.terms.has(termId)) {
      throw new Error('Term not found');
    }

    this.synonyms.set(termId, synonyms);

    this.addToHistory(termId, {
      timestamp: new Date(),
      author: 'current-user',
      changes: { type: 'update_synonyms', synonyms }
    });

    this.performanceService.endMeasurement('updateSynonyms');

    return { termId, synonyms };
  }

  async updateRelatedTerms(termId: string, relatedTerms: RelatedTerm[]): Promise<{
    termId: string;
    relatedTerms: RelatedTerm[];
  }> {
    this.performanceService.startMeasurement('updateRelatedTerms');

    if (!this.terms.has(termId)) {
      throw new Error('Term not found');
    }

    this.relatedTerms.set(termId, relatedTerms);

    this.addToHistory(termId, {
      timestamp: new Date(),
      author: 'current-user',
      changes: { type: 'update_related_terms', relatedTerms }
    });

    this.performanceService.endMeasurement('updateRelatedTerms');

    return { termId, relatedTerms };
  }

  async updateExamples(termId: string, examples: Example[]): Promise<{
    termId: string;
    examples: Example[];
  }> {
    this.performanceService.startMeasurement('updateExamples');

    if (!this.terms.has(termId)) {
      throw new Error('Term not found');
    }

    this.examples.set(termId, examples);

    this.addToHistory(termId, {
      timestamp: new Date(),
      author: 'current-user',
      changes: { type: 'update_examples', examples }
    });

    this.performanceService.endMeasurement('updateExamples');

    return { termId, examples };
  }

  async getTermHistory(termId: string): Promise<HistoryEntry[]> {
    this.performanceService.startMeasurement('getTermHistory');

    if (!this.terms.has(termId)) {
      throw new Error('Term not found');
    }

    const history = this.history.get(termId) || [];

    this.performanceService.endMeasurement('getTermHistory');

    return history;
  }

  async exportDictionary(dictionary: Dictionary): Promise<string> {
    this.performanceService.startMeasurement('exportDictionary');

    const exportData = JSON.stringify(dictionary);

    this.performanceService.endMeasurement('exportDictionary');

    return exportData;
  }

  async importDictionary(data: string): Promise<Dictionary> {
    this.performanceService.startMeasurement('importDictionary');

    const dictionary = JSON.parse(data) as Dictionary;
    const id = crypto.randomUUID();
    const importedDictionary = { ...dictionary, id };
    this.dictionaries.set(id, importedDictionary);

    this.performanceService.endMeasurement('importDictionary');

    return importedDictionary;
  }

  async getTerm(termId: string): Promise<Term> {
    this.performanceService.startMeasurement('getTerm');

    const term = this.terms.get(termId);
    if (!term) {
      throw new Error('Term not found');
    }

    this.performanceService.endMeasurement('getTerm');

    return term;
  }

  private addToHistory(termId: string, entry: HistoryEntry): void {
    const history = this.history.get(termId) || [];
    history.push(entry);
    this.history.set(termId, history);
  }
} 