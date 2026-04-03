import React from 'react';
import { NavLink } from 'react-router-dom';
import Icon from './common/Icon.tsx';

import { LOGO_URL } from '../constants.ts';
import { NAV_COLOR_TOKENS, NAV_ICON_SIZE_CLASS } from './layoutTokens.ts';

interface SidebarProps {
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
  isDarkMode: boolean;
  setDarkMode: (isDark: boolean) => void;
  onExploreClick?: () => Promise<void> | void;
  user: import('../types').User | null;
}

const navItems = [
  { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { to: '/my-learnings', icon: 'bookmark', label: 'My Learnings' },
  { to: '/mynotes', icon: 'file-text', label: 'My Notes' },
  { to: '/explore', icon: 'courses', label: 'Explore Courses' },
  { to: '/leaderboard', icon: 'leaderboard', label: 'Leaderboard' },
  { to: '/chat', icon: 'message-circle', label: 'Chat' },
];

const navItemBase = `group flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${NAV_COLOR_TOKENS.navItem.base} ${NAV_COLOR_TOKENS.navItem.hoverFocus}`;

const Sidebar: React.FC<SidebarProps> = ({ isSidebarOpen, setSidebarOpen, onExploreClick, user }) => {
  const handleNavigate = () => {
    if (typeof window === 'undefined' || window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-30 transition-opacity md:hidden ${NAV_COLOR_TOKENS.overlay.backdrop} ${NAV_COLOR_TOKENS.overlay.blur} ${isSidebarOpen ? NAV_COLOR_TOKENS.overlay.open : NAV_COLOR_TOKENS.overlay.closed}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-[100dvh] w-56 flex-col overflow-hidden border-r text-slate-800 transition-transform duration-300 dark:text-white md:translate-x-0 ${NAV_COLOR_TOKENS.shell.border} ${NAV_COLOR_TOKENS.shell.background} ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="relative flex h-14 shrink-0 items-center justify-between border-b border-slate-100 px-4 dark:border-slate-800/50 md:h-16">
          <div className="flex items-center">
            <img src={LOGO_URL} alt="Edusimulate Logo" className="mr-2 h-6 w-auto" />
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">Edusimulate</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden"
            aria-label="Close menu"
          >
            <Icon name="x" className={NAV_ICON_SIZE_CLASS} />
          </button>
        </div>

        <nav className="max-h-[calc(100dvh-8rem)] flex-1 overflow-y-auto py-4">
          <div className="mb-2 px-3">
            <p className="mb-2 pl-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Menu</p>
          </div>
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.to} className="px-2">
                <NavLink
                  to={item.to}
                  onClick={async () => {
                    if (item.to === '/explore' && onExploreClick) {
                      try {
                        await onExploreClick();
                      } catch (error) {
                        console.error('Failed to refresh courses before navigating to Explore.', error);
                      }
                    }
                    handleNavigate();
                  }}
                  className={({ isActive }) => `${navItemBase} ${isActive ? NAV_COLOR_TOKENS.navItem.active : ''}`}
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        name={item.icon}
                        className={`${NAV_ICON_SIZE_CLASS} transition-colors ${isActive ? NAV_COLOR_TOKENS.navItem.iconActive : `${NAV_COLOR_TOKENS.navItem.icon} group-hover:text-slate-600 dark:group-hover:text-slate-200`}`}
                      />
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-slate-100 p-3 dark:border-slate-800">
          <div className="space-y-1">
            <NavLink
              to="/settings"
              onClick={handleNavigate}
              className={({ isActive }) => `${navItemBase} w-full ${isActive ? NAV_COLOR_TOKENS.navItem.active : ''}`}
            >
              <Icon name="settings" className={`${NAV_ICON_SIZE_CLASS} ${NAV_COLOR_TOKENS.navItem.icon} group-hover:text-slate-600 dark:group-hover:text-slate-200`} />
              <span>Settings</span>
            </NavLink>

            <div className="my-2 h-px bg-slate-100 dark:bg-slate-800" />

            {!user && (
              <NavLink
                to="/login"
                onClick={handleNavigate}
                className={`${navItemBase} w-full hover:text-brand-primary dark:hover:text-brand-primary`}
              >
                <Icon name="login" className={`${NAV_ICON_SIZE_CLASS} ${NAV_COLOR_TOKENS.navItem.icon} group-hover:text-brand-primary`} />
                <span>Login</span>
              </NavLink>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
