import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  Plus,
  Kanban,
  FolderKanban,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { Board } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';

export interface SidebarProps {
  boards?: Board[];
  onOpenCreateBoard?: () => void;
  activeBoardId?: string;
  isCollapsed?: boolean;
  onCloseMobileNav?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  boards = [],
  onOpenCreateBoard,
  activeBoardId,
  isCollapsed = false,
  onCloseMobileNav,
}) => {
  const { user, logout } = useAuth();

  const handleLinkClick = () => {
    if (onCloseMobileNav) {
      onCloseMobileNav();
    }
  };

  return (
    <aside
      className={cn(
        'border-r border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900',
        'flex flex-col h-full transition-all duration-200 select-none',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Brand Header (§11) */}
      <div className="h-16 px-4 border-b border-gray-200/80 dark:border-gray-800 flex items-center justify-between shrink-0">
        <Link
          to="/"
          onClick={handleLinkClick}
          className="flex items-center gap-2.5 overflow-hidden group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-soft transition-transform group-hover:scale-105">
            <Kanban className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-1.5 truncate">
                Mini Kanban
                <Sparkles className="w-3 h-3 text-emerald-500 fill-emerald-500" />
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                Project Workspaces
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Scrollable Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {/* Main Section */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
              Overview
            </div>
          )}
          <NavLink
            to="/"
            end
            onClick={handleLinkClick}
            className={({ isActive }) =>
              cn(
                'relative flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-xl transition-all duration-150',
                isActive
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-slate-200'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-emerald-500 rounded-r"
                    aria-hidden="true"
                  />
                )}
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span className="truncate">Dashboard</span>}
              </>
            )}
          </NavLink>

          <NavLink
            to="/profile"
            onClick={handleLinkClick}
            className={({ isActive }) =>
              cn(
                'relative flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-xl transition-all duration-150',
                isActive
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-slate-200'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-emerald-500 rounded-r"
                    aria-hidden="true"
                  />
                )}
                <User className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span className="truncate">Profile Settings</span>}
              </>
            )}
          </NavLink>
        </div>

        {/* Boards Section */}
        <div className="space-y-1 pt-2">
          {!isCollapsed && (
            <div className="flex items-center justify-between px-3 pb-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
                Workspaces ({boards.length})
              </span>
              {onOpenCreateBoard && (
                <button
                  type="button"
                  onClick={onOpenCreateBoard}
                  aria-label="Create Board"
                  className="p-1 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          <div className="space-y-0.5">
            {boards.length === 0 ? (
              !isCollapsed ? (
                <p className="px-3 py-2 text-xs text-slate-400 italic">No boards yet</p>
              ) : null
            ) : (
              boards.map((b) => {
                const isActive = activeBoardId === b.id;
                return (
                  <NavLink
                    key={b.id}
                    to={`/board/${b.id}`}
                    onClick={handleLinkClick}
                    title={b.title}
                    className={cn(
                      'relative flex items-center gap-3 px-3 py-2 text-xs rounded-xl transition-all duration-150 truncate',
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 font-semibold shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-slate-200'
                    )}
                  >
                    {isActive && (
                      <span
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-emerald-500 rounded-r"
                        aria-hidden="true"
                      />
                    )}
                    <FolderKanban className="w-4 h-4 shrink-0" />
                    {!isCollapsed && <span className="truncate">{b.title}</span>}
                  </NavLink>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Pinned User Chip at Bottom (§11.1) */}
      {user && (
        <div className="p-3 border-t border-gray-200/80 dark:border-gray-800 shrink-0">
          <div
            className={cn(
              'flex items-center gap-2.5 p-2 rounded-xl',
              'bg-slate-50/80 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60',
              isCollapsed && 'justify-center p-1.5'
            )}
          >
            <Avatar name={user.name} src={user.avatarUrl} size="sm" isOnline />
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {user.name}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {user.email}
                </p>
              </div>
            )}
            {!isCollapsed && (
              <button
                type="button"
                onClick={logout}
                title="Logout"
                aria-label="Logout"
                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
