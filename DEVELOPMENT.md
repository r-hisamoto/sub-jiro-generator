# 開発ガイドライン

## コーディング規約

### 全般
- TypeScriptを使用し、型定義を徹底する
- ESLintとPrettierを使用してコードの品質を維持
- コンポーネントは機能単位で分割し、再利用性を重視
- WebGPU対応を考慮した実装

### 命名規則
- コンポーネント: PascalCase (例: VideoPlayer)
- フック: use + PascalCase (例: useSpeechRecognition)
- 関数: camelCase (例: handleFileUpload)
- 定数: UPPER_SNAKE_CASE (例: MAX_FILE_SIZE)
- 型定義: PascalCase + Type/Props/Config (例: VideoPlayerProps)

### コンポーネント設計
- Atomic Designの考え方を採用
- Props型定義は明示的に行う
- 副作用はカスタムフックに分離
- エラーハンドリングを徹底

### API・外部サービス連携
- Supabaseを使用したバックエンド連携
- Hugging Face Transformersの適切な統合
- WebGPU APIの効率的な利用
- エラー状態の適切な管理

### スタイリング
- Tailwind CSSを使用
- Shadcn UIコンポーネントの活用
- レスポンシブデザインを基本とする
- アクセシビリティに配慮

## 開発フロー

### ブランチ戦略
- main: プロダクション環境
- develop: 開発環境のメインブランチ
- feature/*: 機能開発用
- bugfix/*: バグ修正用

### 開発プロセス
1. タスクのイシュー化
2. developからfeatureブランチを作成
3. 実装とテスト
4. コードレビュー
5. developへマージ

## テスト方針

### テストレベル
1. ユニットテスト
   - コンポーネントの個別機能
   - カスタムフックの動作
   - ユーティリティ関数

2. 統合テスト
   - Hugging Face API連携
   - ファイルアップロード処理
   - 字幕生成フロー

3. E2Eテスト
   - 主要ユースケース
   - エラーケース

### パフォーマンステスト
- WebGPU処理の速度測定
- メモリ使用量の監視
- ファイルアップロード速度

## デバッグ・モニタリング
- コンソールログの活用
- パフォーマンスプロファイリング
- エラートラッキング

## セキュリティ
- アクセストークンの安全な管理
- ファイルアップロードの検証
- クロスサイトスクリプティング対策

## 環境設定
- Node.js v18以上
- TypeScript v5
- Vite最新版
- WebGPU対応ブラウザ