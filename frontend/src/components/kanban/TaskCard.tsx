import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, Role } from '../../types';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Calendar, GripVertical, MoreVertical, Pencil, Trash2, Clock, AlertCircle, CheckSquare, Timer } from 'lucide-react';
import { cn } from '../../lib/cn';
import { getPriorityColor } from '../../lib/colors';
import { getDueStatus } from '../../lib/format';
import { useClickOutside } from '../../hooks/useClickOutside';

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
  const menuRef = useClickOutside<HTMLDivElement>(() => setShowMenu(false), showMenu);
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

  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => s.isCompleted).length;
  const tags = task.taskTags ? task.taskTags.map((tt) => tt.tag).filter(Boolean) : [];

  const tagColors: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
    sky: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400 border-sky-200 dark:border-sky-500/20',
    violet: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400 border-violet-200 dark:border-violet-500/20',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
    slate: 'bg-slate-100 text-slate-700 dark:bg-gray-800 dark:text-slate-300 border-slate-200 dark:border-gray-700',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onEdit(task)}
      className={cn(
        'group relative bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl p-3.5 cursor-pointer',
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
              onClick={(e) => e.stopPropagation()}
              className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400 p-0.5 rounded shrink-0"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </button>
          )}
          <h4
            className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            {task.title}
          </h4>
        </div>

        {canEdit && (
          <div ref={menuRef} className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
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
            )}
          </div>
        )}
      </div>

      {/* Description */}
      {task.description && (
        <p
          className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 pl-5 leading-relaxed"
        >
          {task.description}
        </p>
      )}

      {/* Tags Row */}
      {tags.length > 0 && (
        <div className="mt-2 pl-5 flex items-center gap-1 flex-wrap">
          {tags.map((tag) => (
            <span
              key={tag.id}
              className={cn(
                'text-[10px] font-semibold px-2 py-0.2 rounded-md border',
                tagColors[tag.color] || tagColors.emerald
              )}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Footer info: Priority Badge, Subtasks Progress, Due Date Pill, Assignee */}
      <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Badge variant={priorityColor as any} dot={task.priority === 'URGENT'}>
            {task.priority}
          </Badge>

          {/* Subtasks Progress Pill */}
          {subtasks.length > 0 && (
            <span
              className={cn(
                'inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md border',
                completedSubtasks === subtasks.length
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30'
                  : 'bg-slate-100 text-slate-600 dark:bg-gray-800 dark:text-slate-400 border-gray-200 dark:border-gray-700'
              )}
              title={`${completedSubtasks} of ${subtasks.length} subtasks completed`}
            >
              <CheckSquare className="w-3 h-3" />
              <span>{completedSubtasks}/{subtasks.length}</span>
            </span>
          )}

          {/* Logged Time Pill */}
          {task.loggedMinutes && task.loggedMinutes > 0 ? (
            <span
              className="inline-flex items-center gap-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400"
              title={`Logged: ${task.loggedMinutes} minutes`}
            >
              <Timer className="w-3 h-3 text-slate-400" />
              <span>{Math.round(task.loggedMinutes / 60 * 10) / 10}h</span>
            </span>
          ) : null}
        </div>

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
