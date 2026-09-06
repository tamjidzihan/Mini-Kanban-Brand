import React from 'react';
import { cn } from '../../lib/cn';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-slate-200/80 dark:bg-gray-800',
        className
      )}
      {...props}
    />
  );
};

export const StatCardSkeleton: React.FC = () => (
  <div className="p-4 rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-card space-y-3">
    <div className="flex items-center justify-between">
      <Skeleton className="w-9 h-9 rounded-xl" />
      <Skeleton className="w-14 h-5 rounded-full" />
    </div>
    <Skeleton className="w-20 h-7" />
    <Skeleton className="w-32 h-3.5" />
  </div>
);

export const BoardCardSkeleton: React.FC = () => (
  <div className="p-5 rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-card space-y-4">
    <div className="space-y-2">
      <Skeleton className="w-3/4 h-5" />
      <Skeleton className="w-full h-3.5" />
    </div>
    <Skeleton className="w-full h-2 rounded-full" />
    <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
      <Skeleton className="w-20 h-4" />
      <Skeleton className="w-8 h-8 rounded-full" />
    </div>
  </div>
);

export const ColumnSkeleton: React.FC = () => (
  <div className="w-80 shrink-0 rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-slate-50/70 dark:bg-gray-900/60 p-3 space-y-3">
    <div className="flex justify-between items-center px-1">
      <Skeleton className="w-28 h-5" />
      <Skeleton className="w-6 h-6 rounded-md" />
    </div>
    <div className="space-y-2.5">
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-20 rounded-xl" />
      <Skeleton className="h-28 rounded-xl" />
    </div>
  </div>
);
