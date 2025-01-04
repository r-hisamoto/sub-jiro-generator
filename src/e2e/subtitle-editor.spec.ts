import { test, expect } from '@playwright/test';

test('字幕の基本的な編集フロー', async ({ page }) => {
  await page.goto('/');

  // 動画のアップロード
  await page.setInputFiles('input[type="file"]', 'test-video.mp4');
  await expect(page.getByTestId('video-player')).toBeVisible();

  // 字幕の自動生成を待機
  await expect(page.getByText('字幕を生成中...')).toBeVisible();
  await expect(page.getByText('字幕を生成中...')).toBeHidden();

  // タイムラインの操作
  const timeline = page.getByTestId('timeline');
  await timeline.click({ position: { x: 100, y: 10 } });
  
  // 字幕の追加
  await page.getByText('現在位置に字幕を追加').click();
  const textarea = page.getByRole('textbox').first();
  await textarea.fill('テスト字幕です');
  
  // 字幕の編集
  await textarea.click();
  await textarea.fill('編集後の字幕です');
  
  // 字幕の削除
  await page.getByText('削除').first().click();
  await expect(textarea).not.toBeVisible();
});

test('長時間動画での字幕編集', async ({ page }) => {
  await page.goto('/');

  // 長い動画のアップロード
  await page.setInputFiles('input[type="file"]', 'long-video.mp4');
  
  // 字幕生成の進捗表示を確認
  await expect(page.getByRole('progressbar')).toBeVisible();
  await expect(page.getByText(/\d+%/)).toBeVisible();
  
  // 生成完了を待機
  await expect(page.getByText('字幕生成が完了しました')).toBeVisible();
  
  // 複数の字幕を編集
  for (let i = 0; i < 5; i++) {
    await page.getByText('現在位置に字幕を追加').click();
    const textarea = page.getByRole('textbox').nth(i);
    await textarea.fill(`テスト字幕${i + 1}`);
  }
  
  // 字幕の一括操作
  await page.getByText('すべての字幕を選択').click();
  await page.getByText('選択した字幕を削除').click();
  
  // 字幕が削除されたことを確認
  await expect(page.getByRole('textbox')).toHaveCount(0);
});

test('エラー処理', async ({ page }) => {
  await page.goto('/');

  // 無効なファイル形式
  await page.setInputFiles('input[type="file"]', 'invalid.txt');
  await expect(page.getByText('対応していないファイル形式です')).toBeVisible();
  
  // ネットワークエラー
  await page.route('**/api/transcribe', (route) => route.abort());
  await page.setInputFiles('input[type="file"]', 'test-video.mp4');
  await expect(page.getByText('音声認識中にエラーが発生しました')).toBeVisible();
  
  // 認証エラー
  await page.route('**/api/auth', (route) => route.fulfill({ status: 401 }));
  await page.getByText('ログイン').click();
  await expect(page.getByText('認証に失敗しました')).toBeVisible();
});

test('パフォーマンス', async ({ page }) => {
  await page.goto('/');

  // 大量の字幕データの読み込み
  await page.evaluate(() => {
    const subtitles = Array.from({ length: 1000 }, (_, i) => ({
      id: i.toString(),
      startTime: i,
      endTime: i + 1,
      text: `テスト字幕${i}`,
    }));
    window.localStorage.setItem('subtitles', JSON.stringify(subtitles));
  });
  
  await page.reload();
  
  // スクロールのパフォーマンス
  const container = page.getByTestId('subtitle-list');
  const startTime = await page.evaluate(() => performance.now());
  
  await container.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  
  const endTime = await page.evaluate(() => performance.now());
  expect(endTime - startTime).toBeLessThan(1000);
});

test('字幕の同期', async ({ page, context }) => {
  await page.goto('/');

  // 2つのブラウザウィンドウを開く
  const secondPage = await context.newPage();
  await secondPage.goto('/');
  
  // メインページで字幕を追加
  await page.getByText('現在位置に字幕を追加').click();
  await page.getByRole('textbox').first().fill('同期テスト');
  
  // 2つ目のページで変更が反映されることを確認
  await expect(secondPage.getByText('同期テスト')).toBeVisible();
  
  // 2つ目のページで字幕を編集
  await secondPage.getByRole('textbox').first().fill('編集後の字幕');
  
  // メインページで変更が反映されることを確認
  await expect(page.getByText('編集後の字幕')).toBeVisible();
}); 