import { cn } from './cn';

// Tinted chip recipe (§4.3)
export const tintedChip = (color: string) => {
  const map: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
    sky: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
    slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  };
  return map[color] || map.slate;
};

// Status badge recipe with soft ring (§4.3)
export const statusBadge = (color: string) => {
  const map: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/15 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20',
    rose: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/15 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20',
    amber: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/15 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20',
    sky: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/15 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/20',
    blue: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/15 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20',
    violet: 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-600/15 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-500/20',
    slate: 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-400/20 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
  };
  return map[color] || map.slate;
};

export const getPriorityColor = (priority: string): string => {
  switch (priority?.toUpperCase()) {
    case 'URGENT':
      return 'rose';
    case 'HIGH':
      return 'amber';
    case 'MEDIUM':
      return 'sky';
    case 'LOW':
    default:
      return 'emerald';
  }
};

export const getRoleColor = (role: string): string => {
  switch (role?.toUpperCase()) {
    case 'OWNER':
      return 'emerald';
    case 'EDITOR':
      return 'sky';
    case 'VIEWER':
    default:
      return 'slate';
  }
};
