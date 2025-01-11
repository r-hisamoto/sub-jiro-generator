import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { TranscriptionManager } from "@/components/TranscriptionManager";
import { BGMManager } from "@/components/BGMManager";
import { DictionaryManager } from "@/components/DictionaryManager";

// ダミーデータの作成
const dummyTracks = [];
const dummyBGMProps = {
  tracks: dummyTracks,
  onTracksChange: () => {},
  totalDuration: 0,
  isPlaying: false,
  currentTime: 0,
  onPlayPause: () => {},
  onSeek: () => {}
};

const dummyDictionaryProps = {
  onClose: () => {},
  onDictionaryUpdate: () => {}
};

// 簡易的なページコンポーネント
const Settings: React.FC = () => (
  <div className="container mx-auto p-6">
    <h1 className="text-2xl font-bold mb-6">設定</h1>
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">API設定</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">OpenAI APIキー</label>
          <input
            type="password"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            value={process.env.NEXT_PUBLIC_OPENAI_API_KEY || ''}
            disabled
          />
        </div>
      </div>
    </div>
  </div>
);

const Help: React.FC = () => (
  <div className="container mx-auto p-6">
    <h1 className="text-2xl font-bold mb-6">ヘルプ</h1>
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">使い方ガイド</h2>
      <div className="space-y-4">
        <p>音声ファイルをアップロードして、自動で文字起こしを行います。</p>
        <p>対応ファイル形式: MP3, WAV, MP4, WebM</p>
        <p>最大ファイルサイズ: 25MB</p>
      </div>
    </div>
  </div>
);

export const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<TranscriptionManager />} />
          <Route path="/transcribe" element={<TranscriptionManager />} />
          <Route path="/bgm" element={<BGMManager {...dummyBGMProps} />} />
          <Route path="/dictionary" element={<DictionaryManager {...dummyDictionaryProps} />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/help" element={<Help />} />
        </Routes>
      </Layout>
    </Router>
  );
};