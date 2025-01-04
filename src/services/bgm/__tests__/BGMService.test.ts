import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BGMService } from '../BGMService';
import { PerformanceService } from '@/services/performance/PerformanceService';

describe('BGMService', () => {
  let bgmService: BGMService;
  let mockPerformanceService: PerformanceService;

  beforeEach(() => {
    mockPerformanceService = {
      startMeasurement: vi.fn(),
      endMeasurement: vi.fn().mockReturnValue({ duration: 100, memoryDelta: 0 }),
    } as unknown as PerformanceService;

    bgmService = new BGMService(mockPerformanceService);
  });

  it('音楽ファイルをライブラリに追加できる', async () => {
    const mockAudio = new File([''], 'test.mp3', { type: 'audio/mp3' });
    const metadata = {
      title: 'Test BGM',
      artist: 'Test Artist',
      duration: 180,
      tags: ['rock', 'instrumental']
    };
    
    const result = await bgmService.addToLibrary(mockAudio, metadata);
    
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('url');
    expect(result.metadata).toEqual(metadata);
  });

  it('音楽ライブラリを検索できる', async () => {
    const searchQuery = {
      title: 'Test',
      tags: ['rock']
    };
    
    const results = await bgmService.searchLibrary(searchQuery);
    
    expect(Array.isArray(results)).toBe(true);
    results.forEach(item => {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('url');
      expect(item).toHaveProperty('metadata');
    });
  });

  it('波形を可視化できる', async () => {
    const mockAudio = new File([''], 'test.mp3', { type: 'audio/mp3' });
    
    const waveform = await bgmService.generateWaveform(mockAudio);
    
    expect(waveform).toHaveProperty('data');
    expect(waveform).toHaveProperty('width');
    expect(waveform).toHaveProperty('height');
  });

  it('音楽ファイルをトリミングできる', async () => {
    const mockAudio = new File([''], 'test.mp3', { type: 'audio/mp3' });
    const trimRange = {
      start: 10,
      end: 30
    };
    
    const result = await bgmService.trimAudio(mockAudio, trimRange);
    
    expect(result).toHaveProperty('url');
    expect(result).toHaveProperty('duration', 20);
  });

  it('フェードイン・アウトを適用できる', async () => {
    const mockAudio = new File([''], 'test.mp3', { type: 'audio/mp3' });
    const fadeSettings = {
      fadeIn: 3,
      fadeOut: 2
    };
    
    const result = await bgmService.applyFade(mockAudio, fadeSettings);
    
    expect(result).toHaveProperty('url');
    expect(result).toHaveProperty('fadeSettings', fadeSettings);
  });

  it('音量を調整できる', async () => {
    const mockAudio = new File([''], 'test.mp3', { type: 'audio/mp3' });
    const volume = 0.8;
    
    const result = await bgmService.adjustVolume(mockAudio, volume);
    
    expect(result).toHaveProperty('url');
    expect(result).toHaveProperty('volume', volume);
  });

  it('エフェクトを適用できる', async () => {
    const mockAudio = new File([''], 'test.mp3', { type: 'audio/mp3' });
    const effect = {
      type: 'reverb',
      settings: {
        roomSize: 0.8,
        dampening: 3000
      }
    };
    
    const result = await bgmService.applyEffect(mockAudio, effect);
    
    expect(result).toHaveProperty('url');
    expect(result).toHaveProperty('effect', effect);
  });

  it('プレイリストを作成・管理できる', async () => {
    const playlist = {
      name: 'My Playlist',
      tracks: [
        { id: '1', order: 1 },
        { id: '2', order: 2 }
      ]
    };
    
    await bgmService.createPlaylist(playlist);
    const savedPlaylists = await bgmService.getPlaylists();
    
    expect(savedPlaylists).toContainEqual(playlist);
  });

  it('エラー時に適切に処理される', async () => {
    const invalidAudio = new File([''], 'invalid.txt', { type: 'text/plain' });
    
    await expect(
      bgmService.addToLibrary(invalidAudio, {
        title: 'Invalid',
        artist: 'Test',
        duration: 0,
        tags: []
      })
    ).rejects.toThrow('Invalid audio format');
  });
}); 