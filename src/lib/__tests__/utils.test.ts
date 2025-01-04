import { describe, it, expect } from 'vitest';
import { formatTimeToSRT, parseTimeFromSRT, cn } from '../utils';

describe('formatTimeToSRT', () => {
  it('秒数をSRT形式の時間文字列に変換する', () => {
    expect(formatTimeToSRT(3661.5)).toBe('01:01:01,500');
  });

  it('小数点以下を正しく処理する', () => {
    expect(formatTimeToSRT(1.234)).toBe('00:00:01,234');
    expect(formatTimeToSRT(1.2)).toBe('00:00:01,200');
    expect(formatTimeToSRT(1.02)).toBe('00:00:01,020');
  });

  it('境界値を正しく処理する', () => {
    expect(formatTimeToSRT(0)).toBe('00:00:00,000');
    expect(formatTimeToSRT(359999.999)).toBe('99:59:59,999');
  });
});

describe('parseTimeFromSRT', () => {
  it('SRT形式の時間文字列を秒数に変換する', () => {
    expect(parseTimeFromSRT('01:01:01,500')).toBe(3661.5);
  });

  it('ミリ秒を正しく処理する', () => {
    expect(parseTimeFromSRT('00:00:01,234')).toBe(1.234);
    expect(parseTimeFromSRT('00:00:01,200')).toBe(1.2);
    expect(parseTimeFromSRT('00:00:01,020')).toBe(1.02);
  });

  it('無効な形式の入力を処理する', () => {
    expect(() => parseTimeFromSRT('invalid')).toThrow();
    expect(() => parseTimeFromSRT('00:00')).toThrow();
    expect(() => parseTimeFromSRT('00:00:00')).toThrow();
  });
});

describe('cn', () => {
  it('クラス名を正しく結合する', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('条件付きクラスを正しく処理する', () => {
    expect(cn('base', { 'conditional': true, 'hidden': false })).toBe('base conditional');
  });

  it('オブジェクト形式のクラスを正しく処理する', () => {
    expect(cn({ 'class1': true, 'class2': false })).toBe('class1');
  });

  it('配列形式のクラスを正しく処理する', () => {
    expect(cn(['class1', 'class2'])).toBe('class1 class2');
  });

  it('重複するクラスを正しく処理する', () => {
    expect(cn('class1', 'class1', 'class2')).toBe('class1 class2');
    expect(cn(['class1', 'class1'], { 'class2': true })).toBe('class1 class2');
  });
}); 