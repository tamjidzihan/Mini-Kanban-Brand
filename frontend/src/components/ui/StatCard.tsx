import React from 'react';
import { Card } from './Card';
import { useCountUp } from '../../hooks/useCountUp';
import { cn } from '../../lib/cn';
import { tintedChip } from '../../lib/colors';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  tone?: 'emerald' | 'rose' | 'amber' | 'sky' | 'blue' | 'violet';
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  suffix?: string;
  prefix?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  tone = 'emerald',
  trend,
  suffix = '',
  prefix = '',
}) => {
  const animatedValue = useCountUp(value);

  return (
    <Card hoverLift className="p-4 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <div className={cn('p-2 rounded-xl flex items-center justify-center shrink-0', tintedChip(tone))}>
          {icon}
        </div>
        {trend && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 px-2 py-0.5 text-[11px] font-semibold rounded-full',
              trend.isPositive
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
            )}
          >
            {trend.isPositive ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            {trend.value}
          </span>
        )}
      </div>

      <div className="mt-3">
        <div className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
          {prefix}
          {animatedValue.toLocaleString()}
          {suffix}
        </div>
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
          {title}
        </div>
      </div>
    </Card>
  );
};
