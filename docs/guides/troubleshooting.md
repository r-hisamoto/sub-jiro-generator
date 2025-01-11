# トラブルシューティングガイド

## 目次

1. [一般的な問題](#一般的な問題)
2. [インストール関連](#インストール関連)
3. [実行時の問題](#実行時の問題)
4. [パフォーマンス問題](#パフォーマンス問題)
5. [WebGPU関連](#webgpu関連)
6. [API連携の問題](#api連携の問題)
7. [エラーコード一覧](#エラーコード一覧)

## 一般的な問題

### アプリケーションが起動しない

1. Node.jsのバージョン確認
```bash
node -v  # 18.0.0以上であることを確認
```

2. 依存パッケージの再インストール
```bash
rm -rf node_modules
npm install
```

3. 開発サーバーの再起動
```bash
npm run dev
```

### ブラウザでページが表示されない

1. 開発サーバーのログを確認
2. ブラウザのコンソールでエラーを確認
3. 以下を試してください：
   - キャッシュのクリア
   - シークレットモードでの実行
   - 別のブラウザでの試行

## インストール関連

### npm installが失敗する

1. Node.jsとnpmの再インストール
```bash
# macOS
brew uninstall node
brew install node

# Windows
choco uninstall nodejs
choco install nodejs
```

2. npmキャッシュのクリア
```bash
npm cache clean --force
```

3. package-lock.jsonの削除と再インストール
```bash
rm package-lock.json
npm install
```

### ビルドエラー

1. 必要な開発ツールの確認
```bash
npm list -g typescript
npm list -g vite
```

2. TypeScriptの設定確認
```bash
tsc --version
tsc --noEmit
```

3. 環境変数の確認
```bash
# .envファイルの存在確認
cat .env

# 必要な環境変数の設定確認
echo $HUGGING_FACE_API_KEY
```

## 実行時の問題

### 音声認識が機能しない

1. APIキーの確認
```bash
# .envファイルの確認
cat .env | grep HUGGING_FACE_API_KEY
```

2. ネットワーク接続の確認
```bash
curl -I https://api-inference.huggingface.co
```

3. ブラウザの権限設定確認
   - マイクへのアクセス許可
   - HTTPS接続の確認

### 字幕編集が保存されない

1. ローカルストレージの確認
   - ブラウザの開発者ツールでストレージを確認
   - ストレージの空き容量確認

2. Supabase接続の確認
```bash
# 環境変数の確認
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY
```

3. データベースの状態確認
   - Supabaseダッシュボードでテーブル確認
   - クエリログの確認

## パフォーマンス問題

### メモリ使用量が高い

1. Node.jsのメモリ制限調整
```bash
export NODE_OPTIONS=--max-old-space-size=8192
```

2. ガベージコレクションの強制実行
```javascript
if (global.gc) {
  global.gc();
}
```

3. メモリリークの調査
   - Chrome DevToolsのメモリプロファイラー使用
   - ヒープスナップショットの分析

### 処理が遅い

1. パフォーマンスモニタリングの有効化
```bash
ENABLE_PERFORMANCE_MONITORING=true npm run dev
```

2. バッチサイズの調整
```env
BATCH_SIZE=512
```

3. WebGPU設定の最適化
```typescript
const workgroupSize = Math.min(256, device.limits.maxComputeWorkgroupSizeX);
```

## WebGPU関連

### WebGPUが利用できない

1. ブラウザの確認
   - Chrome 113以上
   - chrome://gpuで状態確認

2. グラフィックスドライバーの更新
   - 最新のドライバーをインストール
   - GPUの互換性確認

3. フォールバックモードの確認
```typescript
if (!await WebGPUService.isSupported()) {
  console.log('Using fallback mode');
}
```

### シェーダーコンパイルエラー

1. シェーダーコードの検証
```wgsl
@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
  // デバッグ出力
  if (global_id.x == 0u) {
    debugPrint("Shader started");
  }
}
```

2. デバイス制限の確認
```typescript
console.log(device.limits);
```

## API連携の問題

### Hugging Face APIエラー

1. APIキーの有効性確認
```bash
curl -H "Authorization: Bearer $HUGGING_FACE_API_KEY" \
  https://api-inference.huggingface.co/models/facebook/wav2vec2-base
```

2. レート制限の確認
   - APIリクエストの頻度確認
   - クォータの使用状況確認

3. エラーレスポンスの確認
```typescript
try {
  await whisperService.transcribe(file);
} catch (error) {
  console.error('API Error:', error.response?.data);
}
```

### Supabase接続エラー

1. 接続設定の確認
```typescript
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
```

2. ネットワーク接続の確認
```bash
curl -I $SUPABASE_URL
```

## エラーコード一覧

### 1000番台: 一般エラー
- 1001: 初期化エラー
- 1002: 設定エラー
- 1003: 権限エラー

### 2000番台: API関連
- 2001: API認証エラー
- 2002: レート制限エラー
- 2003: APIレスポンスエラー

### 3000番台: WebGPU関連
- 3001: デバイス初期化エラー
- 3002: シェーダーコンパイルエラー
- 3003: メモリ割り当てエラー

### 4000番台: ファイル処理
- 4001: ファイル読み込みエラー
- 4002: フォーマット未対応エラー
- 4003: ファイルサイズエラー

## デバッグモード

### デバッグログの有効化
```env
DEBUG=true
DEBUG_LEVEL=verbose
```

### デバッグコマンド
```bash
# 詳細なログ出力
npm run dev -- --debug

# パフォーマンス分析
npm run analyze

# テストカバレッジ
npm run test:coverage
```

## サポート情報

- [GitHubイシュー](https://github.com/yourusername/sub-jiro-generator/issues)
- [開発者フォーラム](https://forum.sub-jiro-generator.com)
- [ドキュメント](https://docs.sub-jiro-generator.com)

## 更新履歴

最新のトラブルシューティング情報は[CHANGELOG.md](../CHANGELOG.md)を参照してください。 