import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { KanbanBoard } from '../components/kanban/KanbanBoard';
import { BoardHeader } from '../components/kanban/BoardHeader';
import { TaskModal } from '../components/kanban/TaskModal';
import { ColumnModal } from '../components/kanban/ColumnModal';
import { BoardModal } from '../components/kanban/BoardModal';
import { ShareBoardModal } from '../components/kanban/ShareBoardModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Board, Column, Task, Role } from '../types';
import { api } from '../lib/api';

export const BoardDetailPage: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const [allBoards, setAllBoards] = useState<Board[]>([]);
  const [board, setBoard] = useState<Board | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [currentRole, setCurrentRole] = useState<Role>('VIEWER');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTaskOpen, setIsTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [targetColId, setTargetColId] = useState('');
  const [isColOpen, setIsColOpen] = useState(false);
  const [editingCol, setEditingCol] = useState<Column | null>(null);
  const [isBoardOpen, setIsBoardOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [confirm, setConfirm] = useState<{ isOpen: boolean; type: 'task' | 'column' | 'board'; id: string }>({ isOpen: false, type: 'task', id: '' });

  const fetchBoardData = async () => {
    if (!boardId) return;
    try {
      const [b, bs] = await Promise.all([api.get(`/boards/${boardId}`), api.get('/boards')]);
      setBoard(b.data.board); setColumns(b.data.board.columns || []);
      setCurrentRole(b.data.currentRole); setAllBoards(bs.data.boards);
    } catch { navigate('/'); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchBoardData(); }, [boardId]);

  const filteredColumns = useMemo(() => {
    if (!searchQuery.trim()) return columns;
    const q = searchQuery.toLowerCase();
    return columns.map((col) => ({ ...col, tasks: col.tasks.filter((t) => t.title.toLowerCase().includes(q)) }));
  }, [columns, searchQuery]);

  const handleConfirmDelete = async () => {
    if (confirm.type === 'task') await api.delete(`/tasks/${confirm.id}`);
    else if (confirm.type === 'column') await api.delete(`/columns/${confirm.id}`);
    else if (confirm.type === 'board' && boardId) {
      await api.delete(`/boards/${boardId}`);
      return navigate('/');
    }
    setConfirm({ isOpen: false, type: 'task', id: '' });
    await fetchBoardData();
  };

  if (isLoading) return <PageLayout><div className="h-full flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div></PageLayout>;
  if (!board) return null;
  const usersInBoard = [...(board.owner ? [board.owner] : []), ...(board.members || []).map((m) => m.user)];

  return (
    <PageLayout boards={allBoards} activeBoardId={boardId}>
      <div className="h-full flex flex-col space-y-4">
        <BoardHeader board={board} currentRole={currentRole} searchQuery={searchQuery} onSearchChange={setSearchQuery}
          onOpenShareModal={() => setIsShareOpen(true)} onOpenAddColumn={() => { setEditingCol(null); setIsColOpen(true); }}
          onOpenBoardSettings={() => setIsBoardOpen(true)} onDeleteBoard={() => setConfirm({ isOpen: true, type: 'board', id: board.id })}
          usersInBoard={usersInBoard}
        />
        <KanbanBoard columns={filteredColumns} userRole={currentRole} setColumns={setColumns}
          onAddTask={(colId) => { setEditingTask(null); setTargetColId(colId); setIsTaskOpen(true); }}
          onEditTask={(task) => { setEditingTask(task); setIsTaskOpen(true); }}
          onDeleteTask={(id) => setConfirm({ isOpen: true, type: 'task', id })}
          onEditColumn={(col) => { setEditingCol(col); setIsColOpen(true); }}
          onDeleteColumn={(id) => setConfirm({ isOpen: true, type: 'column', id })}
        />
      </div>

      <TaskModal isOpen={isTaskOpen} onClose={() => setIsTaskOpen(false)} onSubmit={async (d) => { editingTask ? await api.patch(`/tasks/${editingTask.id}`, d) : await api.post('/tasks', { ...d, boardId }); fetchBoardData(); }} columns={columns} members={usersInBoard} task={editingTask} defaultColumnId={targetColId} />
      <ColumnModal isOpen={isColOpen} onClose={() => setIsColOpen(false)} onSubmit={async (title) => { editingCol ? await api.patch(`/columns/${editingCol.id}`, { title }) : await api.post('/columns', { title, boardId }); fetchBoardData(); }} column={editingCol} />
      <BoardModal isOpen={isBoardOpen} onClose={() => setIsBoardOpen(false)} onSubmit={async (t, desc) => { await api.patch(`/boards/${boardId}`, { title: t, description: desc }); fetchBoardData(); }} board={board} />
      <ShareBoardModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} members={board.members || []} owner={board.owner} currentUserRole={currentRole}
        onAddMember={async (email, role) => { await api.post(`/boards/${boardId}/members`, { email, role }); fetchBoardData(); }}
        onUpdateRole={async (id, role) => { await api.patch(`/boards/${boardId}/members/${id}`, { role }); fetchBoardData(); }}
        onRemoveMember={async (id) => { await api.delete(`/boards/${boardId}/members/${id}`); fetchBoardData(); }}
      />
      <ConfirmDialog isOpen={confirm.isOpen} onClose={() => setConfirm({ isOpen: false, type: 'task', id: '' })} onConfirm={handleConfirmDelete} title={`Delete ${confirm.type}`} message={`Are you sure you want to delete this ${confirm.type}?`} />
    </PageLayout>
  );
};
