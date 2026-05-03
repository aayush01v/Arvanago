import React from 'react';
import { uiTokens } from './uiTokens';

type CardVariant = 'surface' | 'glass' | 'muted';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

const variantClasses: Record<CardVariant, string> = {
  surface: `border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 ${uiTokens.elevation.card}`,
  glass: `border border-white/50 bg-white/90 dark:border-white/10 dark:bg-slate-900/90 ${uiTokens.elevation.card}`,
  muted: 'border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60 shadow-sm',
};

const Card: React.FC<CardProps> = ({ variant = 'surface', className = '', children, ...props }) => (
  <div className={`${uiTokens.radius.surface} ${variantClasses[variant]} ${className}`.trim()} {...props}>
    {children}
  </div>
);

export default Card;
