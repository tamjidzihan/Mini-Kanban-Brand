import React, { useState, useEffect } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { GlobalSearch } from '../ui/GlobalSearch';
import { ShortcutsModal } from '../ui/ShortcutsModal';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useTheme } from '../../context/ThemeContext';
import { Board } from '../../types';
import { Plus, Kanban, Search, WifiOff, X } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface PageLayoutProps {
  children: React.ReactNode;
  boards?: Board[];
  onOpenCreateBoard?: () => void;
  activeBoardId?: string;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  boards = [],
  onOpenCreateBoard,
  activeBoardId,
}) => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const { toggleTheme } = useTheme();
  const isOnline = useOnlineStatus();

  // Persisted desktop sidebar collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('app-sidebar-collapsed') === 'true';
  });

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('app-sidebar-collapsed', String(next));
      return next;
    });
  };

  // Keyboard shortcuts integration (§18)
  useKeyboardShortcuts({
    onSearch: () => setIsSearchOpen(true),
    onNew: () => onOpenCreateBoard?.(),
    onToggleTheme: () => toggleTheme(),
    onHelp: () => setIsShortcutsOpen(true),
    onEscape: () => {
      setIsSearchOpen(false);
      setIsShortcutsOpen(false);
      setIsMobileNavOpen(false);
      setIsFabOpen(false);
    },
  });

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-gray-50 dark:bg-gray-950 text-slate-900 dark:text-slate-100">
      {/* Offline Banner (§11.3) */}
      {!isOnline && (
        <div className="bg-amber-500 text-slate-950 px-4 py-1 text-xs font-semibold flex items-center justify-center gap-2 z-50 shrink-0">
          <WifiOff className="w-3.5 h-3.5" />
          <span>You are currently offline. Changes will sync once reconnected.</span>
        </div>
      )}

      {/* Topbar */}
      <Navbar
        onOpenMobileNav={() => setIsMobileNavOpen(true)}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={handleToggleSidebar}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenCreateBoard={() => onOpenCreateBoard?.()}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex shrink-0">
          <Sidebar
            boards={boards}
            onOpenCreateBoard={onOpenCreateBoard}
            activeBoardId={activeBoardId}
            isCollapsed={isSidebarCollapsed}
          />
        </div>

        {/* Mobile Sidebar Drawer (§11.3) */}
        {isMobileNavOpen && (
          <div className="fixed inset-0 z-[80] md:hidden flex">
            {/* Scrim */}
            <div
              className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm transition-opacity"
              onClick={() => setIsMobileNavOpen(false)}
            />
            {/* Drawer Panel */}
            <div className="relative w-72 max-w-[85vw] bg-white dark:bg-gray-900 h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
              <Sidebar
                boards={boards}
                onOpenCreateBoard={() => {
                  setIsMobileNavOpen(false);
                  onOpenCreateBoard?.();
                }}
                activeBoardId={activeBoardId}
                isCollapsed={false}
                onCloseMobileNav={() => setIsMobileNavOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1400px] mx-auto w-full">{children}</div>
        </main>
      </div>

      {/* Mobile Floating Action Button (FAB) (§11.3) */}
      {onOpenCreateBoard && (
        <div className="fixed bottom-6 right-6 z-40 md:hidden flex flex-col items-end gap-2.5">
          {/* Speed-dial options */}
          {isFabOpen && (
            <div className="flex flex-col items-end gap-2 animate-in fade-in slide-in-from-bottom-3 duration-150">
              <button
                type="button"
                onClick={() => {
                  setIsFabOpen(false);
                  setIsSearchOpen(true);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-gray-800 text-slate-700 dark:text-slate-200 shadow-dropdown border border-gray-200 dark:border-gray-700 text-xs font-semibold"
              >
                <span>Search</span>
                <Search className="w-3.5 h-3.5 text-emerald-600" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsFabOpen(false);
                  onOpenCreateBoard();
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-gray-800 text-slate-700 dark:text-slate-200 shadow-dropdown border border-gray-200 dark:border-gray-700 text-xs font-semibold"
              >
                <span>New Board</span>
                <Kanban className="w-3.5 h-3.5 text-emerald-600" />
              </button>
            </div>
          )}

          {/* Main FAB circle */}
          <button
            type="button"
            onClick={() => setIsFabOpen(!isFabOpen)}
            aria-label="Quick Actions Menu"
            className={cn(
              'w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-glow active:scale-95 transition-all',
              isFabOpen && 'bg-slate-800 dark:bg-gray-700 rotate-45'
            )}
          >
            <Plus className="w-6 h-6 transition-transform" />
          </button>
        </div>
      )}

      {/* Global Search Modal (⌘K) */}
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Keyboard Shortcuts Modal (?) */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
};
