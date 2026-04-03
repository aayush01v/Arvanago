import React from 'react';
import Icon from '@/components/common/Icon.tsx';
import { cn } from '@/utils/cn.ts';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  error?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90',
  secondary: 'bg-brand-primary text-white hover:bg-brand-secondary',
  ghost: 'bg-transparent text-brand-primary hover:bg-brand-primary/10',
};

const Button: React.FC<ButtonProps> = ({
  loading = false,
  error = false,
  variant = 'primary',
  disabled,
  children,
  className,
  ...props
}) => {
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      aria-busy={loading}
      className={cn(
        'ui-focus-ring ui-transition inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold',
        variantClasses[variant],
        'active:scale-[0.98]',
        isDisabled && 'cursor-not-allowed opacity-50',
        loading && 'ui-loading',
        error && 'ui-error-state',
        className,
      )}
    >
      {loading && <Icon name="spinner" className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
};

export default Button;
