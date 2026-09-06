import React, { useState, useMemo } from 'react';
import { Column, Task, Role } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { getPriorityColor } from '../../lib/colors';
import { getDueStatus } from '../../lib/format';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '../../lib/cn';

export interface CalendarViewProps {
  columns: Column[];
  userRole: Role;
  onEditTask: (task: Task) => void;
  onAddTask?: (columnId?: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  columns,
  userRole,
  onEditTask,
  onAddTask,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const allTasks = useMemo(() => {
    return columns.flatMap((col) => col.tasks);
  }, [columns]);

  // Calendar calculations
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  // Map tasks by date string YYYY-MM-DD
  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    allTasks.forEach((task) => {
      if (task.dueDate) {
        const dateKey = task.dueDate.split('T')[0];
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(task);
      }
    });
    return map;
  }, [allTasks]);

  // Generate 35-42 calendar cells
  const calendarCells = useMemo(() => {
    const cells = [];

    // Previous month trailing days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevM = month === 0 ? 11 : month - 1;
      const prevY = month === 0 ? year - 1 : year;
      const dateKey = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      cells.push({
        day: dayNum,
        dateKey,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = isCurrentMonth && today.getDate() === d;
      cells.push({
        day: d,
        dateKey,
        isCurrentMonth: true,
        isToday,
      });
    }

    // Next month leading days to complete grid
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextM = month === 11 ? 0 : month + 1;
      const nextY = month === 11 ? year + 1 : year;
      const dateKey = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        day: d,
        dateKey,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    return cells;
  }, [year, month, firstDayOfMonth, daysInMonth, daysInPrevMonth, isCurrentMonth, today]);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl shadow-card overflow-hidden flex flex-col">
      {/* Calendar Top Navigation Header */}
      <div className="p-4 sm:px-6 border-b border-gray-200/80 dark:border-gray-800 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              {monthNames[month]} {year}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {Object.keys(tasksByDate).length} scheduled deadline dates
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={goToToday}>
            Today
          </Button>

          <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={prevMonth}
              aria-label="Previous Month"
              className="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="w-[1px] h-5 bg-gray-200 dark:bg-gray-700" />
            <button
              type="button"
              onClick={nextMonth}
              aria-label="Next Month"
              className="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-gray-200/80 dark:border-gray-800 bg-slate-50/75 dark:bg-gray-800/50 text-center select-none">
        {daysOfWeek.map((day, idx) => (
          <div
            key={day}
            className={cn(
              'py-2.5 text-xs font-bold uppercase tracking-wider',
              idx === 0 || idx === 6
                ? 'text-slate-400 dark:text-slate-500'
                : 'text-slate-700 dark:text-slate-300'
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar 7-column Day Grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-gray-100 dark:divide-gray-800/80 border-b border-gray-100 dark:border-gray-800 auto-rows-fr min-h-[580px]">
        {calendarCells.map((cell, idx) => {
          const tasksForDay = tasksByDate[cell.dateKey] || [];
          const cellDate = new Date(cell.dateKey);
          const isPast = cellDate.getTime() < new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

          return (
            <div
              key={idx}
              className={cn(
                'p-2 flex flex-col min-h-[110px] transition-colors',
                !cell.isCurrentMonth
                  ? 'bg-slate-50/40 dark:bg-gray-950/40 text-slate-400'
                  : 'bg-white dark:bg-gray-900',
                cell.isToday && 'bg-emerald-50/30 dark:bg-emerald-950/15'
              )}
            >
              {/* Day Number Header */}
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={cn(
                    'text-xs font-semibold w-6 h-6 rounded-full flex items-center justify-center',
                    cell.isToday
                      ? 'bg-emerald-600 text-white font-bold shadow-sm'
                      : cell.isCurrentMonth
                      ? 'text-slate-800 dark:text-slate-200'
                      : 'text-slate-400 dark:text-slate-600'
                  )}
                >
                  {cell.day}
                </span>

                {tasksForDay.length > 0 && (
                  <span className="text-[10px] font-bold text-slate-400 tabular-nums">
                    {tasksForDay.length}
                  </span>
                )}
              </div>

              {/* Tasks in this day */}
              <div className="flex-1 space-y-1 overflow-y-auto max-h-[100px] scrollbar-none">
                {tasksForDay.map((task) => {
                  const priorityColor = getPriorityColor(task.priority);
                  const isOverdue = isPast && cell.isCurrentMonth;

                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => onEditTask(task)}
                      className={cn(
                        'w-full text-left p-1.5 rounded-lg border text-[11px] font-medium transition-all group relative',
                        'hover:shadow-sm hover:scale-[1.02] flex items-center justify-between gap-1 truncate',
                        task.priority === 'URGENT'
                          ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-500/30'
                          : task.priority === 'HIGH'
                          ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-500/30'
                          : task.priority === 'MEDIUM'
                          ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-800 dark:text-sky-200 border-sky-200 dark:border-sky-500/30'
                          : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-500/30'
                      )}
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span
                          className={cn(
                            'w-1.5 h-1.5 rounded-full shrink-0',
                            task.priority === 'URGENT'
                              ? 'bg-rose-500'
                              : task.priority === 'HIGH'
                              ? 'bg-amber-500'
                              : task.priority === 'MEDIUM'
                              ? 'bg-sky-500'
                              : 'bg-emerald-500'
                          )}
                        />
                        <span className="truncate font-semibold">{task.title}</span>
                      </div>

                      {task.assignedTo && (
                        <Avatar name={task.assignedTo.name} src={task.assignedTo.avatarUrl} size="xs" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
