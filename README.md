# Sub Jiro Generator

音声ファイルから字幕を自動生成し、高度な編集・管理機能を提供するWebアプリケーション

## 主要機能

### 音声認識・文字起こし
- WebGPU対応ブラウザでの高速処理
- Hugging Face Whisperによる高精度な日本語音声認識
- AIサービス連携とカスタマイズ

### メディア処理
- 複数の音声・動画フォーマット対応
- リアルタイム波形表示
- BGM管理と音声効果
- スライドショー生成

### 字幕編集・管理
- タイムライン形式での編集
- 音声波形との同期表示
- リアルタイムプレビュー
- 複数フォーマット対応

### AI支援機能
- 画像生成と解析
- プロンプト自動生成
- 辞書・用語管理
- 自動修正機能

### チーム協業
- リアルタイムコラボレーション
- プロジェクト共有
- 権限管理
- アクティビティログ

## 必要要件

- Node.js 18.0.0以上
- WebGPU対応ブラウザ（推奨）
- Hugging Face APIキー
- Replicate APIキー（AI画像生成用）
- Supabase設定（データベース連携用）

## インストール

```bash
# 依存パッケージのインストール
npm install

# 開発サーバーの起動
npm run dev

# ビルド
npm run build

# テストの実行
npm test
```

## 環境変数の設定

`.env`ファイルを作成し、以下の環境変数を設定してください：

```env
HUGGING_FACE_API_KEY=your_api_key_here
REPLICATE_API_KEY=your_replicate_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
PEXELS_API_KEY=your_pexels_api_key
PIXABAY_API_KEY=your_pixabay_api_key
```

## 使用方法

1. アプリケーションを起動し、音声/動画ファイルをアップロード
2. 自動で文字起こしが開始され、進捗状況が表示
3. 文字起こし完了後、字幕エディタで編集
4. 必要に応じてAI機能やフリー素材を活用
5. 編集した字幕を保存・エクスポート
6. チームメンバーと共有・コラボレーション

## 開発者向け情報

### プロジェクト構成

```
src/
├── components/     # UIコンポーネント
├── services/      # コアサービス
├── hooks/         # カスタムフック
├── lib/           # ユーティリティ
├── types/         # 型定義
├── pages/         # ページコンポーネント
└── utils/         # ヘルパー関数
```

### 主要なサービス

- `WhisperService`: 音声認識処理
- `WebGPUService`: GPU処理の最適化
- `PerformanceService`: パフォーマンス測定
- `AIService`: AI機能の統合
- `CollaborationService`: リアルタイム協業

### テスト

- ユニットテスト: `npm test`
- E2Eテスト: `npm run test:e2e`
- パフォーマンステスト: `npm run test:perf`

## ライセンス

MIT License

## 貢献

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 注意事項

- WebGPU非対応環境では、Hugging Face APIを使用
- 大きなファイルの処理には時間がかかる場合があります
- メモリ使用量は自動的に最適化されます
- オフライン機能は一部制限があります
- APIキーは安全に管理してください
