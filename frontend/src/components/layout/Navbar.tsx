import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Avatar } from '../ui/Avatar';
import { NotificationBell } from '../notifications/NotificationBell';
import {
  Sun,
  Moon,
  Menu,
  PanelLeftClose,
  PanelLeft,
  Search,
  Plus,
  LogOut,
  User as UserIcon,
  Kanban,
  CheckSquare,
  UserPlus,
  Laptop,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { useClickOutside } from '../../hooks/useClickOutside';

export interface NavbarProps {
  onOpenMobileNav: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenSearch: () => void;
  onOpenCreateBoard: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenMobileNav,
  isSidebarCollapsed,
  onToggleSidebar,
  onOpenSearch,
  onOpenCreateBoard,
}) => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const quickAddRef = useClickOutside<HTMLDivElement>(() => setIsQuickAddOpen(false), isQuickAddOpen);
  const profileMenuRef = useClickOutside<HTMLDivElement>(() => setIsProfileMenuOpen(false), isProfileMenuOpen);

  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const shortcutKey = isMac ? '⌘K' : 'Ctrl+K';

  // Today's formatted date
  const todayStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  const handleThemeToggle = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-gray-200/80 bg-white/85 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/85 px-4 sm:px-6 flex items-center justify-between transition-colors">
      {/* Left side: Mobile Hamburger / Desktop Collapse / Brand on Mobile */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger */}
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open mobile navigation"
          className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop Sidebar Toggle */}
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden md:flex p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-gray-800 transition-colors"
        >
          {isSidebarCollapsed ? (
            <PanelLeft className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>

        {/* Global Search Input Button (§11.2) */}
        <button
          type="button"
          onClick={onOpenSearch}
          className={cn(
            'flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl border text-xs',
            'bg-slate-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700/80',
            'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:border-gray-300 dark:hover:border-gray-600',
            'transition-all duration-150 w-36 sm:w-56 focus:w-72'
          )}
        >
          <span className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Search workspace...</span>
          </span>
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold font-mono rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-slate-500 dark:text-slate-300 shadow-sm">
            {shortcutKey}
          </kbd>
        </button>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Today's Date */}
        <span className="hidden lg:inline-block text-xs font-medium text-slate-500 dark:text-slate-400 px-2 py-1 rounded-md bg-slate-100/70 dark:bg-gray-800/50">
          {todayStr}
        </span>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={handleThemeToggle}
          aria-label={`Theme: ${theme}`}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-gray-800 transition-colors"
          title={`Theme: ${theme} (Click to change)`}
        >
          {theme === 'light' ? (
            <Sun className="w-4 h-4 text-amber-500" />
          ) : theme === 'dark' ? (
            <Moon className="w-4 h-4 text-sky-400" />
          ) : (
            <Laptop className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {/* Notifications Bell */}
        {user && <NotificationBell />}

        {/* Quick Add '+' Primary Dropdown (§11.2) */}
        {user && (
          <div ref={quickAddRef} className="relative">
            <button
              type="button"
              onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
              aria-label="Quick actions"
              className={cn(
                'inline-flex items-center justify-center p-2 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold gap-1.5 transition-all shadow-sm',
                'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[.98]'
              )}
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">New</span>
            </button>

            {isQuickAddOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-dropdown p-1.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Quick Actions
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsQuickAddOpen(false);
                    onOpenCreateBoard();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Kanban className="w-3.5 h-3.5" />
                  </div>
                  <span>Create Board</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsQuickAddOpen(false);
                    onOpenSearch();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="w-6 h-6 rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400 flex items-center justify-center shrink-0">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                  <span>Search Tasks</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Profile Avatar Menu */}
        {user && (
          <div ref={profileMenuRef} className="relative pl-1">
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-2 rounded-full hover:ring-2 hover:ring-emerald-500/40 transition-all"
              aria-label="User menu"
            >
              <Avatar name={user.name} src={user.avatarUrl} size="sm" isOnline />
            </button>

            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-dropdown p-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {user.name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {user.email}
                  </p>
                </div>

                <div className="py-1">
                  <Link
                    to="/profile"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    <span>Profile Settings</span>
                  </Link>
                </div>

                <div className="pt-1 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
