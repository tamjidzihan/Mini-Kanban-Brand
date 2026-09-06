import React, { useState, useMemo } from 'react';
import { Column, Task, Role } from '../../types';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { getPriorityColor } from '../../lib/colors';
import { getDueStatus, formatDate } from '../../lib/format';
import { Pencil, Trash2, ArrowUpDown, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface ListViewProps {
  columns: Column[];
  userRole: Role;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export const ListView: React.FC<ListViewProps> = ({
  columns,
  userRole,
  onEditTask,
  onDeleteTask,
}) => {
  const [sortField, setSortField] = useState<'title' | 'priority' | 'column' | 'dueDate'>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const canEdit = userRole === 'OWNER' || userRole === 'EDITOR';

  // Flatten all tasks with column context
  const allTasks = useMemo(() => {
    return columns.flatMap((col) =>
      col.tasks.map((t) => ({
        ...t,
        columnTitle: col.title,
      }))
    );
  }, [columns]);

  const sortedTasks = useMemo(() => {
    return [...allTasks].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortField === 'column') {
        comparison = a.columnTitle.localeCompare(b.columnTitle);
      } else if (sortField === 'priority') {
        const priorityWeight: Record<string, number> = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        comparison = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
      } else if (sortField === 'dueDate') {
        const timeA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const timeB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        comparison = timeA - timeB;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [allTasks, sortField, sortOrder]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl overflow-hidden shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-gray-800/80 border-b border-gray-200/80 dark:border-gray-800 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
            <tr>
              <th
                onClick={() => toggleSort('title')}
                className="py-3 px-4 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400"
              >
                <div className="flex items-center gap-1.5">
                  <span>Task Title</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('column')}
                className="py-3 px-4 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400"
              >
                <div className="flex items-center gap-1.5">
                  <span>Column</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('priority')}
                className="py-3 px-4 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400"
              >
                <div className="flex items-center gap-1.5">
                  <span>Priority</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4">Assignee</th>
              <th
                onClick={() => toggleSort('dueDate')}
                className="py-3 px-4 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400"
              >
                <div className="flex items-center gap-1.5">
                  <span>Due Date</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              {canEdit && <th className="py-3 px-4 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80">
            {sortedTasks.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 italic">
                  No tasks found in this board.
                </td>
              </tr>
            ) : (
              sortedTasks.map((t) => {
                const dueStatus = getDueStatus(t.dueDate);
                return (
                  <tr
                    key={t.id}
                    onClick={() => onEditTask(t)}
                    className="hover:bg-slate-50/80 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                      <div className="max-w-md">
                        <div className="font-semibold text-xs truncate hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                          {t.title}
                        </div>
                        {t.description && (
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            {t.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-gray-800 dark:text-slate-300">
                        {t.columnTitle}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={getPriorityColor(t.priority) as any} dot={t.priority === 'URGENT'}>
                        {t.priority}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      {t.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <Avatar name={t.assignedTo.name} src={t.assignedTo.avatarUrl} size="xs" />
                          <span className="text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                            {t.assignedTo.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {dueStatus ? (
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 font-medium',
                            dueStatus.isOverdue
                              ? 'text-rose-600 dark:text-rose-400 font-semibold'
                              : dueStatus.isToday
                              ? 'text-amber-600 dark:text-amber-400 font-semibold'
                              : 'text-slate-600 dark:text-slate-400'
                          )}
                        >
                          <Clock className="w-3 h-3" />
                          <span>{dueStatus.label}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    {canEdit && (
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEditTask(t)}
                            aria-label="Edit task"
                            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteTask(t.id)}
                            aria-label="Delete task"
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-800/50 text-[11px] text-slate-500 flex justify-between items-center">
        <span>Total tasks: <strong className="text-slate-700 dark:text-slate-300 tabular-nums">{sortedTasks.length}</strong></span>
        <span>Columns: <strong className="text-slate-700 dark:text-slate-300 tabular-nums">{columns.length}</strong></span>
      </div>
    </div>
  );
};
