import React, { useMemo } from 'react';
import { Column, Task } from '../../types';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { getDueStatus } from '../../lib/format';
import { CheckCircle2, AlertTriangle, ListTodo, Users, Layers, TrendingUp } from 'lucide-react';

export interface AnalyticsViewProps {
  columns: Column[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ columns }) => {
  const allTasks = useMemo(() => columns.flatMap((c) => c.tasks), [columns]);

  // Calculations
  const totalTasks = allTasks.length;

  // Identify done column (titled 'done' or the last column)
  const doneColumn = useMemo(() => {
    return (
      columns.find((c) => c.title.toLowerCase().includes('done')) ||
      (columns.length > 0 ? columns[columns.length - 1] : null)
    );
  }, [columns]);

  const completedTasksCount = doneColumn ? doneColumn.tasks.length : 0;
  const completionRate = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;

  const overdueCount = useMemo(() => {
    return allTasks.filter((t) => {
      const status = getDueStatus(t.dueDate);
      return status?.isOverdue;
    }).length;
  }, [allTasks]);

  const priorityCounts = useMemo(() => {
    const counts = { URGENT: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    allTasks.forEach((t) => {
      if (counts[t.priority as keyof typeof counts] !== undefined) {
        counts[t.priority as keyof typeof counts]++;
      }
    });
    return counts;
  }, [allTasks]);

  // Subtask metrics
  const subtaskStats = useMemo(() => {
    let total = 0;
    let completed = 0;
    allTasks.forEach((t) => {
      if (t.subtasks && t.subtasks.length > 0) {
        total += t.subtasks.length;
        completed += t.subtasks.filter((s) => s.isCompleted).length;
      }
    });
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, rate };
  }, [allTasks]);

  // Time tracking metrics
  const timeStats = useMemo(() => {
    let totalLoggedMins = 0;
    let totalEstHours = 0;
    allTasks.forEach((t) => {
      if (t.loggedMinutes) totalLoggedMins += t.loggedMinutes;
      if (t.estimatedHours) totalEstHours += t.estimatedHours;
    });
    const loggedHours = Math.round((totalLoggedMins / 60) * 10) / 10;
    return { loggedMinutes: totalLoggedMins, loggedHours, estHours: totalEstHours };
  }, [allTasks]);

  // Tag distribution
  const tagCounts = useMemo(() => {
    const map: Record<string, { name: string; color: string; count: number }> = {};
    allTasks.forEach((t) => {
      if (t.tags) {
        t.tags.forEach((tt) => {
          if (tt.tag) {
            if (!map[tt.tag.id]) {
              map[tt.tag.id] = { name: tt.tag.name, color: tt.tag.color, count: 0 };
            }
            map[tt.tag.id].count++;
          }
        });
      }
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [allTasks]);

  const assigneeCounts = useMemo(() => {
    const map: Record<string, { name: string; avatarUrl?: string | null; count: number }> = {};
    allTasks.forEach((t) => {
      if (t.assignedTo) {
        if (!map[t.assignedTo.id]) {
          map[t.assignedTo.id] = {
            name: t.assignedTo.name,
            avatarUrl: t.assignedTo.avatarUrl,
            count: 0,
          };
        }
        map[t.assignedTo.id].count++;
      } else {
        if (!map['unassigned']) {
          map['unassigned'] = { name: 'Unassigned', avatarUrl: null, count: 0 };
        }
        map['unassigned'].count++;
      }
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [allTasks]);

  return (
    <div className="space-y-6">
      {/* Top Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hoverLift className="p-4 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <ListTodo className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
              {totalTasks}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Total Board Tasks
            </div>
          </div>
        </Card>

        <Card hoverLift className="p-4 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
              {completedTasksCount}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Completed Tasks
            </div>
          </div>
        </Card>

        <Card hoverLift className="p-4 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
              {completionRate}%
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Completion Rate
            </div>
          </div>
        </Card>

        <Card hoverLift className="p-4 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
              {overdueCount}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Overdue Tasks
            </div>
          </div>
        </Card>
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column Distribution */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Tasks by Column
              </h3>
            </div>
            <span className="text-xs text-slate-400">{columns.length} columns</span>
          </div>

          <div className="space-y-3.5">
            {columns.map((col) => {
              const colTasks = col.tasks.length;
              const colPercent = totalTasks > 0 ? Math.round((colTasks / totalTasks) * 100) : 0;
              return (
                <div key={col.id} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-700 dark:text-slate-300">{col.title}</span>
                    <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                      {colTasks} ({colPercent}%)
                    </span>
                  </div>
                  <ProgressBar value={colTasks} max={totalTasks || 1} tone="emerald" />
                </div>
              );
            })}
          </div>
        </Card>

        {/* Priority Breakdown */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Priority Breakdown
              </h3>
            </div>
            <span className="text-xs text-slate-400">4 tiers</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-500/10 border border-rose-200/60 dark:border-rose-500/20">
              <div className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 uppercase">
                Urgent
              </div>
              <div className="text-xl font-bold text-rose-800 dark:text-rose-300 tabular-nums mt-1">
                {priorityCounts.URGENT}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20">
              <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase">
                High
              </div>
              <div className="text-xl font-bold text-amber-800 dark:text-amber-300 tabular-nums mt-1">
                {priorityCounts.HIGH}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-sky-50/70 dark:bg-sky-500/10 border border-sky-200/60 dark:border-sky-500/20">
              <div className="text-[11px] font-semibold text-sky-700 dark:text-sky-400 uppercase">
                Medium
              </div>
              <div className="text-xl font-bold text-sky-800 dark:text-sky-300 tabular-nums mt-1">
                {priorityCounts.MEDIUM}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/20">
              <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase">
                Low
              </div>
              <div className="text-xl font-bold text-emerald-800 dark:text-emerald-300 tabular-nums mt-1">
                {priorityCounts.LOW}
              </div>
            </div>
          </div>
        </Card>

        {/* Assignee Workload Distribution */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Team Workload Distribution
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {assigneeCounts.map((a, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-800/50 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar name={a.name} src={a.avatarUrl} size="sm" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {a.name}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-400 shadow-sm tabular-nums">
                  {a.count} tasks
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Time Tracking & Subtask Velocity */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-violet-600" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Subtasks & Time Velocity
              </h3>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Subtask Completion</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {subtaskStats.completed} / {subtaskStats.total} ({subtaskStats.rate}%)
                </span>
              </div>
              <ProgressBar value={subtaskStats.completed} max={subtaskStats.total || 1} tone="emerald" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">Total Logged Time</div>
                <div className="text-xl font-bold text-emerald-800 dark:text-emerald-300 tabular-nums mt-1">
                  {timeStats.loggedHours}h
                </div>
                <div className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">
                  ({timeStats.loggedMinutes} minutes logged)
                </div>
              </div>

              <div className="p-3 rounded-xl bg-violet-50/60 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/40">
                <div className="text-[11px] font-semibold text-violet-700 dark:text-violet-400">Estimated Effort</div>
                <div className="text-xl font-bold text-violet-800 dark:text-violet-300 tabular-nums mt-1">
                  {timeStats.estHours}h
                </div>
                <div className="text-[10px] text-violet-600/70 dark:text-violet-400/70 mt-0.5">
                  planned across tasks
                </div>
              </div>
            </div>

            {/* Tags Overview */}
            {tagCounts.length > 0 && (
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Active Tags</div>
                <div className="flex flex-wrap gap-1.5">
                  {tagCounts.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white shadow-sm"
                      style={{ backgroundColor: tag.color }}
                    >
                      <span>{tag.name}</span>
                      <span className="bg-black/20 px-1.5 py-0.2 rounded-full text-[10px]">{tag.count}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
