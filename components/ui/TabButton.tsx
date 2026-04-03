import React from 'react';
import { cn } from '@/utils/cn.ts';

interface TabButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

const TabButton: React.FC<TabButtonProps> = ({ selected = false, className, ...props }) => (
  <button
    role="tab"
    aria-selected={selected}
    {...props}
    className={cn(
      'ui-focus-ring ui-transition rounded-xl px-4 py-2 text-sm font-semibold',
      selected
        ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
        : 'text-slate-600 hover:text-slate-900 hover:bg-white/80 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/70',
      props.disabled && 'cursor-not-allowed opacity-50',
      className,
    )}
  />
);

export default TabButton;
