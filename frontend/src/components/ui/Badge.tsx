import React from 'react';
import { cn } from '../../lib/cn';
import { statusBadge } from '../../lib/colors';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'emerald' | 'rose' | 'amber' | 'sky' | 'blue' | 'violet' | 'slate';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'slate',
  dot = false,
  ...props
}) => {
  const dotColors: Record<string, string> = {
    emerald: 'bg-emerald-500',
    rose: 'bg-rose-500',
    amber: 'bg-amber-500',
    sky: 'bg-sky-500',
    blue: 'bg-blue-500',
    violet: 'bg-violet-500',
    slate: 'bg-slate-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full',
        statusBadge(variant),
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant] || 'bg-slate-400')}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
};
