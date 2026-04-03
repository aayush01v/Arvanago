import React from 'react';
import { cn } from '@/utils/cn.ts';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  loading?: boolean;
  error?: boolean;
}

const Card: React.FC<CardProps> = ({ interactive = false, loading = false, error = false, className, ...props }) => (
  <div
    {...props}
    className={cn(
      'rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800',
      interactive && 'ui-transition hover:-translate-y-1 hover:shadow-xl hover:border-brand-primary/20 active:translate-y-0',
      loading && 'ui-loading',
      error && 'ui-error-state',
      className,
    )}
  />
);

export default Card;
