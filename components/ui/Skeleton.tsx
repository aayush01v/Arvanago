import React from 'react';
import { cn } from '@/utils/cn.ts';

interface SkeletonProps {
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
  <div className={cn('rounded-md bg-slate-200 dark:bg-slate-700 animate-pulse', className)} aria-hidden="true" />
);

export default Skeleton;
