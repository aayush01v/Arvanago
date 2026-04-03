import React from 'react';
import Icon from './Icon';
import { uiTokens } from './uiTokens';

interface HeaderActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
  badge?: React.ReactNode;
  active?: boolean;
}

const HeaderAction: React.FC<HeaderActionProps> = ({
  icon,
  badge,
  active = false,
  className = '',
  ...props
}) => {
  return (
    <button
      type="button"
      className={`relative flex h-9 w-9 items-center justify-center ${uiTokens.radius.pill} border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200 ${
        active ? 'text-brand-primary' : ''
      } ${className}`.trim()}
      {...props}
    >
      <Icon
        name={icon}
        className="h-5 w-5"
        strokeWidth={active ? uiTokens.icon.activeStrokeWidth : uiTokens.icon.strokeWidth}
      />
      {badge}
    </button>
  );
};

export default HeaderAction;
