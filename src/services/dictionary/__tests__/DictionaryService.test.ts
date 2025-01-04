import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DictionaryService } from '../DictionaryService';
import { PerformanceService } from '@/services/performance/PerformanceService';

describe('DictionaryService', () => {
  let dictionaryService: DictionaryService;
  let mockPerformanceService: PerformanceService;

  beforeEach(() => {
    mockPerformanceService = {
      startMeasurement: vi.fn(),
      endMeasurement: vi.fn().mockReturnValue({ duration: 100, memoryDelta: 0 }),
    } as unknown as PerformanceService;

    dictionaryService = new DictionaryService(mockPerformanceService);
  });

  it('用語を登録できる', async () => {
    const term = {
      word: 'テスト',
      reading: 'てすと',
      meaning: 'ソフトウェアの品質を確認するための行為',
      examples: ['単体テスト', '結合テスト'],
      tags: ['技術', 'QA']
    };
    
    const result = await dictionaryService.registerTerm(term);
    
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('word', term.word);
    expect(result).toHaveProperty('reading', term.reading);
  });

  it('用語を検索できる', async () => {
    const searchQuery = {
      keyword: 'テスト',
      tags: ['技術']
    };
    
    const results = await dictionaryService.searchTerms(searchQuery);
    
    expect(Array.isArray(results)).toBe(true);
    results.forEach(term => {
      expect(term).toHaveProperty('id');
      expect(term).toHaveProperty('word');
      expect(term).toHaveProperty('reading');
      expect(term).toHaveProperty('meaning');
    });
  });

  it('カスタム辞書を作成できる', async () => {
    const dictionary = {
      name: 'テスト用語集',
      description: 'テスト関連の用語をまとめた辞書',
      terms: ['term1', 'term2']
    };
    
    const result = await dictionaryService.createDictionary(dictionary);
    
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('name', dictionary.name);
    expect(result).toHaveProperty('terms');
  });

  it('自動修正ルールを設定できる', async () => {
    const rule = {
      pattern: 'テスと',
      replacement: 'テスト',
      isRegex: false,
      isEnabled: true
    };
    
    const result = await dictionaryService.addCorrectionRule(rule);
    
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('pattern', rule.pattern);
    expect(result).toHaveProperty('replacement', rule.replacement);
  });

  it('用語の同義語を管理できる', async () => {
    const termId = 'term1';
    const synonyms = ['試験', 'チェック', '確認'];
    
    const result = await dictionaryService.updateSynonyms(termId, synonyms);
    
    expect(result).toHaveProperty('termId', termId);
    expect(result).toHaveProperty('synonyms');
    expect(result.synonyms).toEqual(synonyms);
  });

  it('用語の関連語を管理できる', async () => {
    const termId = 'term1';
    const relatedTerms = [
      { id: 'term2', relationship: '上位語' },
      { id: 'term3', relationship: '関連語' }
    ];
    
    const result = await dictionaryService.updateRelatedTerms(termId, relatedTerms);
    
    expect(result).toHaveProperty('termId', termId);
    expect(result).toHaveProperty('relatedTerms');
    expect(result.relatedTerms).toEqual(relatedTerms);
  });

  it('用語の使用例を管理できる', async () => {
    const termId = 'term1';
    const examples = [
      { text: '単体テストを実施する', context: '開発プロセス' },
      { text: 'テスト計画を立てる', context: 'プロジェクト管理' }
    ];
    
    const result = await dictionaryService.updateExamples(termId, examples);
    
    expect(result).toHaveProperty('termId', termId);
    expect(result).toHaveProperty('examples');
    expect(result.examples).toEqual(examples);
  });

  it('用語の変更履歴を管理できる', async () => {
    const termId = 'term1';
    
    const history = await dictionaryService.getTermHistory(termId);
    
    expect(Array.isArray(history)).toBe(true);
    history.forEach(entry => {
      expect(entry).toHaveProperty('timestamp');
      expect(entry).toHaveProperty('author');
      expect(entry).toHaveProperty('changes');
    });
  });

  it('用語のエクスポート・インポートができる', async () => {
    const dictionary = {
      name: 'エクスポート用辞書',
      terms: [
        {
          word: 'テスト',
          reading: 'てすと',
          meaning: 'テストの意味'
        }
      ]
    };
    
    const exported = await dictionaryService.exportDictionary(dictionary);
    const imported = await dictionaryService.importDictionary(exported);
    
    expect(imported).toHaveProperty('name', dictionary.name);
    expect(imported.terms).toHaveLength(dictionary.terms.length);
  });

  it('エラー時に適切に処理される', async () => {
    const invalidTermId = 'invalid';
    
    await expect(
      dictionaryService.getTerm(invalidTermId)
    ).rejects.toThrow('Term not found');
  });
}); 