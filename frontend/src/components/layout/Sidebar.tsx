import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Plus,
  FolderKanban,
  LogOut,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { Board } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';
import { BoardModal } from '../kanban/BoardModal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { useQueryClient } from '@tanstack/react-query';

export interface SidebarProps {
  boards?: Board[];
  onOpenCreateBoard?: () => void;
  activeBoardId?: string;
  isCollapsed?: boolean;
  onCloseMobileNav?: () => void;
  onEditBoard?: (board: Board) => void;
  onDeleteBoard?: (boardId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  boards = [],
  onOpenCreateBoard,
  activeBoardId,
  isCollapsed = false,
  onCloseMobileNav,
  onEditBoard,
  onDeleteBoard,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [localBoards, setLocalBoards] = useState<Board[]>(boards);
  const [openMenuBoardId, setOpenMenuBoardId] = useState<string | null>(null);
  const [boardToEdit, setBoardToEdit] = useState<Board | null>(null);
  const [boardToDelete, setBoardToDelete] = useState<Board | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalBoards(boards);
  }, [boards]);

  // Click outside and escape key handling for the 3-dot dropdown menu
  useEffect(() => {
    if (!openMenuBoardId) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuBoardId(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenMenuBoardId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openMenuBoardId]);

  const handleLinkClick = () => {
    setOpenMenuBoardId(null);
    if (onCloseMobileNav) {
      onCloseMobileNav();
    }
  };

  const handleOpenEdit = (b: Board) => {
    if (onCloseMobileNav) onCloseMobileNav();
    if (onEditBoard) {
      onEditBoard(b);
    } else {
      setBoardToEdit(b);
    }
  };

  const handleOpenDelete = (b: Board) => {
    if (onCloseMobileNav) onCloseMobileNav();
    if (onDeleteBoard) {
      onDeleteBoard(b.id);
    } else {
      setBoardToDelete(b);
    }
  };

  const handleSaveEdit = async (title: string, description?: string) => {
    if (!boardToEdit) return;
    setIsSaving(true);
    try {
      const res = await api.patch(`/boards/${boardToEdit.id}`, { title, description });
      const updatedBoard = res.data.board || { ...boardToEdit, title, description };

      setLocalBoards((prev) =>
        prev.map((item) => (item.id === boardToEdit.id ? { ...item, ...updatedBoard } : item))
      );

      toast.success('Workspace updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      window.dispatchEvent(new CustomEvent('board-updated', { detail: { board: updatedBoard } }));
      window.dispatchEvent(new CustomEvent('boards-changed'));
      setBoardToEdit(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update workspace.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!boardToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/boards/${boardToDelete.id}`);
      const deletedId = boardToDelete.id;

      setLocalBoards((prev) => prev.filter((item) => item.id !== deletedId));

      toast.success('Workspace deleted successfully.');
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      window.dispatchEvent(new CustomEvent('board-deleted', { detail: { boardId: deletedId } }));
      window.dispatchEvent(new CustomEvent('boards-changed'));
      setBoardToDelete(null);

      if (activeBoardId === deletedId) {
        navigate('/');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete workspace.');
    } finally {
      setIsDeleting(false);
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
          className="flex items-center gap-2.5 overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg p-1 -m-1"
        >
          {isCollapsed ? (
            <img
              src="/logo-icon.png"
              alt="Taskgrid"
              className="w-8 h-8 object-contain shrink-0 transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <img
                src="/logo-icon.png"
                alt="Taskgrid"
                className="w-8 h-8 object-contain shrink-0 transition-transform group-hover:scale-105"
              />
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white flex items-center leading-none">
                  Task<span className="text-emerald-500">grid</span>
                </span>
                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate mt-1">
                  Project Workspaces
                </span>
              </div>
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
            title={isCollapsed ? 'Dashboard' : undefined}
            aria-label={isCollapsed ? 'Dashboard' : undefined}
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

        </div>

        {/* Boards Section */}
        <div className="space-y-1 pt-2">
          {!isCollapsed && (
            <div className="flex items-center justify-between px-3 pb-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
                Workspaces ({localBoards.length})
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
            {localBoards.length === 0 ? (
              !isCollapsed ? (
                <p className="px-3 py-2 text-xs text-slate-400 italic">No boards yet</p>
              ) : null
            ) : (
              localBoards.map((b, index) => {
                const isActive = activeBoardId === b.id;
                const isOwner = !user?.id || b.ownerId === user?.id || b.owner?.id === user?.id;
                const isEditor = b.members?.some(
                  (m) => m.userId === user?.id && (m.role === 'EDITOR' || m.role === 'OWNER')
                );
                const canEdit = isOwner || isEditor;
                const canDelete = isOwner;
                const hasActions = canEdit || canDelete;
                const isMenuOpen = openMenuBoardId === b.id;
                const isNearBottom = index >= localBoards.length - 2 && localBoards.length > 3;

                return (
                  <div key={b.id} className="relative group flex items-center">
                    <NavLink
                      to={`/board/${b.id}`}
                      onClick={handleLinkClick}
                      title={b.title}
                      className={cn(
                        'relative flex items-center gap-3 px-3 py-2 text-xs rounded-xl transition-all duration-150 truncate flex-1 min-w-0',
                        !isCollapsed && hasActions && 'pr-8',
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
                      {!isCollapsed && <span className="truncate flex-1">{b.title}</span>}
                    </NavLink>

                    {!isCollapsed && hasActions && (
                      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpenMenuBoardId((prev) => (prev === b.id ? null : b.id));
                          }}
                          aria-label={`Options for ${b.title}`}
                          title="Board options"
                          className={cn(
                            'p-1 rounded-md transition-all duration-150',
                            isMenuOpen
                              ? 'opacity-100 bg-slate-200 dark:bg-gray-700 text-slate-800 dark:text-slate-200 shadow-sm'
                              : 'opacity-0 group-hover:opacity-100 focus:opacity-100 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-gray-800/80'
                          )}
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        {isMenuOpen && (
                          <div
                            ref={menuRef}
                            onClick={(e) => e.stopPropagation()}
                            className={cn(
                              'absolute right-0 w-36 bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-xl shadow-dropdown py-1 z-50 animate-in fade-in zoom-in-95',
                              isNearBottom ? 'bottom-full mb-1' : 'top-full mt-1'
                            )}
                          >
                            {canEdit && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setOpenMenuBoardId(null);
                                  handleOpenEdit(b);
                                }}
                                className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-800 flex items-center gap-2 transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5 text-slate-400" />
                                <span>Edit</span>
                              </button>
                            )}
                            {canDelete && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setOpenMenuBoardId(null);
                                  handleOpenDelete(b);
                                }}
                                className="w-full text-left px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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
            <NavLink
              to="/profile"
              onClick={handleLinkClick}
              title={isCollapsed ? 'Profile Settings' : undefined}
              aria-label={isCollapsed ? 'Profile Settings' : undefined}
              className={({ isActive }) =>
                cn(
                  'flex min-w-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
                  isCollapsed ? 'justify-center' : 'flex-1',
                  isActive && 'bg-emerald-100/70 dark:bg-emerald-500/10'
                )
              }
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
            </NavLink>
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

      {/* Edit Board Modal */}
      <BoardModal
        isOpen={Boolean(boardToEdit)}
        onClose={() => setBoardToEdit(null)}
        onSubmit={handleSaveEdit}
        board={boardToEdit}
        isLoading={isSaving}
      />

      {/* Delete Board Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(boardToDelete)}
        title="Delete Workspace"
        description={`Are you sure you want to delete "${boardToDelete?.title}"? All columns and tasks inside will be permanently deleted.`}
        confirmLabel="Delete Workspace"
        variant="danger"
        isLoading={isDeleting}
        onClose={() => setBoardToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </aside>
  );
};
