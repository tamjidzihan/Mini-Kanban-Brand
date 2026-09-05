import React from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Board } from '../../types';

interface PageLayoutProps {
  children: React.ReactNode;
  boards?: Board[];
  onOpenCreateBoard?: () => void;
  activeBoardId?: string;
  showSidebar?: boolean;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  boards,
  onOpenCreateBoard,
  activeBoardId,
  showSidebar = true,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        {showSidebar && (
          <Sidebar
            boards={boards}
            onOpenCreateBoard={onOpenCreateBoard}
            activeBoardId={activeBoardId}
          />
        )}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
