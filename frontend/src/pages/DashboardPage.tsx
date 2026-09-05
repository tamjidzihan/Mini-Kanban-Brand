import React, { useEffect, useState } from 'react';
import { PageLayout } from '../components/layout/PageLayout';
import { BoardModal } from '../components/kanban/BoardModal';
import { Button } from '../components/ui/Button';
import { Board } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Plus, Kanban, Users, Layers, ArrowRight } from 'lucide-react';
import { Avatar } from '../components/ui/Avatar';

export const DashboardPage: React.FC = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [filter, setFilter] = useState<'all' | 'owned' | 'shared'>('all');
  const { user } = useAuth();

  const fetchBoards = async () => {
    try {
      const res = await api.get('/boards');
      setBoards(res.data.boards);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, []);

  const handleCreateBoard = async (title: string, description?: string) => {
    setIsCreating(true);
    try {
      await api.post('/boards', { title, description });
      await fetchBoards();
      setIsBoardModalOpen(false);
    } finally {
      setIsCreating(false);
    }
  };

  const filtered = boards.filter((b) => {
    if (filter === 'owned') return b.ownerId === user?.id;
    if (filter === 'shared') return b.ownerId !== user?.id;
    return true;
  });

  return (
    <PageLayout boards={boards} onOpenCreateBoard={() => setIsBoardModalOpen(true)}>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Welcome back, {user?.name} 👋
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage workflows and collaborate.</p>
          </div>
          <Button onClick={() => setIsBoardModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
            Create Board
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {(['all', 'owned', 'shared'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                filter === tab
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {tab === 'all' ? 'All Boards' : tab === 'owned' ? 'Owned' : 'Shared'}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (<div key={i} className="h-36 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 space-y-4">
            <Kanban className="w-8 h-8 text-indigo-500 mx-auto" />
            <h3 className="text-base font-semibold">No boards found</h3>
            <Button onClick={() => setIsBoardModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
              Create Board
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((b) => (
              <Link
                key={b.id}
                to={`/board/${b.id}`}
                className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-subtle hover:border-indigo-500/50 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 truncate">{b.title}</h3>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{b.description || 'No description.'}</p>
                </div>
                <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" />{b._count?.columns || 0}</span>
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{(b.members?.length || 0) + 1}</span>
                  </div>
                  {b.owner && <Avatar name={b.owner.name} src={b.owner.avatarUrl} size="sm" />}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <BoardModal
        isOpen={isBoardModalOpen}
        onClose={() => setIsBoardModalOpen(false)}
        onSubmit={handleCreateBoard}
        isLoading={isCreating}
      />
    </PageLayout>
  );
};
