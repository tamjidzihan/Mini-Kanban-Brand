import React from 'react';
import { cn } from '../../lib/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverLift?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverLift = false,
  padding = 'md',
  ...props
}) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-5',
    lg: 'p-6 sm:p-8',
  };

  return (
    <div
      className={cn(
        'rounded-2xl border border-gray-200/80 bg-white shadow-card dark:border-gray-800 dark:bg-gray-900/70',
        paddingStyles[padding],
        hoverLift && 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-dropdown',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
