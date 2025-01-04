# API ドキュメント

## 目次

1. [概要](#概要)
2. [認証](#認証)
3. [エンドポイント](#エンドポイント)
4. [WebGPU API](#webgpu-api)
5. [Whisper API](#whisper-api)
6. [エラーハンドリング](#エラーハンドリング)
7. [レート制限](#レート制限)

## 概要

Sub Jiro GeneratorのAPIは、音声認識、字幕生成、WebGPU処理を提供するRESTful APIです。

### ベースURL

```
https://api.sub-jiro-generator.com/v1
```

### リクエストフォーマット

- Content-Type: `application/json`
- 認証ヘッダー: `Authorization: Bearer <API_KEY>`

### レスポンスフォーマット

```json
{
  "success": true,
  "data": {
    // レスポンスデータ
  },
  "error": null
}
```

## 認証

### APIキーの取得

1. [開発者ポータル](https://developer.sub-jiro-generator.com)にアクセス
2. アカウントを作成
3. 新しいAPIキーを生成

### 認証ヘッダー

```bash
curl -H "Authorization: Bearer your-api-key" \
  https://api.sub-jiro-generator.com/v1/transcribe
```

## エンドポイント

### 音声認識

#### 音声ファイルから字幕を生成

```http
POST /transcribe
Content-Type: multipart/form-data
```

**パラメータ**

| 名前 | 型 | 必須 | 説明 |
|------|------|---------|-------------|
| file | File | はい | 音声ファイル (MP3, WAV, M4A) |
| language | string | いいえ | 言語コード (デフォルト: "ja") |
| model | string | いいえ | モデル名 (デフォルト: "whisper-1") |

**リクエスト例**

```bash
curl -X POST \
  -H "Authorization: Bearer your-api-key" \
  -F "file=@audio.mp3" \
  -F "language=ja" \
  https://api.sub-jiro-generator.com/v1/transcribe
```

**レスポンス例**

```json
{
  "success": true,
  "data": {
    "id": "trans_123abc",
    "text": "こんにちは、世界",
    "segments": [
      {
        "start": 0,
        "end": 2.5,
        "text": "こんにちは、"
      },
      {
        "start": 2.5,
        "end": 4.0,
        "text": "世界"
      }
    ]
  }
}
```

#### 字幕生成状態の取得

```http
GET /transcribe/{id}
```

**パラメータ**

| 名前 | 型 | 必須 | 説明 |
|------|------|---------|-------------|
| id | string | はい | 字幕生成ID |

**リクエスト例**

```bash
curl -H "Authorization: Bearer your-api-key" \
  https://api.sub-jiro-generator.com/v1/transcribe/trans_123abc
```

**レスポンス例**

```json
{
  "success": true,
  "data": {
    "id": "trans_123abc",
    "status": "completed",
    "progress": 100,
    "text": "こんにちは、世界",
    "segments": [
      {
        "start": 0,
        "end": 2.5,
        "text": "こんにちは、"
      },
      {
        "start": 2.5,
        "end": 4.0,
        "text": "世界"
      }
    ]
  }
}
```

### 字幕編集

#### 字幕の更新

```http
PUT /subtitles/{id}
Content-Type: application/json
```

**パラメータ**

| 名前 | 型 | 必須 | 説明 |
|------|------|---------|-------------|
| segments | array | はい | 字幕セグメントの配列 |

**リクエスト例**

```bash
curl -X PUT \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "segments": [
      {
        "start": 0,
        "end": 2.5,
        "text": "こんにちは、"
      },
      {
        "start": 2.5,
        "end": 4.0,
        "text": "世界！"
      }
    ]
  }' \
  https://api.sub-jiro-generator.com/v1/subtitles/sub_123abc
```

**レスポンス例**

```json
{
  "success": true,
  "data": {
    "id": "sub_123abc",
    "segments": [
      {
        "start": 0,
        "end": 2.5,
        "text": "こんにちは、"
      },
      {
        "start": 2.5,
        "end": 4.0,
        "text": "世界！"
      }
    ]
  }
}
```

## WebGPU API

### シェーダー実行

```http
POST /webgpu/compute
Content-Type: application/json
```

**パラメータ**

| 名前 | 型 | 必須 | 説明 |
|------|------|---------|-------------|
| shader | string | はい | WGSLシェーダーコード |
| input | array | はい | 入力データ配列 |
| workgroupSize | number | いいえ | ワークグループサイズ |

**リクエスト例**

```bash
curl -X POST \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "shader": "@compute @workgroup_size(64) fn main(...) { ... }",
    "input": [1, 2, 3, 4],
    "workgroupSize": 64
  }' \
  https://api.sub-jiro-generator.com/v1/webgpu/compute
```

**レスポンス例**

```json
{
  "success": true,
  "data": {
    "output": [2, 4, 6, 8],
    "executionTime": 0.15
  }
}
```

## Whisper API

### モデル情報の取得

```http
GET /whisper/models
```

**リクエスト例**

```bash
curl -H "Authorization: Bearer your-api-key" \
  https://api.sub-jiro-generator.com/v1/whisper/models
```

**レスポンス例**

```json
{
  "success": true,
  "data": {
    "models": [
      {
        "id": "whisper-1",
        "name": "Whisper v1",
        "description": "汎用音声認識モデル",
        "languages": ["ja", "en", "zh", "ko"]
      }
    ]
  }
}
```

## エラーハンドリング

### エラーレスポンスフォーマット

```json
{
  "success": false,
  "error": {
    "code": "error_code",
    "message": "エラーメッセージ",
    "details": {
      // 追加のエラー情報
    }
  }
}
```

### エラーコード

| コード | 説明 | HTTPステータス |
|--------|------|----------------|
| invalid_request | リクエストが無効 | 400 |
| unauthorized | 認証エラー | 401 |
| forbidden | 権限エラー | 403 |
| not_found | リソースが見つからない | 404 |
| rate_limit | レート制限超過 | 429 |
| server_error | サーバーエラー | 500 |

### エラー例

```json
{
  "success": false,
  "error": {
    "code": "rate_limit",
    "message": "APIリクエスト制限を超過しました",
    "details": {
      "limit": 100,
      "remaining": 0,
      "reset": 1635724800
    }
  }
}
```

## レート制限

### 制限値

| プラン | リクエスト/分 | リクエスト/日 |
|--------|--------------|---------------|
| Free | 10 | 1,000 |
| Pro | 60 | 10,000 |
| Enterprise | カスタム | カスタム |

### レート制限ヘッダー

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1635724800
```

### 制限超過時の対応

1. バックオフ戦略の実装
```typescript
async function retryWithBackoff(
  fn: () => Promise<any>,
  maxRetries: number = 3
): Promise<any> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.code === 'rate_limit') {
        const waitTime = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}
```

2. キューイングの実装
```typescript
class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;

  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }

  private async process() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const request = this.queue.shift();
      if (request) {
        await request();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    this.processing = false;
  }
}
```

## WebSocket API

### リアルタイム字幕生成

```typescript
const ws = new WebSocket('wss://api.sub-jiro-generator.com/v1/ws/transcribe');

ws.onopen = () => {
  console.log('接続確立');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('字幕:', data.text);
};

// 音声データの送信
ws.send(JSON.stringify({
  type: 'audio',
  data: audioData
}));
```

### WebSocket メッセージ形式

**クライアントからサーバーへ**

```json
{
  "type": "audio",
  "data": "base64_encoded_audio_data"
}
```

**サーバーからクライアントへ**

```json
{
  "type": "transcription",
  "data": {
    "text": "こんにちは",
    "isFinal": false,
    "confidence": 0.95
  }
}
```

## SDKとライブラリ

### 公式SDKs

- [JavaScript/TypeScript](https://github.com/sub-jiro-generator/sdk-js)
- [Python](https://github.com/sub-jiro-generator/sdk-python)
- [Ruby](https://github.com/sub-jiro-generator/sdk-ruby)

### SDK使用例（TypeScript）

```typescript
import { SubJiroClient } from '@sub-jiro/sdk';

const client = new SubJiroClient('your-api-key');

// 字幕生成
const transcription = await client.transcribe({
  file: audioFile,
  language: 'ja'
});

// WebGPU処理
const result = await client.webgpu.compute({
  shader: shaderCode,
  input: inputData
});

// WebSocket接続
const ws = client.createWebSocket();
ws.on('transcription', (data) => {
  console.log('リアルタイム字幕:', data.text);
});
```

## バージョニング

APIはセマンティックバージョニングに従います：

- メジャーバージョン: 破壊的変更
- マイナーバージョン: 後方互換性のある機能追加
- パッチバージョン: バグ修正

### バージョン指定

```http
GET /v1/transcribe
GET /v2/transcribe
```

## 変更履歴

### v1.1.0 (2024-01-15)

- WebSocket APIのサポート追加
- 新しい言語モデルの追加
- パフォーマンスの改善

### v1.0.0 (2023-12-01)

- 初期リリース
- 基本的な字幕生成機能
- WebGPU処理のサポート 