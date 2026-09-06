import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { KanbanBoard } from '../components/kanban/KanbanBoard';
import { ListView } from '../components/kanban/ListView';
import { AnalyticsView } from '../components/kanban/AnalyticsView';
import { CalendarView } from '../components/kanban/CalendarView';
import { BoardHeader, ViewMode } from '../components/kanban/BoardHeader';
import { TaskModal } from '../components/kanban/TaskModal';
import { ColumnModal } from '../components/kanban/ColumnModal';
import { BoardModal } from '../components/kanban/BoardModal';
import { ShareBoardModal } from '../components/kanban/ShareBoardModal';
import { TaskDetailSidebar } from '../components/kanban/TaskDetailSidebar';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { ColumnSkeleton } from '../components/ui/Skeleton';
import { Board, Column, Task, Role } from '../types';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { getDueStatus } from '../lib/format';

export const BoardDetailPage: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [allBoards, setAllBoards] = useState<Board[]>([]);
  const [board, setBoard] = useState<Board | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [currentRole, setCurrentRole] = useState<Role>('VIEWER');
  const [isLoading, setIsLoading] = useState(true);

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [dueFilter, setDueFilter] = useState('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState('ALL');

  // Modal states
  const [isTaskOpen, setIsTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [targetColId, setTargetColId] = useState('');
  const [isColOpen, setIsColOpen] = useState(false);
  const [editingCol, setEditingCol] = useState<Column | null>(null);
  const [isBoardOpen, setIsBoardOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);

  // Right Detail Space State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailSidebarOpen, setIsDetailSidebarOpen] = useState(false);

  // Confirmation dialog state
  const [confirm, setConfirm] = useState<{
    isOpen: boolean;
    type: 'task' | 'column' | 'board';
    id: string;
    title?: string;
  }>({ isOpen: false, type: 'task', id: '' });

  const fetchBoardData = async () => {
    if (!boardId) return;
    try {
      const [bRes, bsRes] = await Promise.all([
        api.get(`/boards/${boardId}`),
        api.get('/boards'),
      ]);
      setBoard(bRes.data.board);
      setColumns(bRes.data.board.columns || []);
      setCurrentRole(bRes.data.currentRole);
      setAllBoards(bsRes.data.boards || []);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load workspace.');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBoardData();
  }, [boardId]);

  useEffect(() => {
    const handleViewChange = (e: CustomEvent<ViewMode>) => {
      if (e.detail) {
        setViewMode(e.detail);
      }
    };
    window.addEventListener('change-board-view' as any, handleViewChange as any);
    return () => {
      window.removeEventListener('change-board-view' as any, handleViewChange as any);
    };
  }, []);

  // Filter tasks within columns
  const filteredColumns = useMemo(() => {
    return columns.map((col) => {
      const filteredTasks = col.tasks.filter((t) => {
        // Keyword Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = t.title.toLowerCase().includes(q);
          const matchDesc = t.description?.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc) return false;
        }

        // Priority Filter
        if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) {
          return false;
        }

        // Due Date Filter
        if (dueFilter !== 'ALL') {
          const status = getDueStatus(t.dueDate);
          if (dueFilter === 'OVERDUE' && !status?.isOverdue) return false;
          if (dueFilter === 'TODAY' && !status?.isToday) return false;
          if (dueFilter === 'UPCOMING' && (status?.isOverdue || status?.isToday || !t.dueDate))
            return false;
        }

        // Assignee Filter
        if (assigneeFilter !== 'ALL') {
          if (assigneeFilter === 'UNASSIGNED' && t.assignedToId) return false;
          if (assigneeFilter !== 'UNASSIGNED' && t.assignedToId !== assigneeFilter) return false;
        }

        return true;
      });

      return { ...col, tasks: filteredTasks };
    });
  }, [columns, searchQuery, priorityFilter, dueFilter, assigneeFilter]);

  // Handlers
  const handleSaveTask = async (data: any) => {
    try {
      if (editingTask) {
        await api.patch(`/tasks/${editingTask.id}`, data);
        toast.success('Task updated successfully.');
      } else {
        await api.post('/tasks', { ...data, boardId });
        toast.success('Task created successfully.');
      }
      await fetchBoardData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save task.');
    }
  };

  const handleSaveColumn = async (title: string) => {
    try {
      if (editingCol) {
        await api.patch(`/columns/${editingCol.id}`, { title });
        toast.success('Column renamed successfully.');
      } else {
        await api.post('/columns', { title, boardId });
        toast.success('Column added successfully.');
      }
      await fetchBoardData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save column.');
    }
  };

  const handleDeleteColumn = async (columnId: string, targetColId?: string) => {
    try {
      await api.delete(`/columns/${columnId}`, {
        data: { targetColumnId: targetColId },
      });
      toast.success('Column deleted successfully.');
      await fetchBoardData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete column.');
    }
  };

  const handleSaveBoardDetails = async (title: string, description?: string) => {
    try {
      await api.patch(`/boards/${boardId}`, { title, description });
      toast.success('Workspace updated successfully.');
      await fetchBoardData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update workspace.');
    }
  };

  const handleExportBoard = () => {
    if (!board) return;
    const exportData = {
      title: board.title,
      description: board.description,
      exportedAt: new Date().toISOString(),
      columns: columns.map((col) => ({
        title: col.title,
        tasks: col.tasks.map((t) => ({
          title: t.title,
          description: t.description,
          priority: t.priority,
          dueDate: t.dueDate,
          assignee: t.assignedTo?.name || null,
        })),
      })),
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${board.title.replace(/\s+/g, '_')}_export.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('Board exported as JSON.');
  };

  const handleConfirmDelete = async () => {
    try {
      if (confirm.type === 'task') {
        await api.delete(`/tasks/${confirm.id}`);
        toast.success('Task deleted successfully.');
      } else if (confirm.type === 'column') {
        await api.delete(`/columns/${confirm.id}`);
        toast.success('Column deleted successfully.');
      } else if (confirm.type === 'board' && boardId) {
        await api.delete(`/boards/${boardId}`);
        toast.success('Workspace deleted successfully.');
        return navigate('/');
      }
      await fetchBoardData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete.');
    } finally {
      setConfirm({ isOpen: false, type: 'task', id: '' });
    }
  };

  const handleLeaveBoard = async () => {
    if (!boardId) return;
    try {
      await api.post(`/boards/${boardId}/leave`);
      toast.success('You have left the workspace.');
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to leave workspace.');
    } finally {
      setIsLeaveDialogOpen(false);
    }
  };

  const handleOpenTaskDetail = (task: Task) => {
    setSelectedTask(task);
    setIsDetailSidebarOpen(true);
  };

  const handleUpdateTaskFromSidebar = async (taskId: string, data: Partial<Task>) => {
    try {
      await api.patch(`/tasks/${taskId}`, data);
      await fetchBoardData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update task');
      throw err;
    }
  };

  const liveSelectedTask = useMemo(() => {
    if (!selectedTask) return null;
    for (const col of columns) {
      const found = col.tasks.find((t) => t.id === selectedTask.id);
      if (found) return found;
    }
    return selectedTask;
  }, [columns, selectedTask]);

  if (isLoading) {
    return (
      <PageLayout>
        <div className="space-y-6">
          <div className="h-20 bg-slate-200/80 dark:bg-gray-800 rounded-2xl animate-pulse" />
          <div className="flex gap-4 overflow-x-auto pb-4">
            <ColumnSkeleton />
            <ColumnSkeleton />
            <ColumnSkeleton />
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!board) return null;

  const usersInBoard = [
    ...(board.owner ? [board.owner] : []),
    ...(board.members || []).map((m) => m.user),
  ];

  return (
    <PageLayout
      boards={allBoards}
      activeBoardId={boardId}
      onOpenCreateBoard={() => {
        setEditingCol(null);
        setIsBoardOpen(true);
      }}
    >
      <div className="h-full flex flex-col space-y-4">
        {/* Board Header & View Switcher */}
        <BoardHeader
          board={board}
          currentRole={currentRole}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          priorityFilter={priorityFilter}
          onPriorityFilterChange={setPriorityFilter}
          dueFilter={dueFilter}
          onDueFilterChange={setDueFilter}
          assigneeFilter={assigneeFilter}
          onAssigneeFilterChange={setAssigneeFilter}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onOpenShareModal={() => setIsShareOpen(true)}
          onOpenAddColumn={() => {
            setEditingCol(null);
            setIsColOpen(true);
          }}
          onOpenBoardSettings={() => setIsBoardOpen(true)}
          onDeleteBoard={() =>
            setConfirm({
              isOpen: true,
              type: 'board',
              id: board.id,
              title: board.title,
            })
          }
          onLeaveBoard={() => setIsLeaveDialogOpen(true)}
          onExportBoard={handleExportBoard}
          usersInBoard={usersInBoard}
        />

        {/* Dynamic View Mode Content */}
        {viewMode === 'kanban' && (
          <KanbanBoard
            columns={filteredColumns}
            userRole={currentRole}
            setColumns={setColumns}
            onAddTask={(colId) => {
              setEditingTask(null);
              setTargetColId(colId);
              setIsTaskOpen(true);
            }}
            onEditTask={handleOpenTaskDetail}
            onDeleteTask={(id) => setConfirm({ isOpen: true, type: 'task', id })}
            onEditColumn={(col) => {
              setEditingCol(col);
              setIsColOpen(true);
            }}
            onDeleteColumn={handleDeleteColumn}
          />
        )}

        {viewMode === 'list' && (
          <ListView
            columns={filteredColumns}
            userRole={currentRole}
            onEditTask={handleOpenTaskDetail}
            onDeleteTask={(id) => setConfirm({ isOpen: true, type: 'task', id })}
          />
        )}

        {viewMode === 'calendar' && (
          <CalendarView
            columns={filteredColumns}
            userRole={currentRole}
            onEditTask={handleOpenTaskDetail}
            onAddTask={(colId) => {
              setEditingTask(null);
              setTargetColId(colId || columns[0]?.id || '');
              setIsTaskOpen(true);
            }}
          />
        )}

        {viewMode === 'analytics' && <AnalyticsView columns={columns} />}
      </div>

      {/* Right Side Task Detail Panel Space */}
      <TaskDetailSidebar
        task={liveSelectedTask}
        isOpen={isDetailSidebarOpen}
        onClose={() => {
          setIsDetailSidebarOpen(false);
          setSelectedTask(null);
        }}
        columns={columns}
        members={usersInBoard}
        userRole={currentRole}
        onUpdateTask={handleUpdateTaskFromSidebar}
        onDeleteTask={(id) => setConfirm({ isOpen: true, type: 'task', id })}
      />

      {/* Task Creation & Edit Modal */}
      <TaskModal
        isOpen={isTaskOpen}
        onClose={() => setIsTaskOpen(false)}
        onSubmit={handleSaveTask}
        columns={columns}
        members={usersInBoard}
        task={editingTask}
        defaultColumnId={targetColId}
      />

      {/* Column Creation & Edit Modal */}
      <ColumnModal
        isOpen={isColOpen}
        onClose={() => setIsColOpen(false)}
        onSubmit={handleSaveColumn}
        column={editingCol}
      />

      {/* Board Edit Modal */}
      <BoardModal
        isOpen={isBoardOpen}
        onClose={() => setIsBoardOpen(false)}
        onSubmit={handleSaveBoardDetails}
        board={board}
      />

      {/* Member Sharing & Access Control Modal */}
      <ShareBoardModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        members={board.members || []}
        owner={board.owner}
        boardId={boardId}
        currentUserRole={currentRole}
        onAddMember={async (email, role) => {
          const res = await api.post(`/boards/${boardId}/members`, { email, role });
          await fetchBoardData();
          return res;
        }}
        onUpdateRole={async (id, role) => {
          await api.patch(`/boards/${boardId}/members/${id}`, { role });
          toast.success('Member role updated.');
          await fetchBoardData();
        }}
        onRemoveMember={async (id) => {
          await api.delete(`/boards/${boardId}/members/${id}`);
          toast.success('Member removed from workspace.');
          await fetchBoardData();
        }}
      />

      {/* Deletion Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirm.isOpen}
        onClose={() => setConfirm({ isOpen: false, type: 'task', id: '' })}
        onConfirm={handleConfirmDelete}
        title={`Delete ${confirm.type === 'board' ? 'Workspace' : confirm.type === 'column' ? 'Column' : 'Task'}`}
        description={`Are you sure you want to permanently delete this ${confirm.type}? This action cannot be undone.`}
        confirmLabel={`Delete ${confirm.type}`}
        variant="danger"
      />

      {/* Leave Workspace Confirm Dialog */}
      <ConfirmDialog
        isOpen={isLeaveDialogOpen}
        onClose={() => setIsLeaveDialogOpen(false)}
        onConfirm={handleLeaveBoard}
        title="Leave Workspace"
        description="Are you sure you want to leave this workspace? You will lose access to its boards, tasks, and columns."
        confirmLabel="Leave Workspace"
        variant="danger"
      />
    </PageLayout>
  );
};
