import React from 'react';
import { Bell, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({ className }) => {
  return (
    <header className={cn(
      'h-16 px-6 border-b border-gray-200 flex items-center justify-between bg-white',
      className
    )}>
      <div className="flex items-center flex-1">
        <div className="relative max-w-md w-full">
          <input
            type="text"
            placeholder="検索..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <div className="h-8 w-px bg-gray-200"></div>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gray-200"></div>
          <div>
            <p className="text-sm font-medium">ユーザー名</p>
            <p className="text-xs text-gray-500">プロジェクト管理者</p>
          </div>
        </div>
      </div>
    </header>
  );
}; 