import React from 'react';
import { cn } from '@/lib/utils';
import {
  Home,
  Video,
  Music,
  Settings,
  Users,
  HelpCircle,
  FileText,
  Sliders
} from 'lucide-react';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface SidebarProps {
  className?: string;
}

interface SidebarItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

const sidebarItems: SidebarItem[] = [
  { icon: Home, label: 'ホーム', href: '/' },
  { icon: Video, label: '動画編集', href: '/video' },
  { icon: Music, label: 'BGM管理', href: '/bgm' },
  { icon: FileText, label: '字幕編集', href: '/subtitles' },
  { icon: Sliders, label: 'エフェクト', href: '/effects' },
  { icon: Users, label: 'チーム', href: '/team' },
  { icon: Settings, label: '設定', href: '/settings' },
  { icon: HelpCircle, label: 'ヘルプ', href: '/help' },
];

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const router = useRouter();

  return (
    <div className={cn(
      'w-64 h-screen bg-gray-900 text-white p-4 flex flex-col fixed left-0 top-0',
      className
    )}>
      <div className="mb-8 px-4">
        <h1 className="text-xl font-bold">Sub Jiro</h1>
      </div>

      <nav className="flex-1">
        <ul className="space-y-2">
          {sidebarItems.map((item) => {
            const isActive = router.pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors',
                    isActive
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto px-4 py-4 border-t border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gray-700" />
          <div>
            <p className="text-sm font-medium">ユーザー名</p>
            <p className="text-xs text-gray-400">ユーザーID</p>
          </div>
        </div>
      </div>
    </div>
  );
}; 