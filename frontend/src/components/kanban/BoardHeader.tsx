import React from 'react';
import { Board, Role, User } from '../../types';
import { RoleBadge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Plus, UserPlus, Settings, Trash2, Search } from 'lucide-react';

interface BoardHeaderProps {
  board: Board;
  currentRole: Role;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenShareModal: () => void;
  onOpenAddColumn: () => void;
  onOpenBoardSettings: () => void;
  onDeleteBoard: () => void;
  usersInBoard: User[];
}

export const BoardHeader: React.FC<BoardHeaderProps> = ({
  board,
  currentRole,
  searchQuery,
  onSearchChange,
  onOpenShareModal,
  onOpenAddColumn,
  onOpenBoardSettings,
  onDeleteBoard,
  usersInBoard,
}) => {
  const canEdit = currentRole === 'OWNER' || currentRole === 'EDITOR';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-subtle flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            {board.title}
          </h1>
          <RoleBadge role={currentRole} />
        </div>
        {board.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400">{board.description}</p>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative w-full sm:w-44">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center -space-x-2">
          {usersInBoard.slice(0, 4).map((u) => (
            <Avatar key={u.id} name={u.name} src={u.avatarUrl} size="sm" className="ring-2 ring-white dark:ring-slate-900" />
          ))}
        </div>

        <Button variant="outline" size="sm" onClick={onOpenShareModal} leftIcon={<UserPlus className="w-4 h-4" />}>
          Members
        </Button>

        {canEdit && (
          <Button size="sm" onClick={onOpenAddColumn} leftIcon={<Plus className="w-4 h-4" />}>
            Add Column
          </Button>
        )}

        {currentRole === 'OWNER' && (
          <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2">
            <button
              onClick={onOpenBoardSettings}
              className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Board Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onDeleteBoard}
              className="p-2 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-slate-800"
              title="Delete Board"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
