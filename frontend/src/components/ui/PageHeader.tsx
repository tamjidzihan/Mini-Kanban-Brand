import React from 'react';
import { cn } from '../../lib/cn';
import { tintedChip } from '../../lib/colors';

export interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  iconTone?: 'emerald' | 'rose' | 'amber' | 'sky' | 'blue' | 'violet';
  actions?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  icon,
  iconTone = 'emerald',
  actions,
  breadcrumbs,
  className,
}) => {
  return (
    <div className={cn('space-y-2 mb-6', className)}>
      {breadcrumbs && <div className="text-xs">{breadcrumbs}</div>}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {icon && (
            <div
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-soft',
                tintedChip(iconTone)
              )}
            >
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {title}
            </h1>
            {description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>

        {actions && <div className="flex items-center gap-2.5 flex-wrap shrink-0">{actions}</div>}
      </div>
    </div>
  );
};
