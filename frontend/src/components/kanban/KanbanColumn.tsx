import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Column, Task, Role } from '../../types';
import { TaskCard } from './TaskCard';
import { Button } from '../ui/Button';
import { Plus, MoreHorizontal, Pencil, Trash2, ArrowRightLeft } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useClickOutside } from '../../hooks/useClickOutside';

export interface KanbanColumnProps {
  column: Column;
  allColumns: Column[];
  userRole: Role;
  onAddTask: (columnId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onEditColumn: (column: Column) => void;
  onDeleteColumn: (columnId: string, targetColumnId?: string) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  allColumns,
  userRole,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onEditColumn,
  onDeleteColumn,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [targetColId, setTargetColId] = useState<string>('');

  const menuRef = useClickOutside<HTMLDivElement>(() => setShowMenu(false), showMenu);

  const canManageTasks = userRole === 'OWNER' || userRole === 'EDITOR';
  const canManageColumns = userRole === 'OWNER' || userRole === 'EDITOR';

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const taskIds = column.tasks.map((t) => t.id);
  const otherColumns = allColumns.filter((c) => c.id !== column.id);

  const handleDelete = () => {
    onDeleteColumn(column.id, targetColId || undefined);
    setIsDeleteModalOpen(false);
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'w-80 shrink-0 bg-slate-100/70 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-800 rounded-2xl flex flex-col max-h-full transition-colors select-none',
        isOver && 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-500/20'
      )}
    >
      {/* Column Header */}
      <div className="p-3.5 flex items-center justify-between gap-2 border-b border-gray-200/60 dark:border-gray-800/60 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 truncate">
            {column.title}
          </h3>
          <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-slate-200 dark:bg-gray-800 text-slate-600 dark:text-slate-400 tabular-nums shrink-0">
            {column.tasks.length}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {canManageTasks && (
            <button
              type="button"
              onClick={() => onAddTask(column.id)}
              aria-label="Add task"
              className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-200 dark:hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}

          {canManageColumns && (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                aria-label="Column settings"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-gray-800 transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-xl shadow-dropdown py-1 z-40 animate-in fade-in zoom-in-95">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onEditColumn(column);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-800 flex items-center gap-2"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Rename
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      if (column.tasks.length > 0 && otherColumns.length > 0) {
                        setTargetColId(otherColumns[0].id);
                        setIsDeleteModalOpen(true);
                      } else {
                        onDeleteColumn(column.id);
                      }
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Task Cards Container */}
      <div className="p-3 flex-1 overflow-y-auto space-y-2.5 min-h-[120px]">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {column.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              userRole={userRole}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
            />
          ))}
        </SortableContext>

        {column.tasks.length === 0 && (
          <div className="h-24 flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-800/80 rounded-xl text-slate-400 text-xs">
            No tasks here
          </div>
        )}
      </div>

      {/* Column Footer */}
      {canManageTasks && (
        <div className="p-2 border-t border-gray-200/60 dark:border-gray-800/60 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddTask(column.id)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            className="w-full justify-start text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          >
            Add Task
          </Button>
        </div>
      )}

      {/* Safe Column Deletion Dialog (§13) */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={() => setIsDeleteModalOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-dropdown p-5 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Delete Column "{column.title}"
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                This column contains <span className="font-semibold">{column.tasks.length}</span> task(s). Move them to another column before deleting?
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Move tasks to:
              </label>
              <select
                value={targetColId}
                onChange={(e) => setTargetColId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/40"
              >
                {otherColumns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleDelete}
                leftIcon={<ArrowRightLeft className="w-3.5 h-3.5" />}
              >
                Move & Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
