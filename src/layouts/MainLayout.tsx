import React from 'react';
import { Header } from '@/components/Header';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-gradient)' }}>
      <Header />
      <main
        id="main-content"
        className="p-6 min-h-[calc(100vh-180px)]"
      >
        {children}
      </main>
    </div>
  );
};
