import React, { useEffect, useMemo, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import Icon from './common/Icon.tsx';

import { LOGO_URL } from '../constants.ts';

interface SidebarProps {
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
  isDarkMode: boolean;
  setDarkMode: (isDark: boolean) => void;
  onExploreClick?: () => Promise<void> | void;
  user: import('../types').User | null;
  triggerButtonRef?: React.RefObject<HTMLButtonElement | null>;
}

const navItems = [
  { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { to: '/my-learnings', icon: 'bookmark', label: 'My Learnings' },
  { to: '/mynotes', icon: 'file-text', label: 'My Notes' },
  { to: '/explore', icon: 'courses', label: 'Explore Courses' },
  { to: '/leaderboard', icon: 'leaderboard', label: 'Leaderboard' },
  { to: '/chat', icon: 'message-circle', label: 'Chat' },
];

const Sidebar: React.FC<SidebarProps> = ({ isSidebarOpen, setSidebarOpen, isDarkMode, setDarkMode, onExploreClick, user, triggerButtonRef }) => {
  const drawerRef = useRef<HTMLElement>(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const primaryAction = useMemo(() => {
    if (user) {
      return {
        to: '/my-learnings',
        label: 'Resume last lesson',
        description: 'Jump back into your latest progress',
      };
    }

    return {
      to: '/login',
      label: 'Continue learning',
      description: 'Sign in to pick up where you left off',
    };
  }, [user]);

  useEffect(() => {
    if (!isMobile) {
      return;
    }

    if (!isSidebarOpen) {
      triggerButtonRef?.current?.focus();
      return;
    }

    const drawer = drawerRef.current;
    if (!drawer) {
      return;
    }

    const getFocusableElements = () =>
      Array.from(
        drawer.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => !element.hasAttribute('disabled') && element.tabIndex !== -1);

    const focusableElements = getFocusableElements();
    focusableElements[0]?.focus();

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setSidebarOpen(false);
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const items = getFocusableElements();
      if (items.length === 0) {
        return;
      }

      const firstElement = items[0];
      const lastElement = items[items.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  }, [isMobile, isSidebarOpen, setSidebarOpen, triggerButtonRef]);

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
        ref={drawerRef}
        role="dialog"
        aria-modal={isMobile ? 'true' : undefined}
        aria-label="Main navigation"
        className={`fixed inset-y-0 left-0 z-40 flex w-56 flex-col overflow-hidden border-r border-slate-200 bg-white text-slate-800 transition-transform duration-300 dark:border-slate-800 dark:bg-slate-900 dark:text-white ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0 h-[100dvh]`}
      >
        <div className="relative flex h-14 items-center border-b border-slate-100 px-4 dark:border-slate-800/50 md:h-16 shrink-0">
          <img src={LOGO_URL} alt="Edusimulate Logo" className="mr-2 h-6 w-auto" />
          <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">Edusimulate</span>
          <button
            type="button"
            className="ml-auto rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>

        <div className="px-3 pt-3">
          <NavLink
            to={primaryAction.to}
            onClick={handleNavigate}
            className="flex items-start gap-3 rounded-xl border border-brand-primary/30 bg-brand-primary/10 px-3 py-2.5 text-brand-primary transition-colors hover:bg-brand-primary/15"
          >
            <Icon name="play" className="mt-0.5 h-4 w-4" />
            <span className="flex flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-primary/80">Primary action</span>
              <span className="text-sm font-semibold leading-tight">{primaryAction.label}</span>
              <span className="text-xs text-brand-primary/90">{primaryAction.description}</span>
            </span>
          </NavLink>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 max-h-[calc(100dvh-8rem)]">
          <div className="px-3 mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 pl-3 mb-2">Menu</p>
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
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        name={item.icon}
                        className={`h-5 w-5 transition-colors ${isActive ? 'text-brand-primary' : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'}`}
                      />
                      <span>{item.label}</span>
                      {isActive && <span className="sr-only">Active page</span>}
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
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                }`
              }
            >
              <Icon name="settings" className="h-5 w-5 text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300" />
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
                className="group flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-brand-primary/10 hover:text-brand-primary dark:text-slate-400 dark:hover:bg-brand-primary/20 dark:hover:text-brand-primary transition-colors"
              >
                <Icon name="login" className="h-5 w-5 text-slate-400 group-hover:text-brand-primary dark:text-slate-500" />
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
