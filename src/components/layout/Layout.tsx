import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header className="fixed top-0 left-0 right-0 z-50" />
      <Sidebar />
      <main className="ml-64 pt-16 min-h-screen">
        <div className="container mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}; 