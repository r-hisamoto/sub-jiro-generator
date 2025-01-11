# 開発ガイド

## 目次

1. [開発環境のセットアップ](#開発環境のセットアップ)
2. [プロジェクト構造](#プロジェクト構造)
3. [開発ワークフロー](#開発ワークフロー)
4. [コーディング規約](#コーディング規約)
5. [テスト](#テスト)
6. [デプロイメント](#デプロイメント)
7. [CI/CD](#cicd)

## 開発環境のセットアップ

### 必要条件

- Node.js (v18.0.0以上)
- npm (v8.0.0以上)
- Chrome (v113以上、WebGPUサポート用)
- Git

### インストール手順

1. リポジトリのクローン
```bash
git clone https://github.com/yourusername/sub-jiro-generator.git
cd sub-jiro-generator
```

2. 依存パッケージのインストール
```bash
npm install
```

3. 環境変数の設定
```bash
cp .env.example .env
# .envファイルを編集して必要な環境変数を設定
```

4. 開発サーバーの起動
```bash
npm run dev
```

## プロジェクト構造

```
sub-jiro-generator/
├── src/
│   ├── components/     # Reactコンポーネント
│   ├── hooks/          # カスタムフック
│   ├── lib/           # ユーティリティ関数
│   ├── pages/         # ページコンポーネント
│   ├── services/      # サービスクラス
│   └── types/         # TypeScript型定義
├── public/            # 静的ファイル
├── docs/             # ドキュメント
├── tests/            # テストファイル
└── vite.config.ts    # Vite設定
```

## 開発ワークフロー

### ブランチ戦略

- `main`: 本番環境用
- `develop`: 開発用メインブランチ
- `feature/*`: 新機能開発用
- `bugfix/*`: バグ修正用
- `release/*`: リリース準備用

### コミットメッセージ規約

```
<type>(<scope>): <subject>

<body>

<footer>
```

- type: feat, fix, docs, style, refactor, test, chore
- scope: コンポーネント名やファイル名
- subject: 変更内容の要約
- body: 詳細な説明
- footer: Breaking changesやIssue参照

### プルリクエストプロセス

1. 新しいブランチを作成
```bash
git checkout -b feature/new-feature
```

2. 変更を実装

3. テストの実行
```bash
npm run test
```

4. リントとフォーマット
```bash
npm run lint
npm run format
```

5. コミットとプッシュ
```bash
git add .
git commit -m "feat(component): add new feature"
git push origin feature/new-feature
```

6. プルリクエストの作成
- テンプレートに従って記述
- レビュアーの指定
- 関連するIssueのリンク

## コーディング規約

### TypeScript

- 厳格な型チェック
- インターフェースの積極的な使用
- 非同期処理はPromiseベース

```typescript
// Good
interface User {
  id: string;
  name: string;
}

async function getUser(id: string): Promise<User> {
  return await api.get(`/users/${id}`);
}

// Bad
function getUser(id) {
  return api.get('/users/' + id);
}
```

### React

- 関数コンポーネントの使用
- Hooksの適切な使用
- Props型の明示的な定義

```typescript
// Good
interface Props {
  title: string;
  onSubmit: () => void;
}

const MyComponent: React.FC<Props> = ({ title, onSubmit }) => {
  return <div onClick={onSubmit}>{title}</div>;
};

// Bad
const MyComponent = (props) => {
  return <div onClick={props.onSubmit}>{props.title}</div>;
};
```

### スタイリング

- Tailwind CSSの使用
- コンポーネント固有のスタイルはモジュール化
- レスポンシブデザインの考慮

```typescript
// Good
const Button = () => (
  <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded">
    Click me
  </button>
);

// Bad
const Button = () => (
  <button style={{ padding: '8px 16px', backgroundColor: 'blue' }}>
    Click me
  </button>
);
```

## テスト

### ユニットテスト

```bash
# 全テストの実行
npm run test

# 特定のテストの実行
npm run test -- components/Button.test.tsx

# カバレッジレポートの生成
npm run test:coverage
```

### テスト規約

```typescript
describe('Component: Button', () => {
  it('should render with default props', () => {
    const { getByText } = render(<Button>Click me</Button>);
    expect(getByText('Click me')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const onClick = jest.fn();
    const { getByText } = render(
      <Button onClick={onClick}>Click me</Button>
    );
    fireEvent.click(getByText('Click me'));
    expect(onClick).toHaveBeenCalled();
  });
});
```

## デプロイメント

### 本番ビルド

```bash
# 本番用ビルド
npm run build

# ビルド成果物の確認
npm run preview
```

### デプロイメントフロー

1. 環境変数の確認
```bash
# 本番環境用の.envファイルを作成
cp .env.example .env.production
```

2. ビルドとテスト
```bash
npm run build
npm run test
```

3. デプロイ
```bash
# Vercelへのデプロイ例
vercel --prod
```

## CI/CD

### GitHub Actions

```yaml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v2
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    - name: Install dependencies
      run: npm ci
    - name: Run tests
      run: npm test
    - name: Build
      run: npm run build
```

### 自動デプロイ

- mainブランチへのマージで本番環境へ自動デプロイ
- developブランチへのマージでステージング環境へ自動デプロイ
- プルリクエストごとにプレビュー環境を作成

## パフォーマンス最適化

### ビルド最適化

```bash
# バンドルサイズの分析
npm run analyze

# パフォーマンスプロファイル
npm run profile
```

### コード分割

```typescript
// 動的インポートの使用
const MyComponent = React.lazy(() => import('./MyComponent'));

// Suspenseでラップ
<Suspense fallback={<Loading />}>
  <MyComponent />
</Suspense>
```

### メモ化

```typescript
// コンポーネントのメモ化
const MemoizedComponent = React.memo(MyComponent);

// 関数のメモ化
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
```

## セキュリティ

### セキュリティベストプラクティス

1. 入力のバリデーション
```typescript
import { z } from 'zod';

const UserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
```

2. XSS対策
```typescript
// dangerouslySetInnerHTMLの使用を避ける
const SafeComponent = () => (
  <div>{sanitizeHtml(content)}</div>
);
```

3. CSRF対策
```typescript
// APIリクエストにCSRFトークンを含める
const api = axios.create({
  headers: {
    'X-CSRF-Token': getCsrfToken(),
  },
});
```

## トラブルシューティング

詳細は[troubleshooting.md](./troubleshooting.md)を参照してください。

## コントリビューション

1. Issueの作成
2. ブランチの作成
3. 変更の実装
4. テストの追加
5. プルリクエストの作成

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。 