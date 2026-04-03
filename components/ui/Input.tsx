import React from 'react';
import Icon from '@/components/common/Icon.tsx';
import { cn } from '@/utils/cn.ts';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  loading?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, error = false, loading = false, ...props }, ref) => (
  <div className="relative">
    <input
      ref={ref}
      {...props}
      className={cn(
        'ui-focus-ring ui-transition w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400',
        'hover:border-slate-400 focus-visible:border-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-500',
        loading && 'ui-loading pr-10',
        error && 'ui-error-state',
        className,
      )}
    />
    {loading && <Icon name="spinner" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-500" />}
  </div>
));

Input.displayName = 'Input';

export default Input;
