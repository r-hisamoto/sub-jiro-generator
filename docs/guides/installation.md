# インストールガイド（詳細版）

## 目次

1. [システム要件](#システム要件)
2. [事前準備](#事前準備)
3. [インストール手順](#インストール手順)
4. [環境設定](#環境設定)
5. [動作確認](#動作確認)
6. [アップデート手順](#アップデート手順)

## システム要件

### 必須要件
- Node.js 18.0.0以上
- npm 8.0.0以上
- メモリ: 8GB以上推奨
- ストレージ: 1GB以上の空き容量
- WebGPU対応ブラウザ（推奨）
  - Chrome 113以上
  - Edge 113以上
  - Firefox Nightly

### 推奨環境
- Node.js 20.0.0以上
- メモリ: 16GB以上
- GPU: WebGPU対応グラフィックスカード
- SSD: 10GB以上の空き容量

## 事前準備

### 1. Node.jsのインストール
```bash
# macOS (Homebrew)
brew install node

# Windows (Chocolatey)
choco install nodejs

# Ubuntu
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. 必要なAPIキーの取得

#### Hugging Face API
1. [Hugging Face](https://huggingface.co/)にアカウント登録
2. Settings > Access Tokensからトークンを生成
3. 生成したトークンを保存

#### Replicate API
1. [Replicate](https://replicate.com/)にアカウント登録
2. API Tokensページからトークンを生成
3. 生成したトークンを保存

#### Supabase設定
1. [Supabase](https://supabase.com/)でプロジェクト作成
2. Project Settings > API からURLとアノニマスキーを取得
3. 取得した情報を保存

## インストール手順

### 1. リポジトリのクローン
```bash
git clone https://github.com/yourusername/sub-jiro-generator.git
cd sub-jiro-generator
```

### 2. 依存パッケージのインストール
```bash
# npmの場合
npm install

# yarnの場合
yarn install

# pnpmの場合
pnpm install
```

### 3. 開発用証明書の生成（HTTPS開発用）
```bash
npm run generate-cert
```

## 環境設定

### 1. 環境変数の設定
`.env`ファイルを作成し、以下の内容を設定：

```env
# API Keys
HUGGING_FACE_API_KEY=your_api_key_here
REPLICATE_API_KEY=your_replicate_api_key

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Stock Photo APIs
PEXELS_API_KEY=your_pexels_api_key
PIXABAY_API_KEY=your_pixabay_api_key

# Performance Settings
MAX_MEMORY_USAGE=8192
BATCH_SIZE=1024
ENABLE_PERFORMANCE_MONITORING=true

# Feature Flags
ENABLE_WEBGPU=true
ENABLE_AI_FEATURES=true
ENABLE_COLLABORATION=true
```

### 2. 開発サーバーの設定
`vite.config.ts`の必要に応じた調整：

```typescript
export default defineConfig({
  server: {
    https: true,
    host: true,
    port: 3000,
    hmr: {
      overlay: true
    }
  }
});
```

## 動作確認

### 1. 開発サーバーの起動
```bash
npm run dev
```

### 2. ビルドとプレビュー
```bash
# ビルド
npm run build

# プレビュー
npm run preview
```

### 3. テストの実行
```bash
# 全テストの実行
npm test

# 特定のテストの実行
npm test -- -t "test name"

# カバレッジレポートの生成
npm run test:coverage
```

## アップデート手順

### 1. 依存パッケージの更新
```bash
# 更新可能なパッケージの確認
npm outdated

# パッケージの更新
npm update

# 特定のパッケージの更新
npm update package-name
```

### 2. プロジェクトのアップデート
```bash
# 最新のコードを取得
git pull origin main

# 依存パッケージの再インストール
npm install

# マイグレーションの実行（必要な場合）
npm run migrate
```

## トラブルシューティング

### よくある問題と解決方法

1. `npm install`が失敗する場合
```bash
# キャッシュのクリア
npm cache clean --force

# node_modulesの削除と再インストール
rm -rf node_modules
npm install
```

2. WebGPUが動作しない場合
- ブラウザの設定でWebGPUを有効化
- グラフィックスドライバーの更新
- `chrome://gpu`で状態を確認

3. メモリ不足エラーが発生する場合
- Node.jsのメモリ制限を緩和
```bash
export NODE_OPTIONS=--max-old-space-size=8192
```

## 注意事項

1. 開発環境では必ずHTTPSを使用してください
2. APIキーは公開リポジトリにコミットしないでください
3. 大規模なファイル処理時はメモリ使用量に注意
4. WebGPU機能はブラウザの実装状況に依存
5. 定期的なバックアップを推奨 