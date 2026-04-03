import React from 'react';
import { NavLink } from 'react-router-dom';
import Icon from './Icon';
import { uiTokens } from './uiTokens';

interface NavItemProps {
  to: string;
  icon: string;
  label: string;
  onClick?: () => void | Promise<void>;
  compact?: boolean;
  danger?: boolean;
  exact?: boolean;
  trailing?: React.ReactNode;
}

const NavItem: React.FC<NavItemProps> = ({
  to,
  icon,
  label,
  onClick,
  compact = false,
  danger = false,
  exact = false,
  trailing,
}) => {
  return (
    <NavLink
      to={to}
      end={exact}
      onClick={onClick}
      className={({ isActive }) => {
        if (danger) {
          return `group flex items-center gap-3 ${uiTokens.radius.interactive} px-4 ${compact ? 'py-2' : 'py-2.5'} text-sm font-medium transition-colors ${
            isActive
              ? 'bg-red-600 text-white'
              : 'text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-900/20'
          }`;
        }

        return `group flex items-center gap-3 ${uiTokens.radius.interactive} px-4 ${compact ? 'py-2' : 'py-2.5'} text-sm font-medium transition-all duration-200 ${
          isActive
            ? 'bg-brand-primary/10 text-brand-primary'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
        }`;
      }}
    >
      {({ isActive }) => (
        <>
          <Icon
            name={icon}
            className="h-5 w-5"
            strokeWidth={isActive ? uiTokens.icon.activeStrokeWidth : uiTokens.icon.strokeWidth}
          />
          <span className="truncate">{label}</span>
          {trailing}
        </>
      )}
    </NavLink>
  );
};

export default NavItem;
