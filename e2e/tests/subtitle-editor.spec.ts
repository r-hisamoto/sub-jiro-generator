import { test, expect } from '@playwright/test';

test('字幕の基本的な編集フロー', async ({ page }) => {
  await page.goto('/');
  
  // ページが完全に読み込まれるのを待つ
  await page.waitForSelector('[data-testid="subtitle-editor"]');

  // 字幕の追加
  await page.click('button[aria-label="現在位置に字幕を追加"]');
  
  // テキストエリアが表示されることを確認
  const textarea = await page.waitForSelector('textarea');
  await expect(textarea).toBeTruthy();
  await expect(textarea).toBeAttached();

  // 字幕テキストの入力
  await textarea.fill('テスト字幕');
  const value = await textarea.inputValue();
  await expect(value).toBe('テスト字幕');

  // タイムコードの設定
  const startTimeInput = await page.getByLabel('開始時間');
  const endTimeInput = await page.getByLabel('終了時間');
  
  await startTimeInput.fill('00:00:01.000');
  await endTimeInput.fill('00:00:03.000');

  // 字幕が正しく表示されることを確認
  const subtitleElement = await page.waitForSelector('[data-testid="subtitle-item"]');
  const text = await subtitleElement.textContent();
  await expect(text).toContain('テスト字幕');
});

test('字幕のスタイル設定', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('[data-testid="subtitle-editor"]');

  // スタイル設定ダイアログを開く
  await page.click('button:has-text("スタイル設定")');
  
  // フォントファミリーの変更
  await page.selectOption('select[aria-label="フォントファミリー"]', 'Noto Serif JP');
  
  // フォントサイズの変更
  await page.fill('input[aria-label="フォントサイズ"]', '28px');
  
  // 色の変更
  await page.fill('input[type="color"][aria-label="テキストの色"]', '#FF0000');
  
  // 設定を保存
  await page.click('button:has-text("保存")');
  
  // スタイルが適用されていることを確認
  const subtitlePreview = await page.waitForSelector('[data-testid="subtitle-preview"]');
  const computedStyles = await subtitlePreview.evaluate((el) => {
    const style = window.getComputedStyle(el);
    return {
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      color: style.color
    };
  });
  
  expect(computedStyles.fontFamily).toContain('Noto Serif JP');
  expect(computedStyles.fontSize).toBe('28px');
  expect(computedStyles.color).toBe('rgb(255, 0, 0)');
}); 