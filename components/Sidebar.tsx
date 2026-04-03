import React from 'react';
import { NavLink } from 'react-router-dom';
import Icon from './common/Icon.tsx';
import { SHELL_TOKENS } from './shell/tokens.ts';

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
        className={`${SHELL_TOKENS.drawer.container} ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0 h-[100dvh]`}
      >
        <div className={SHELL_TOKENS.drawer.topBar}>
          <img src={LOGO_URL} alt="Edusimulate Logo" className="mr-2 h-6 w-auto" />
          <span className="text-base font-bold tracking-tight text-white">Edusimulate</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 max-h-[calc(100dvh-8rem)]">
          <div className="px-3 mb-2">
            <p className={SHELL_TOKENS.drawer.navHeader}>Menu</p>
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
                    `${SHELL_TOKENS.drawer.navLinkBase} ${SHELL_TOKENS.drawer.navLabel} ${isActive
                      ? SHELL_TOKENS.drawer.navLinkActive
                      : SHELL_TOKENS.drawer.navLinkInactive
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        name={item.icon}
                        className={`h-5 w-5 transition-colors ${isActive ? SHELL_TOKENS.drawer.iconActive : SHELL_TOKENS.drawer.iconInactive}`}
                      />
                      <span className={SHELL_TOKENS.drawer.navLabel}>{item.label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-slate-800 p-3">
          <div className="space-y-1">
            <p className={`px-3 ${SHELL_TOKENS.drawer.navHeader}`}>Settings</p>

            {/* Settings Link */}
            <NavLink
              to="/settings"
              onClick={handleNavigate}
              className={({ isActive }) =>
                `${SHELL_TOKENS.drawer.navLinkBase} ${SHELL_TOKENS.drawer.navLabel} ${isActive
                  ? SHELL_TOKENS.drawer.navLinkActive
                  : SHELL_TOKENS.drawer.navLinkInactive
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon name="settings" className={`h-5 w-5 transition-colors ${isActive ? SHELL_TOKENS.drawer.iconActive : SHELL_TOKENS.drawer.iconInactive}`} />
                  <span className={SHELL_TOKENS.drawer.navLabel}>Settings</span>
                </>
              )}
            </NavLink>

            <div className="h-px bg-slate-800 my-2" />

            {user ? (
              // Logout moved to Settings > Account
              null
            ) : (
              <NavLink
                to="/login"
                onClick={handleNavigate}
                className={`${SHELL_TOKENS.drawer.navLinkBase} ${SHELL_TOKENS.drawer.navLabel} text-slate-300 hover:bg-brand-primary/20 hover:text-brand-primary`}
              >
                <Icon name="login" className="h-5 w-5 text-slate-500 group-hover:text-brand-primary" />
                <span className={SHELL_TOKENS.drawer.navLabel}>Login</span>
              </NavLink>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
