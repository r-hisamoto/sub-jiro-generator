import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Home,
  FileAudio,
  Settings,
  HelpCircle,
  Music,
  Video,
  Book
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation();

  const menuItems = [
    { href: '/', icon: Home, label: 'ホーム' },
    { href: '/transcribe', icon: FileAudio, label: '音声文字起こし' },
    { href: '/bgm', icon: Music, label: 'BGM管理' },
    { href: '/videos', icon: Video, label: '動画管理' },
    { href: '/dictionary', icon: Book, label: '辞書管理' },
    { href: '/settings', icon: Settings, label: '設定' },
    { href: '/help', icon: HelpCircle, label: 'ヘルプ' },
  ];

  return (
    <aside className={cn('w-64 bg-white border-r border-gray-200 h-screen', className)}>
      <nav className="p-4 space-y-2">
        {menuItems.map(({ href, icon: Icon, label }) => {
          const isActive = location.pathname === href;
          return (
            <Link
              key={href}
              to={href}
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors',
                isActive
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
} 