import React from 'react';
import { cn } from '../../lib/cn';
import { Priority, Role } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  className,
}) => {
  const variantStyles = {
    default: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    primary: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    success: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    warning: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    danger: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    info: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs font-medium',
    md: 'px-2.5 py-1 text-xs font-semibold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
  const config = {
    LOW: { variant: 'default' as const, label: 'Low' },
    MEDIUM: { variant: 'info' as const, label: 'Medium' },
    HIGH: { variant: 'warning' as const, label: 'High' },
    URGENT: { variant: 'danger' as const, label: 'Urgent' },
  };

  const { variant, label } = config[priority] || config.MEDIUM;

  return <Badge variant={variant}>{label}</Badge>;
};

export const RoleBadge: React.FC<{ role: Role }> = ({ role }) => {
  const config = {
    OWNER: { variant: 'primary' as const, label: 'Owner' },
    EDITOR: { variant: 'success' as const, label: 'Editor' },
    VIEWER: { variant: 'default' as const, label: 'Viewer' },
  };

  const { variant, label } = config[role] || config.VIEWER;

  return <Badge variant={variant}>{label}</Badge>;
};
