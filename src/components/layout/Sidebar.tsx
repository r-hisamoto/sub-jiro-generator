import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FileAudio, Music, Video, Book, Settings, HelpCircle } from 'lucide-react';

const menuItems = [
  { icon: Home, label: 'ホーム', href: '/' },
  { icon: FileAudio, label: '音声文字起こし', href: '/transcribe' },
  { icon: Music, label: 'BGM管理', href: '/bgm' },
  { icon: Video, label: '動画管理', href: '/videos' },
  { icon: Book, label: '辞書管理', href: '/dictionary' },
  { icon: Settings, label: '設定', href: '/settings' },
  { icon: HelpCircle, label: 'ヘルプ', href: '/help' }
];

export const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 overflow-y-auto">
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map(({ icon: Icon, label, href }) => {
            const isActive = location.pathname === href;
            return (
              <li key={href}>
                <Link
                  to={href}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}; 