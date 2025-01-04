# WhisperService

Hugging Face Whisperを使用して高精度な日本語音声認識を提供するサービス。WebGPUとHugging Face APIの両方をサポートし、最適な処理方法を自動的に選択します。

## 主要機能

### 音声認識
- 高精度な日本語音声認識
- WebGPU対応環境での高速処理
- チャンク単位での音声処理
- 認識精度の最適化
- 音声認識のキャンセル機能

### パフォーマンス
- WebGPUによる並列処理
- メモリ使用量の最適化
- リアルタイムの進捗表示
- 自動的なワークグループサイズ調整

### エラー処理
- WebGPU非対応環境でのフォールバック
- エラーハンドリングとリトライ機能
- 進捗状況のリアルタイム表示
- キャンセル処理の対応

## コンストラクタ

```typescript
constructor(
  webGPUService: WebGPUService,
  hfInference: HfInference,
  performanceService: PerformanceService
)
```

### パラメータ

- `webGPUService`: WebGPU処理を行うサービス
- `hfInference`: Hugging Face APIクライアント
- `performanceService`: パフォーマンス測定サービス

## メソッド

### transcribe

音声ファイルをテキストに変換します。

```typescript
async transcribe(
  file: File,
  options?: TranscribeOptions,
  onProgress?: ProgressCallback,
  signal?: AbortSignal
): Promise<TranscriptionResult>
```

#### パラメータ

- `file`: 変換する音声ファイル
- `options`: 変換オプション（オプション）
  - `chunkSize`: チャンクサイズ（バイト）
  - `model`: 使用するモデル
  - `language`: 言語設定
  - `task`: タスクタイプ
- `onProgress`: 進捗状況を受け取るコールバック関数（オプション）
- `signal`: 処理をキャンセルするためのAbortSignal（オプション）

#### 戻り値

```typescript
interface TranscriptionResult {
  text: string;
  segments: Array<{
    start: number;
    end: number;
    text: string;
    confidence: number;
  }>;
  language: string;
  performance: {
    duration: number;
    memoryUsage: number;
  };
}
```

#### 例外

- `TranscriptionError`: 文字起こしに失敗した場合
- `AbortError`: 処理がキャンセルされた場合
- `ValidationError`: パラメータが無効な場合

## 使用例

```typescript
const whisperService = new WhisperService(
  webGPUService,
  hfInference,
  performanceService
);

// 基本的な使用方法
const result = await whisperService.transcribe(audioFile);

// オプションを指定した使用方法
const result = await whisperService.transcribe(audioFile, {
  chunkSize: 1024 * 1024, // 1MB
  model: 'large-v2',
  language: 'ja',
  task: 'transcribe'
});

// 進捗状況の監視
const result = await whisperService.transcribe(
  audioFile,
  undefined,
  (progress) => {
    console.log(`進捗: ${progress.percent}%`);
    console.log(`処理済み: ${progress.processed}バイト`);
    console.log(`残り時間: ${progress.estimatedTime}秒`);
  }
);

// キャンセル可能な処理
const controller = new AbortController();
try {
  const result = await whisperService.transcribe(
    audioFile,
    undefined,
    undefined,
    controller.signal
  );
} catch (error) {
  if (error instanceof AbortError) {
    console.log('処理がキャンセルされました');
  }
}
```

## 対応フォーマット

### 音声フォーマット
- WAV (PCM)
- MP3
- OGG
- M4A
- FLAC
- AAC

### 出力フォーマット
- プレーンテキスト
- SRT
- WebVTT
- JSON

## パフォーマンス最適化

### メモリ管理
- チャンク単位での処理
- 自動メモリ解放
- メモリ使用量の監視
- キャッシュの最適化

### 処理速度
- WebGPUによる並列処理
- バッチ処理の最適化
- 進捗状況の予測
- 処理時間の測定

## エラーハンドリング

### リトライ機能
- ネットワークエラーの自動リトライ
- バックオフ戦略の実装
- 最大リトライ回数の設定
- エラーログの記録

### エラー種別
- `NetworkError`: ネットワーク関連のエラー
- `ValidationError`: パラメータ検証エラー
- `TranscriptionError`: 文字起こし処理エラー
- `AbortError`: キャンセルによるエラー

## 注意事項

1. WebGPU対応環境では自動的にWebGPUを使用
2. WebGPU非対応環境ではHugging Face APIにフォールバック
3. APIキーが必要な場合は環境変数で設定
4. 大きなファイルは自動的にチャンク分割
5. メモリ使用量は自動的に最適化
6. 進捗状況は定期的に更新
7. キャンセル処理は即時反映 