import React from 'react';

export const Help: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">ヘルプ</h1>
      <div className="space-y-6">
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">使い方ガイド</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">音声ファイルのアップロード</h3>
              <p className="text-gray-600">
                1. 「ファイルを選択」ボタンをクリックするか、ファイルをドラッグ＆ドロップします。<br />
                2. MP3、WAV形式の音声ファイル、またはMP4、WebM形式の動画ファイルをアップロードできます。<br />
                3. ファイルサイズは最大25MBまでです。
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">文字起こし</h3>
              <p className="text-gray-600">
                1. ファイルのアップロード後、自動的に文字起こしが開始されます。<br />
                2. 処理中はプログレスバーで進捗状況を確認できます。<br />
                3. 文字起こし完了後、テキストを編集することができます。
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}; 