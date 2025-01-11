import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Home } from "@/pages/Home";
import { Layout } from "@/components/layout/Layout";
import { TranscriptionManager } from "@/components/TranscriptionManager";
import { BGMManager } from "@/components/BGMManager";
import { DictionaryManager } from "@/components/DictionaryManager";
import { Settings } from "@/pages/Settings";
import { Help } from "@/pages/Help";

export const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/transcribe" element={<TranscriptionManager />} />
          <Route path="/bgm" element={<BGMManager />} />
          <Route path="/videos" element={<TranscriptionManager mode="video" />} />
          <Route path="/dictionary" element={<DictionaryManager onClose={() => {}} onDictionaryUpdate={() => {}} />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/help" element={<Help />} />
        </Routes>
      </Layout>
    </Router>
  );
};