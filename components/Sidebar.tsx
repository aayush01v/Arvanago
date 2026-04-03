import React from 'react';
import { NavLink } from 'react-router-dom';
import Icon from './common/Icon.tsx';

import { signOutUser } from '../services/authService.ts';
import { LOGO_URL } from '../constants.ts';

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

const Sidebar: React.FC<SidebarProps> = ({ isSidebarOpen, setSidebarOpen, isDarkMode, setDarkMode, onExploreClick, user }) => {
  const handleNavigate = () => {
    if (typeof window === 'undefined' || window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-900/60 backdrop-blur-sm transition-opacity md:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        onClick={() => setSidebarOpen(false)}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-56 flex-col overflow-hidden border-r border-slate-200 bg-white text-primary transition-transform duration-300 dark:border-slate-800 dark:bg-slate-900 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0 h-[100dvh]`}
      >
        <div className="relative flex h-14 items-center border-b border-slate-100 px-4 dark:border-slate-800/50 md:h-16 shrink-0">
          <img src={LOGO_URL} alt="Edusimulate Logo" className="mr-2 h-6 w-auto" />
          <span className="text-base font-bold tracking-tight text-primary">Edusimulate</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 max-h-[calc(100dvh-8rem)]">
          <div className="px-3 mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-secondary pl-3 mb-2">Menu</p>
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
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${isActive
                      ? 'bg-brand-primary/10 text-brand-primary'
                      : 'text-secondary hover:surface-muted hover:text-primary'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        name={item.icon}
                        className={`h-5 w-5 transition-colors ${isActive ? 'accent-strong' : 'text-secondary group-hover:text-primary'}`}
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


            {/* Settings Link */}
            <NavLink
              to="/settings"
              onClick={handleNavigate}
              className={({ isActive }) =>
                `group flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${isActive
                  ? 'bg-brand-primary/10 text-brand-primary'
                  : 'text-secondary hover:surface-muted hover:text-primary'
                }`
              }
            >
              <Icon name="settings" className="h-5 w-5 text-secondary group-hover:text-primary" />
              <span>Settings</span>
            </NavLink>

            <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />

            {user ? (
              // Logout moved to Settings > Account
              null
            ) : (
              <NavLink
                to="/login"
                onClick={handleNavigate}
                className="group flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-secondary hover:bg-brand-primary/10 hover:accent-strong transition-colors"
              >
                <Icon name="login" className="h-5 w-5 text-secondary group-hover:accent-strong" />
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
