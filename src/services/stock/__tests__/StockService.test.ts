import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StockService } from '../StockService';
import { PerformanceService } from '@/services/performance/PerformanceService';

describe('StockService', () => {
  let stockService: StockService;
  let mockPerformanceService: PerformanceService;

  beforeEach(() => {
    mockPerformanceService = {
      startMeasurement: vi.fn(),
      endMeasurement: vi.fn().mockReturnValue({ duration: 100, memoryDelta: 0 }),
    } as unknown as PerformanceService;

    stockService = new StockService(mockPerformanceService);
  });

  it('Pexelsから素材を検索できる', async () => {
    const query = 'nature';
    const result = await stockService.searchPexels(query);

    expect(result).toHaveProperty('items');
    expect(result.items).toBeInstanceOf(Array);
    expect(result.items[0]).toHaveProperty('url');
    expect(result.items[0]).toHaveProperty('author');
  });

  it('Pixabayから素材を検索できる', async () => {
    const query = 'city';
    const result = await stockService.searchPixabay(query);

    expect(result).toHaveProperty('items');
    expect(result.items).toBeInstanceOf(Array);
    expect(result.items[0]).toHaveProperty('url');
    expect(result.items[0]).toHaveProperty('author');
  });

  it('横断検索が機能する', async () => {
    const query = 'mountain';
    const result = await stockService.searchAll(query);

    expect(result).toHaveProperty('pexels');
    expect(result).toHaveProperty('pixabay');
    expect(result.pexels).toBeInstanceOf(Array);
    expect(result.pixabay).toBeInstanceOf(Array);
  });

  it('素材のダウンロードと処理が機能する', async () => {
    const mockUrl = 'https://example.com/image.jpg';
    const result = await stockService.downloadAndProcess(mockUrl);

    expect(result).toHaveProperty('processedUrl');
    expect(result).toHaveProperty('metadata');
    expect(result.metadata).toHaveProperty('originalUrl', mockUrl);
  });

  it('クレジット情報が正しく管理される', async () => {
    const mockCredit = {
      author: 'Test Author',
      source: 'Pexels',
      license: 'Free to use',
      url: 'https://example.com/image.jpg'
    };

    await stockService.saveCredit(mockCredit);
    const credits = await stockService.getCredits();

    expect(credits).toContainEqual(mockCredit);
  });

  it('エラー時に適切に処理される', async () => {
    const invalidUrl = 'invalid-url';
    
    await expect(
      stockService.downloadAndProcess(invalidUrl)
    ).rejects.toThrow('Invalid URL');
  });

  it('サムネイル生成が機能する', async () => {
    const mockUrl = 'https://example.com/image.jpg';
    const result = await stockService.generateThumbnail(mockUrl);

    expect(result).toHaveProperty('thumbnailUrl');
    expect(result).toHaveProperty('width');
    expect(result).toHaveProperty('height');
  });

  it('メタデータ抽出が機能する', async () => {
    const mockUrl = 'https://example.com/image.jpg';
    const metadata = await stockService.extractMetadata(mockUrl);

    expect(metadata).toHaveProperty('dimensions');
    expect(metadata).toHaveProperty('format');
    expect(metadata).toHaveProperty('size');
  });

  it('利用規約の表示が機能する', async () => {
    const source = 'Pexels';
    const terms = await stockService.getLicenseTerms(source);

    expect(terms).toHaveProperty('text');
    expect(terms).toHaveProperty('url');
    expect(terms).toHaveProperty('lastUpdated');
  });
}); 