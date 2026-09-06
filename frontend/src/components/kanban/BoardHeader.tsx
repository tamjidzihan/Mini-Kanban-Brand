import React, { useState } from 'react';
import { Board, Role, User } from '../../types';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Tabs, TabOption } from '../ui/Tabs';
import { getRoleColor } from '../../lib/colors';
import {
  Plus,
  UserPlus,
  Settings,
  Trash2,
  Search,
  Kanban as KanbanIcon,
  List as ListIcon,
  BarChart3,
  Calendar as CalendarIcon,
  Filter,
  Download,
  ChevronRight,
  MoreVertical,
  Pencil,
  X,
  LogOut,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { useClickOutside } from '../../hooks/useClickOutside';

export type ViewMode = 'kanban' | 'list' | 'analytics' | 'calendar';

export interface BoardHeaderProps {
  board: Board;
  currentRole: Role;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (p: string) => void;
  dueFilter: string;
  onDueFilterChange: (d: string) => void;
  assigneeFilter: string;
  onAssigneeFilterChange: (a: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
  onOpenShareModal: () => void;
  onOpenAddColumn: () => void;
  onOpenBoardSettings: () => void;
  onDeleteBoard: () => void;
  onLeaveBoard?: () => void;
  onExportBoard?: () => void;
  usersInBoard: User[];
}

export const BoardHeader: React.FC<BoardHeaderProps> = ({
  board,
  currentRole,
  searchQuery,
  onSearchChange,
  priorityFilter,
  onPriorityFilterChange,
  dueFilter,
  onDueFilterChange,
  assigneeFilter,
  onAssigneeFilterChange,
  viewMode,
  onViewModeChange,
  onOpenShareModal,
  onOpenAddColumn,
  onOpenBoardSettings,
  onDeleteBoard,
  onLeaveBoard,
  onExportBoard,
  usersInBoard,
}) => {
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const canEdit = currentRole === 'OWNER' || currentRole === 'EDITOR';

  const settingsMenuRef = useClickOutside<HTMLDivElement>(
    () => setShowSettingsMenu(false),
    showSettingsMenu
  );

  const viewOptions: TabOption<ViewMode>[] = [
    { id: 'kanban', label: 'Board', icon: <KanbanIcon className="w-3.5 h-3.5" /> },
    { id: 'list', label: 'List', icon: <ListIcon className="w-3.5 h-3.5" /> },
    { id: 'calendar', label: 'Calendar', icon: <CalendarIcon className="w-3.5 h-3.5" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-3.5 h-3.5" /> },
  ];

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    priorityFilter !== 'ALL' ||
    dueFilter !== 'ALL' ||
    assigneeFilter !== 'ALL';

  const clearFilters = () => {
    onSearchChange('');
    onPriorityFilterChange('ALL');
    onDueFilterChange('ALL');
    onAssigneeFilterChange('ALL');
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <Link to="/" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
          Workspaces
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-xs">
          {board.title}
        </span>
      </div>

      {/* Main Board Header Card */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl p-4 sm:p-5 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left info */}
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate">
              {board.title}
            </h1>
            <Badge variant={getRoleColor(currentRole) as any}>{currentRole}</Badge>
          </div>
          {board.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 max-w-2xl">
              {board.description}
            </p>
          )}
        </div>

        {/* Right action controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Members Avatar Stack */}
          <div
            onClick={onOpenShareModal}
            className="flex items-center -space-x-2 cursor-pointer hover:opacity-90 transition-opacity"
            title="Manage board members"
          >
            {usersInBoard.slice(0, 4).map((u) => (
              <Avatar
                key={u.id}
                name={u.name}
                src={u.avatarUrl}
                size="sm"
                className="ring-2 ring-white dark:ring-gray-900"
              />
            ))}
            {usersInBoard.length > 4 && (
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-300 ring-2 ring-white dark:ring-gray-900 text-xs font-semibold flex items-center justify-center">
                +{usersInBoard.length - 4}
              </div>
            )}
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={onOpenShareModal}
            leftIcon={<UserPlus className="w-3.5 h-3.5 text-emerald-600" />}
          >
            Members
          </Button>

          {canEdit && (
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenAddColumn}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Column
            </Button>
          )}

          {/* Board Settings & Options Dropdown */}
          <div ref={settingsMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              aria-label="Board settings menu"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showSettingsMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl shadow-dropdown py-1.5 z-40 animate-in fade-in zoom-in-95 text-xs">
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowSettingsMenu(false);
                      onOpenBoardSettings();
                    }}
                    className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-800 flex items-center gap-2"
                  >
                    <Pencil className="w-3.5 h-3.5 text-slate-400" />
                    <span>Edit Board Details</span>
                  </button>
                )}

                {onExportBoard && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowSettingsMenu(false);
                      onExportBoard();
                    }}
                    className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-800 flex items-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                    <span>Export Board (JSON)</span>
                  </button>
                )}

                {currentRole === 'OWNER' ? (
                  <div className="pt-1 mt-1 border-t border-gray-100 dark:border-gray-800">
                    <button
                      type="button"
                      onClick={() => {
                        setShowSettingsMenu(false);
                        onDeleteBoard();
                      }}
                      className="w-full text-left px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Board</span>
                    </button>
                  </div>
                ) : (
                  onLeaveBoard && (
                    <div className="pt-1 mt-1 border-t border-gray-100 dark:border-gray-800">
                      <button
                        type="button"
                        onClick={() => {
                          setShowSettingsMenu(false);
                          onLeaveBoard();
                        }}
                        className="w-full text-left px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Leave Workspace</span>
                      </button>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar Row: View Switcher Tabs + Search & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* View Switcher Tabs */}
        <Tabs options={viewOptions} value={viewMode} onChange={onViewModeChange} />

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative w-full sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter tasks..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors',
              showFilters || hasActiveFilters
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            )}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            )}
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              <X className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Expanded Filter Drawer Strip */}
      {showFilters && (
        <div className="p-3.5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-soft flex items-center gap-4 flex-wrap animate-in fade-in slide-in-from-top-2">
          {/* Priority filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => onPriorityFilterChange(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-gray-800 text-slate-800 dark:text-slate-200 border border-gray-200 dark:border-gray-700 rounded-lg py-1 px-2.5 outline-none focus:ring-2 focus:ring-emerald-500/40 dark:[color-scheme:dark] [&>option]:bg-white [&>option]:text-slate-900 [&>option]:dark:bg-gray-800 [&>option]:dark:text-slate-100"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Due date filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Due Date:</span>
            <select
              value={dueFilter}
              onChange={(e) => onDueFilterChange(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-gray-800 text-slate-800 dark:text-slate-200 border border-gray-200 dark:border-gray-700 rounded-lg py-1 px-2.5 outline-none focus:ring-2 focus:ring-emerald-500/40 dark:[color-scheme:dark] [&>option]:bg-white [&>option]:text-slate-900 [&>option]:dark:bg-gray-800 [&>option]:dark:text-slate-100"
            >
              <option value="ALL">All Dates</option>
              <option value="OVERDUE">Overdue</option>
              <option value="TODAY">Due Today</option>
              <option value="UPCOMING">Upcoming</option>
            </select>
          </div>

          {/* Assignee filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Assignee:</span>
            <select
              value={assigneeFilter}
              onChange={(e) => onAssigneeFilterChange(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-gray-800 text-slate-800 dark:text-slate-200 border border-gray-200 dark:border-gray-700 rounded-lg py-1 px-2.5 outline-none focus:ring-2 focus:ring-emerald-500/40 dark:[color-scheme:dark] [&>option]:bg-white [&>option]:text-slate-900 [&>option]:dark:bg-gray-800 [&>option]:dark:text-slate-100"
            >
              <option value="ALL">All Assignees</option>
              <option value="UNASSIGNED">Unassigned</option>
              {usersInBoard.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
