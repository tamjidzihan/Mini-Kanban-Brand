import React, { useEffect, useState, useMemo } from 'react';
import { PageLayout } from '../components/layout/PageLayout';
import { BoardModal } from '../components/kanban/BoardModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { Tabs, TabOption } from '../components/ui/Tabs';
import { EmptyState } from '../components/ui/EmptyState';
import { StatCardSkeleton, BoardCardSkeleton } from '../components/ui/Skeleton';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Board } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Link } from 'react-router-dom';
import {
  Plus,
  Kanban,
  Users,
  Layers,
  ArrowRight,
  ListTodo,
  CheckCircle2,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  FolderPlus,
  Sparkles,
  LogOut,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [deletingBoardId, setDeletingBoardId] = useState<string | null>(null);
  const [leavingBoardId, setLeavingBoardId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [filter, setFilter] = useState<'all' | 'owned' | 'shared'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const toast = useToast();

  const fetchBoards = async () => {
    try {
      const res = await api.get('/boards');
      setBoards(res.data.boards || []);
    } catch (error) {
      console.error('Failed to load boards:', error);
      toast.error('Failed to load workspaces.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, []);

  const handleSaveBoard = async (title: string, description?: string) => {
    setIsCreating(true);
    try {
      if (editingBoard) {
        await api.patch(`/boards/${editingBoard.id}`, { title, description });
        toast.success('Workspace updated successfully.');
      } else {
        await api.post('/boards', { title, description });
        toast.success('Workspace created successfully.');
      }
      await fetchBoards();
      setIsBoardModalOpen(false);
      setEditingBoard(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save workspace.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteBoard = async () => {
    if (!deletingBoardId) return;
    try {
      await api.delete(`/boards/${deletingBoardId}`);
      toast.success('Workspace deleted successfully.');
      setDeletingBoardId(null);
      await fetchBoards();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete workspace.');
    }
  };

  const handleLeaveBoard = async () => {
    if (!leavingBoardId) return;
    try {
      await api.post(`/boards/${leavingBoardId}/leave`);
      toast.success('You have left the workspace.');
      setLeavingBoardId(null);
      await fetchBoards();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to leave workspace.');
    }
  };

  // Stats calculation
  const totalBoards = boards.length;
  const ownedBoardsCount = boards.filter((b) => b.ownerId === user?.id).length;
  const totalColumns = useMemo(
    () => boards.reduce((sum, b) => sum + (b._count?.columns || 0), 0),
    [boards]
  );
  const totalTasks = useMemo(
    () => boards.reduce((sum, b) => sum + (b._count?.tasks || 0), 0),
    [boards]
  );

  const filterTabs: TabOption<'all' | 'owned' | 'shared'>[] = [
    { id: 'all', label: 'All Workspaces', badge: totalBoards },
    { id: 'owned', label: 'Owned by Me', badge: ownedBoardsCount },
    { id: 'shared', label: 'Shared with Me', badge: totalBoards - ownedBoardsCount },
  ];

  const filtered = useMemo(() => {
    return boards.filter((b) => {
      // Role filter
      if (filter === 'owned' && b.ownerId !== user?.id) return false;
      if (filter === 'shared' && b.ownerId === user?.id) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          b.title.toLowerCase().includes(q) ||
          (b.description && b.description.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [boards, filter, searchQuery, user?.id]);

  return (
    <PageLayout
      boards={boards}
      onOpenCreateBoard={() => {
        setEditingBoard(null);
        setIsBoardModalOpen(true);
      }}
    >
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/80 dark:border-gray-800 pb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Welcome back, {user?.name}</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Organize your tasks, collaborate with your team, and track project progress.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setEditingBoard(null);
              setIsBoardModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Workspace
          </Button>
        </div>

        {/* 4 StatCards Grid (§16) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard
                title="Total Workspaces"
                value={totalBoards}
                icon={<Kanban className="w-5 h-5" />}
                tone="emerald"
                trend={{ value: `${ownedBoardsCount} owned`, isPositive: true }}
              />
              <StatCard
                title="Total Workflow Columns"
                value={totalColumns}
                icon={<Layers className="w-5 h-5" />}
                tone="sky"
              />
              <StatCard
                title="Total Active Tasks"
                value={totalTasks}
                icon={<ListTodo className="w-5 h-5" />}
                tone="amber"
              />
              <StatCard
                title="Active Collaborations"
                value={totalBoards - ownedBoardsCount}
                icon={<Users className="w-5 h-5" />}
                tone="violet"
              />
            </>
          )}
        </div>

        {/* Workspaces Section Header & Filters */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filter Tabs */}
            <Tabs options={filterTabs} value={filter} onChange={setFilter} />

            {/* Search Input */}
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search workspaces..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Boards Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <BoardCardSkeleton />
              <BoardCardSkeleton />
              <BoardCardSkeleton />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Kanban className="w-6 h-6 text-emerald-600" />}
              title={searchQuery ? 'No matching workspaces' : 'No workspaces found'}
              description={
                searchQuery
                  ? `No workspaces found matching "${searchQuery}". Try a different search term.`
                  : 'Get started by creating your first Kanban workspace to manage columns and tasks.'
              }
              action={
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setEditingBoard(null);
                    setIsBoardModalOpen(true);
                  }}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Create First Workspace
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((b) => {
                const isOwner = b.ownerId === user?.id;
                const membersCount = (b.members?.length || 0) + 1;

                return (
                  <Card
                    key={b.id}
                    hoverLift
                    className="p-5 flex flex-col justify-between group relative border border-gray-200/80 dark:border-gray-800"
                  >
                    <div>
                      {/* Card Top: Title & Quick Menu */}
                      <div className="flex items-start justify-between gap-3">
                        <Link
                          to={`/board/${b.id}`}
                          className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate flex-1"
                        >
                          {b.title}
                        </Link>
                        <Badge variant={isOwner ? 'emerald' : 'sky'}>
                          {isOwner ? 'Owner' : 'Member'}
                        </Badge>
                      </div>

                      {/* Description */}
                      <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed min-h-[32px]">
                        {b.description || 'No description provided.'}
                      </p>
                    </div>

                    {/* Card Footer */}
                    <div className="mt-5 pt-3.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 font-medium" title="Columns">
                          <Layers className="w-3.5 h-3.5 text-slate-400" />
                          <span className="tabular-nums">{b._count?.columns || 0}</span>
                        </span>
                        <span className="flex items-center gap-1 font-medium" title="Tasks">
                          <ListTodo className="w-3.5 h-3.5 text-slate-400" />
                          <span className="tabular-nums">{b._count?.tasks || 0}</span>
                        </span>
                        <span className="flex items-center gap-1 font-medium" title="Members">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span className="tabular-nums">{membersCount}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isOwner ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setDeletingBoardId(b.id);
                            }}
                            title="Delete Board"
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setLeavingBoardId(b.id);
                            }}
                            title="Leave Workspace"
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <Link
                          to={`/board/${b.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          <span>Open</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Board Create / Edit Modal */}
      <BoardModal
        isOpen={isBoardModalOpen}
        onClose={() => {
          setIsBoardModalOpen(false);
          setEditingBoard(null);
        }}
        onSubmit={handleSaveBoard}
        board={editingBoard}
        isLoading={isCreating}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingBoardId}
        onClose={() => setDeletingBoardId(null)}
        onConfirm={handleDeleteBoard}
        title="Delete Workspace"
        description="This will permanently delete this workspace, including all its columns, tasks, and member associations. This action cannot be undone."
        confirmLabel="Delete Workspace"
        variant="danger"
      />

      {/* Leave Workspace Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!leavingBoardId}
        onClose={() => setLeavingBoardId(null)}
        onConfirm={handleLeaveBoard}
        title="Leave Workspace"
        description="Are you sure you want to leave this workspace? You will lose access to its boards, tasks, and columns until re-invited by an owner or editor."
        confirmLabel="Leave Workspace"
        variant="danger"
      />
    </PageLayout>
  );
};
