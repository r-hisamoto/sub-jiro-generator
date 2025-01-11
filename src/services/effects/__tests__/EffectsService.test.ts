import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EffectsService } from '../EffectsService';
import { PerformanceService } from '@/services/performance/PerformanceService';

describe('EffectsService', () => {
  let effectsService: EffectsService;
  let mockPerformanceService: PerformanceService;

  beforeEach(() => {
    mockPerformanceService = {
      startMeasurement: vi.fn(),
      endMeasurement: vi.fn().mockReturnValue({ duration: 100, memoryDelta: 0 }),
    } as unknown as PerformanceService;

    effectsService = new EffectsService(mockPerformanceService);
  });

  it('トランジションエフェクトを適用できる', async () => {
    const slides = [
      { id: 'slide1', content: 'Content 1' },
      { id: 'slide2', content: 'Content 2' }
    ];
    const transition = {
      type: 'fade',
      duration: 1000,
      easing: 'ease-in-out'
    };
    
    const result = await effectsService.applyTransition(slides, transition);
    
    expect(result).toHaveProperty('slides');
    expect(result).toHaveProperty('transition');
    expect(result.transition).toEqual(transition);
  });

  it('アニメーションをカスタマイズできる', async () => {
    const element = {
      id: 'element1',
      type: 'text',
      content: 'Animated Text'
    };
    const animation = {
      type: 'bounce',
      duration: 500,
      delay: 200,
      iterations: 2
    };
    
    const result = await effectsService.customizeAnimation(element, animation);
    
    expect(result).toHaveProperty('element');
    expect(result).toHaveProperty('animation');
    expect(result.animation).toEqual(animation);
  });

  it('エフェクトプリセットを管理できる', async () => {
    const preset = {
      name: 'Smooth Fade',
      type: 'transition',
      settings: {
        duration: 800,
        easing: 'ease-out',
        opacity: { start: 0, end: 1 }
      }
    };
    
    const result = await effectsService.savePreset(preset);
    const savedPresets = await effectsService.getPresets();
    
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('name', preset.name);
    expect(savedPresets).toContainEqual(expect.objectContaining(preset));
  });

  it('複数のエフェクトを組み合わせられる', async () => {
    const effects = [
      { type: 'fade', duration: 500 },
      { type: 'scale', duration: 300, scale: 1.2 }
    ];
    const target = {
      id: 'target1',
      type: 'image',
      src: 'test.jpg'
    };
    
    const result = await effectsService.combineEffects(target, effects);
    
    expect(result).toHaveProperty('target');
    expect(result).toHaveProperty('effects');
    expect(result.effects).toHaveLength(effects.length);
  });

  it('タイムラインベースのアニメーションを作成できる', async () => {
    const timeline = {
      name: 'Sequence 1',
      duration: 2000,
      keyframes: [
        { time: 0, effect: 'fade-in' },
        { time: 1000, effect: 'scale-up' },
        { time: 2000, effect: 'fade-out' }
      ]
    };
    
    const result = await effectsService.createTimeline(timeline);
    
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('keyframes');
    expect(result.keyframes).toHaveLength(timeline.keyframes.length);
  });

  it('エフェクトのパフォーマンスを最適化できる', async () => {
    const effect = {
      type: 'particle',
      count: 1000,
      duration: 2000
    };
    
    const optimized = await effectsService.optimizeEffect(effect);
    
    expect(optimized).toHaveProperty('type', effect.type);
    expect(optimized).toHaveProperty('performance');
    expect(optimized.performance).toHaveProperty('fps');
    expect(optimized.performance).toHaveProperty('memoryUsage');
  });

  it('エフェクトをプレビューできる', async () => {
    const effect = {
      type: 'blur',
      intensity: 5,
      duration: 500
    };
    
    const preview = await effectsService.previewEffect(effect);
    
    expect(preview).toHaveProperty('url');
    expect(preview).toHaveProperty('duration');
    expect(preview).toHaveProperty('thumbnails');
  });

  it('エフェクトの設定を検証できる', async () => {
    const validEffect = {
      type: 'fade',
      duration: 500,
      easing: 'ease-in-out'
    };
    
    const invalidEffect = {
      type: 'invalid',
      duration: -100
    };
    
    const validResult = await effectsService.validateEffect(validEffect);
    expect(validResult.isValid).toBe(true);
    
    const invalidResult = await effectsService.validateEffect(invalidEffect);
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.errors).toBeDefined();
  });

  it('エフェクトの適用範囲を制御できる', async () => {
    const effect = {
      type: 'highlight',
      color: '#FFD700',
      intensity: 0.8
    };
    const target = {
      selector: '.important-text',
      excludeSelector: '.skip-effect'
    };
    
    const result = await effectsService.setEffectScope(effect, target);
    
    expect(result).toHaveProperty('effect');
    expect(result).toHaveProperty('scope');
    expect(result.scope).toEqual(target);
  });

  it('エラー時に適切に処理される', async () => {
    const invalidEffect = {
      type: 'unknown',
      settings: {}
    };
    
    await expect(
      effectsService.applyEffect(invalidEffect)
    ).rejects.toThrow('Invalid effect type');
  });
}); 