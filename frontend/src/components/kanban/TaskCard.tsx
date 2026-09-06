import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, Role } from '../../types';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Calendar, GripVertical, MoreVertical, Pencil, Trash2, Clock, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/cn';
import { getPriorityColor } from '../../lib/colors';
import { getDueStatus } from '../../lib/format';

export interface TaskCardProps {
  task: Task;
  userRole: Role;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  userRole,
  onEdit,
  onDelete,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const canEdit = userRole === 'OWNER' || userRole === 'EDITOR';

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    disabled: !canEdit,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dueStatus = getDueStatus(task.dueDate);
  const priorityColor = getPriorityColor(task.priority);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl p-3.5',
        'shadow-card hover:shadow-dropdown hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-150',
        isDragging && 'opacity-30 scale-95 border-emerald-500 shadow-2xl'
      )}
    >
      {/* Top row: Drag grip + Title + Action dropdown */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {canEdit && (
            <button
              {...attributes}
              {...listeners}
              aria-label="Drag task to reorder"
              type="button"
              className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400 p-0.5 rounded shrink-0"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </button>
          )}
          <h4
            onClick={() => onEdit(task)}
            className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            {task.title}
          </h4>
        </div>

        {canEdit && (
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              aria-label="Task options"
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                  }}
                />
                <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-xl shadow-dropdown py-1 z-40 animate-in fade-in zoom-in-95">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onEdit(task);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-800 flex items-center gap-2"
                  >
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onDelete(task.id);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Description */}
      {task.description && (
        <p
          onClick={() => onEdit(task)}
          className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 pl-5 leading-relaxed cursor-pointer"
        >
          {task.description}
        </p>
      )}

      {/* Footer info: Priority Badge, Due Date Pill, Assignee */}
      <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
        <Badge variant={priorityColor as any} dot={task.priority === 'URGENT'}>
          {task.priority}
        </Badge>

        <div className="flex items-center gap-2 shrink-0">
          {dueStatus && (
            <span
              title={dueStatus.label}
              className={cn(
                'inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full',
                dueStatus.isOverdue
                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 font-semibold'
                  : dueStatus.isToday
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 bg-slate-100/70 dark:bg-gray-800'
              )}
            >
              {dueStatus.isOverdue ? (
                <AlertCircle className="w-3 h-3" />
              ) : (
                <Clock className="w-3 h-3" />
              )}
              <span>{dueStatus.label}</span>
            </span>
          )}

          {task.assignedTo && (
            <div title={`Assigned to ${task.assignedTo.name}`}>
              <Avatar
                name={task.assignedTo.name}
                src={task.assignedTo.avatarUrl}
                size="xs"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
