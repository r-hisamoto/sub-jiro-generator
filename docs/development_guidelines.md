# 開発ガイドライン

## 1. コーディング規約

### 1.1 全般
- TypeScriptの厳格モードを使用
- ESLintとPrettierを使用した一貫性のある整形
- 関数型プログラミングの原則を優先
- 副作用の最小化

### 1.2 命名規則
- コンポーネント: PascalCase
- 関数・変数: camelCase
- 定数: UPPER_SNAKE_CASE
- ファイル名: kebab-case
- インターフェース: 先頭にIを付けない

### 1.3 コメント
- JSDoc形式を使用
- 複雑なロジックには説明を追加
- TODO/FIXMEコメントにはチケット番号を記載

## 2. アーキテクチャ

### 2.1 ディレクトリ構造
```
src/
  ├── components/     # Reactコンポーネント
  ├── lib/           # ユーティリティ関数
  ├── hooks/         # カスタムフック
  ├── types/         # 型定義
  ├── styles/        # スタイル定義
  └── pages/         # ページコンポーネント
```

### 2.2 コンポーネント設計
- 単一責任の原則に従う
- Presentational/Containerパターンの採用
- カスタムフックによるロジックの分離
- メモ化による最適化

### 2.3 状態管理
- ローカル状態: useState
- 複雑な状態: useReducer
- グローバル状態: 必要に応じてContext API

## 3. 型定義

### 3.1 基本型
```typescript
interface Subtitle {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
}

interface SlideItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  startTime: number;
  endTime: number;
  transition: 'fade' | 'slide' | 'none';
}

interface BGMTrack {
  id: string;
  name: string;
  url: string;
  duration: number;
  startTime: number;
  volume: number;
  loop: boolean;
}
```

### 3.2 ユーティリティ型
```typescript
type Optional<T> = T | undefined;
type Nullable<T> = T | null;
type AsyncFunction<T> = () => Promise<T>;
```

## 4. エラー処理

### 4.1 基本方針
- エラーの種類に応じた適切な処理
- ユーザーフレンドリーなエラーメッセージ
- エラーのログ記録
- 回復可能なエラーの自動リトライ

### 4.2 エラー型
```typescript
interface AppError extends Error {
  code: string;
  details?: unknown;
}
```

## 5. テスト

### 5.1 単体テスト
- Jestを使用
- コンポーネントのレンダリングテスト
- ユーティリティ関数のテスト
- エッジケースの考慮

### 5.2 統合テスト
- React Testing Libraryを使用
- ユーザー操作のシミュレーション
- 非同期処理のテスト

## 6. パフォーマンス最適化

### 6.1 レンダリング最適化
- 不要な再レンダリングの防止
- React.memoの適切な使用
- useCallbackとuseMemoの活用

### 6.2 メモリ管理
- メモリリークの防止
- リソースの適切な解放
- 大きなデータの分割処理

## 7. セキュリティ

### 7.1 基本方針
- 入力値の検証
- XSS対策
- CSRF対策
- APIキーの保護

### 7.2 データ保護
- センシティブデータの暗号化
- セッション管理
- アクセス制御 