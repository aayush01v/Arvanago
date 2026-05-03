import React from 'react';
import { uiTokens } from './uiTokens';

type ChipVariant = 'neutral' | 'brand' | 'danger' | 'success';

interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  variant?: ChipVariant;
}

const variantClasses: Record<ChipVariant, { active: string; idle: string }> = {
  neutral: {
    active: 'bg-slate-900 text-white dark:bg-white dark:text-slate-900',
    idle: 'border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
  },
  brand: {
    active: 'bg-brand-primary text-white',
    idle: 'border border-brand-primary/20 bg-brand-primary/5 text-brand-primary',
  },
  danger: {
    active: 'bg-red-600 text-white',
    idle: 'border border-red-200 bg-red-50 text-red-600 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-300',
  },
  success: {
    active: 'bg-green-600 text-white',
    idle: 'border border-green-200 bg-green-50 text-green-700 dark:border-green-900/30 dark:bg-green-900/10 dark:text-green-300',
  },
};

const Chip: React.FC<ChipProps> = ({ active = false, variant = 'neutral', className = '', children, ...props }) => {
  const stateClass = active ? variantClasses[variant].active : variantClasses[variant].idle;

  return (
    <button
      type="button"
      className={`inline-flex items-center gap-2 px-4 ${uiTokens.chip.height} ${uiTokens.radius.interactive} text-sm font-medium transition-colors ${stateClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
};

export default Chip;
