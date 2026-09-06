import React from 'react';
import { cn } from '../../lib/cn';

export interface AvatarProps {
  name?: string;
  src?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isOnline?: boolean;
  className?: string;
}

const colorList = [
  'bg-emerald-600 text-white',
  'bg-blue-600 text-white',
  'bg-violet-600 text-white',
  'bg-rose-600 text-white',
  'bg-amber-600 text-white',
  'bg-sky-600 text-white',
  'bg-teal-600 text-white',
];

const getInitials = (name?: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const getColorFromName = (name?: string): string => {
  if (!name) return colorList[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colorList.length;
  return colorList[index];
};

export const Avatar: React.FC<AvatarProps> = ({
  name = 'User',
  src,
  size = 'md',
  isOnline,
  className,
}) => {
  const sizeMap = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-9 h-9 text-xs',
    lg: 'w-12 h-12 text-sm',
  };

  const dotSizeMap = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  const initials = getInitials(name);
  const colorClass = getColorFromName(name);

  return (
    <div className="relative inline-flex shrink-0">
      {src ? (
        <img
          src={src}
          alt={name}
          className={cn(
            'rounded-full object-cover border border-gray-200/80 dark:border-gray-800',
            sizeMap[size],
            className
          )}
        />
      ) : (
        <div
          className={cn(
            'rounded-full font-semibold flex items-center justify-center select-none shadow-sm',
            sizeMap[size],
            colorClass,
            className
          )}
          aria-hidden="true"
        >
          {initials}
        </div>
      )}

      {isOnline !== undefined && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full ring-2 ring-white dark:ring-gray-900',
            dotSizeMap[size],
            isOnline ? 'bg-emerald-500' : 'bg-slate-400'
          )}
          aria-hidden="true"
        />
      )}
    </div>
  );
};
