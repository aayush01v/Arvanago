import React from 'react';
import { cn } from '@/utils/cn.ts';

interface NavItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ active = false, className, ...props }) => (
  <button
    {...props}
    className={cn(
      'ui-focus-ring ui-transition rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
      active && 'bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white',
      props.disabled && 'cursor-not-allowed opacity-50',
      className,
    )}
  />
);

export default NavItem;
