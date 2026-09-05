import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Column, Task, Role } from '../../types';
import { TaskCard } from './TaskCard';
import { Button } from '../ui/Button';
import { Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { cn } from '../../lib/cn';

interface KanbanColumnProps {
  column: Column;
  userRole: Role;
  onAddTask: (columnId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onEditColumn: (column: Column) => void;
  onDeleteColumn: (columnId: string) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  userRole,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onEditColumn,
  onDeleteColumn,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const canEdit = userRole === 'OWNER' || userRole === 'EDITOR';

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const taskIds = column.tasks.map((t) => t.id);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'w-80 shrink-0 bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl flex flex-col max-h-full transition-colors',
        isOver && 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-800'
      )}
    >
      {/* Column Header */}
      <div className="p-3.5 flex items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {column.title}
          </h3>
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {column.tasks.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {canEdit && (
            <button
              onClick={() => onAddTask(column.id)}
              className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="Add task"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}

          {canEdit && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg py-1 z-20">
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onEditColumn(column);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Rename
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onDeleteColumn(column.id);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Task List Container */}
      <div className="p-3 flex-1 overflow-y-auto space-y-3 min-h-[120px]">
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
          <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800/60 rounded-xl text-slate-400 text-xs">
            No tasks yet
          </div>
        )}
      </div>

      {/* Column Footer */}
      {canEdit && (
        <div className="p-2 border-t border-slate-200/60 dark:border-slate-800/60">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddTask(column.id)}
            leftIcon={<Plus className="w-4 h-4" />}
            className="w-full justify-start text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          >
            Add Task
          </Button>
        </div>
      )}
    </div>
  );
};
