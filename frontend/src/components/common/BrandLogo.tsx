import React from 'react';
import { cn } from '../../lib/cn';

export interface BrandLogoProps {
  variant?: 'full' | 'icon' | 'wordmark' | 'adaptive';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showSubtitle?: boolean;
  subtitle?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'adaptive',
  size = 'md',
  className,
  showSubtitle = false,
  subtitle = 'Project Workspaces',
}) => {
  const iconSizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-14 h-14',
  };

  const textClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl',
  };

  if (variant === 'icon') {
    return (
      <img
        src="/logo-icon.png"
        alt="Taskgrid"
        className={cn(iconSizeClasses[size], 'object-contain shrink-0', className)}
      />
    );
  }

  if (variant === 'wordmark') {
    return (
      <img
        src="/logo-wordmark.png"
        alt="Taskgrid"
        className={cn('h-7 w-auto object-contain shrink-0', className)}
      />
    );
  }

  if (variant === 'full') {
    return (
      <img
        src="/logo-full.png"
        alt="Taskgrid"
        className={cn('h-8 w-auto object-contain shrink-0', className)}
      />
    );
  }

  // 'adaptive': Shows icon + crisp theme-aware text
  return (
    <div className={cn('flex items-center gap-2.5 overflow-hidden', className)}>
      <img
        src="/logo-icon.png"
        alt="Taskgrid Icon"
        className={cn(iconSizeClasses[size], 'object-contain shrink-0 transition-transform')}
      />
      <div className="flex flex-col min-w-0">
        <span
          className={cn(
            'font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center leading-none',
            textClasses[size]
          )}
        >
          Task<span className="text-emerald-500">grid</span>
        </span>
        {showSubtitle && (
          <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate mt-0.5">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};
