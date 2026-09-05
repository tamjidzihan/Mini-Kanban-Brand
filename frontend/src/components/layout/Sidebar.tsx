import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Plus, Kanban } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Board } from '../../types';

interface SidebarProps {
  boards?: Board[];
  onOpenCreateBoard?: () => void;
  activeBoardId?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  boards = [],
  onOpenCreateBoard,
  activeBoardId,
}) => {
  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hidden md:flex flex-col h-[calc(100vh-4rem)] sticky top-16">
      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        <nav className="space-y-1">
          <NavLink
            to="/"
            end
            className={({ isActive }: { isActive: boolean }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
              )
            }
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </NavLink>
        </nav>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Your Boards
            </span>
            {onOpenCreateBoard && (
              <button
                onClick={onOpenCreateBoard}
                className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                title="Create Board"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="space-y-1">
            {boards.length === 0 ? (
              <p className="px-3 text-xs text-slate-400 dark:text-slate-500 italic">No boards available</p>
            ) : (
              boards.map((b) => (
                <NavLink
                  key={b.id}
                  to={`/board/${b.id}`}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors truncate',
                    activeBoardId === b.id
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  )}
                >
                  <Kanban className="w-4 h-4 shrink-0" />
                  <span className="truncate">{b.title}</span>
                </NavLink>
              ))
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
