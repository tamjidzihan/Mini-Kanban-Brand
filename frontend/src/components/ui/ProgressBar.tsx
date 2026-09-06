import React from 'react';
import { cn } from '../../lib/cn';

export interface ProgressBarProps {
  value: number;
  max?: number;
  tone?: 'emerald' | 'rose' | 'amber' | 'sky' | 'blue' | 'violet';
  showLabel?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  tone = 'emerald',
  showLabel = false,
  className,
}) => {
  const isOver = max > 0 && value > max;
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;
  const clampedWidth = Math.min(Math.max(percentage, 2), 100);

  const toneMap: Record<string, string> = {
    emerald: 'bg-emerald-500',
    rose: 'bg-rose-500',
    amber: 'bg-amber-500',
    sky: 'bg-sky-500',
    blue: 'bg-blue-500',
    violet: 'bg-violet-500',
  };

  const fillClass = isOver ? 'bg-rose-500' : toneMap[tone] || 'bg-emerald-500';

  return (
    <div className={cn('w-full flex items-center gap-2.5', className)}>
      <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-gray-800 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-out', fillClass)}
          style={{ width: `${clampedWidth}%` }}
        />
      </div>
      {showLabel && (
        <span
          className={cn(
            'text-[11px] font-semibold tabular-nums shrink-0',
            isOver ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'
          )}
        >
          {percentage}%
        </span>
      )}
    </div>
  );
};
