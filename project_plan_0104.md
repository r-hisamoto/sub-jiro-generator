# 字幕生成ツール 未実装機能チェックリスト

## 3.1 コア機能で未実装のもの

### テキスト整形・日本語表現調整機能
- [x] 句読点の自動補完
  - [x] 基本的な句読点補完
  - [x] ポーズ情報を活用した補完
  - [x] 文法規則に基づく補完
  - [x] カスタマイズ可能な設定
- [x] 漢字/ひらがなの変換・最適化
  - [x] 形態素解析による読み方の判定
  - [x] 品詞に基づく変換対象の選択
  - [x] 固有名詞の保護
  - [x] カスタマイズ可能な設定
- [x] 敬体/常体の統一機能
  - [x] 文末表現の検出
  - [x] 敬体/常体の判定
  - [x] 一括変換機能
- [x] 敬語・口語での言い回し調整
  - [x] 敬語レベルの判定
  - [x] 言い回しの変換
  - [x] フォーマル度の調整

### 出力機能の一部
- [x] WebVTT形式のエクスポート
  - [x] 基本的なWebVTT形式の生成
  - [x] スタイル設定のサポート
  - [x] ファイルのエクスポート機能
- [x] 動画ファイルへの直接書き込み（バーナー機能）
  - [x] 字幕の動画への描画
  - [x] スタイル設定のカスタマイズ
  - [x] エンコード設定
- [x] 動画編集ソフト用フォーマットの書き出し
  - [x] Adobe Premiere Pro用XMLの生成
  - [x] Final Cut Pro用XMLの生成
  - [x] DaVinci Resolve用XMLの生成

## 3.2 補助機能で未実装のもの

### ~~話者分離（スピーカー識別）機能~~ (不要)
- ~~[ ] 複数話者の分離認識~~
- ~~[ ] 話者ごとのタグ付け~~

### キーワード辞書管理
- [x] 製品名や専門用語の辞書登録機能
- [x] 企業ごとのカスタム辞書対応

### 自動セグメント分割
- [x] 長い動画の章やトピックでの自動区切り
- [x] AIによる話題転換検知

### クラウド連携・チームコラボレーション機能
- [x] プロジェクトの共有設定
- [x] 複数人での同時編集
- [x] 変更履歴の管理
- [x] コメント・フィードバック機能

## その他の未実装機能

### ユーザビリティ関連
- [x] チュートリアル・ヘルプ機能
- [x] 波形表示機能
- [x] 高度な検索/置換機能
- [x] フォントや色の簡易設定機能
- [x] ショートカットキーのカスタマイズ
- [x] 字幕テンプレートの保存/読み込み

### 検索/編集支援機能
- [x] 誤変換キーワードのハイライト
- [x] 高度な検索/置換機能

### プレビュー機能の一部
- [ ] フォントや色の簡易設定機能

### セキュリティ機能の一部
- [x] RLSポリシーの詳細設定
  - [x] テーブルごとのアクセス制御
  - [x] ロールベースの権限管理
- [x] ストレージポリシーの詳細設定
  - [x] バケットごとのアクセス制御
  - [x] 期限付きURL生成
- [x] APIアクセス制御
  - [x] レート制限
  - [x] APIキー管理

### 基本機能
- [x] 字幕の追加・編集・削除
- [x] タイムコードの調整
- [x] 字幕の位置調整
- [x] 字幕のインポート/エクスポート
- [x] プロジェクトの保存/読み込み
- [x] 動画プレビュー
- [x] 音声認識による字幕生成
- [x] 敬体/常体の統一機能
- [x] 敬語・口語での言い回し調整
- [x] WebVTT形式のエクスポート
- [x] 動画ファイルへの直接書き込み（バーナー機能）
- [x] 動画編集ソフト用フォーマットの書き出し

### ユーザビリティ関連
- [x] チュートリアル・ヘルプ機能
- [x] 波形表示機能
- [x] 高度な検索/置換機能
- [x] フォントや色の簡易設定機能
- [x] ショートカットキーのカスタマイズ
- [x] 字幕テンプレートの保存/読み込み

### ~~話者分離（スピーカー識別）機能~~ (不要)
- ~~[ ] 複数話者の分離認識~~
- ~~[ ] 話者ごとのタグ付け~~

### クラウド連携・チームコラボレーション機能
- [x] プロジェクトの共有設定
- [x] 複数人での同時編集
- [x] 変更履歴の管理
- [x] コメント・フィードバック機能

### その他
- [x] ユーザー辞書機能
- [x] プラグイン機能
- [x] APIの提供 

## Supabase実装チェックリスト

### データベース関連
- [x] 字幕データ用のテーブル
  - [x] 字幕テキスト
  - [x] タイムコード
  - [x] スタイル設定
  - [x] メタデータ
- [x] プロジェクト管理用のテーブル
  - [x] プロジェクト基本情報
  - [x] メンバー管理
  - [x] 設定情報
- [x] コラボレーション用のテーブル
  - [x] 編集履歴
  - [x] コメント
  - [x] 通知
- [x] バージョン管理用のテーブル
  - [x] バージョン情報
  - [x] 差分データ
  - [x] ロールバックポイント

### ストレージ関連
- [x] 字幕ファイル用のバケット
  - [x] アクセス権限設定
  - [x] ライフサイクル管理
- [x] エクスポートファイル用のバケット
  - [x] 一時保存設定
  - [x] 自動削除ルール
- [x] 一時的な作業ファイル用のバケット
  - [x] クリーンアップポリシー
  - [x] 容量制限設定

### Edge Functions
- [x] 字幕生成処理
  - [x] 音声認識連携
  - [x] テキスト整形
- [x] 字幕同期処理
  - [x] タイムコード調整
  - [x] 波形解析
- [x] ファイルエクスポート処理
  - [x] 各種フォーマット変換
  - [x] 圧縮処理
- [x] バッチ処理
  - [x] 定期クリーンアップ
  - [x] 統計情報収集

### セキュリティ関連
- [x] RLSポリシーの詳細設定
  - [x] テーブルごとのアクセス制御
  - [x] ロールベースの権限管理
- [x] ストレージポリシーの詳細設定
  - [x] バケットごとのアクセス制御
  - [x] 期限付きURL生成
- [x] APIアクセス制御
  - [x] レート制限
  - [x] APIキー管理

### バックアップ関連
- [x] 定期バックアップ設定
  - [x] データベースバックアップ
  - [x] ストレージバックアップ
- [x] リストア手順
  - [x] 障害復旧手順
  - [x] データ整合性チェック 