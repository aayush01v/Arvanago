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
}

const navItems = [
  { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { to: '/my-learnings', icon: 'bookmark', label: 'My Learnings' },
  { to: '/explore', icon: 'courses', label: 'Explore Courses' },
  { to: '/leaderboard', icon: 'leaderboard', label: 'Leaderboard' },
  { to: '/profile', icon: 'profile', label: 'Profile' },
];

const Sidebar: React.FC<SidebarProps> = ({ isSidebarOpen, setSidebarOpen, isDarkMode, setDarkMode, onExploreClick }) => {
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
        className={`fixed inset-y-0 left-0 z-40 flex w-72 max-w-[18rem] flex-col overflow-hidden border-r border-slate-200 bg-white text-slate-800 transition-transform duration-300 dark:border-slate-800 dark:bg-slate-900 dark:text-white ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:static md:w-64 md:max-w-none md:translate-x-0`}
      >
        <div className="relative flex h-16 items-center border-b border-slate-100 px-6 dark:border-slate-800/50 md:h-20">
          <img src={LOGO_URL} alt="Edusimulate Logo" className="mr-3 h-7 w-auto" />
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Edusimulate</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-6">
          <div className="px-4 mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 pl-4 mb-2">Menu</p>
          </div>
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.to} className="px-3">
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
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-slate-100 p-4 dark:border-slate-800">
          <div className="space-y-1">
            <button
              onClick={() => setDarkMode(!isDarkMode)}
              className="group flex w-full items-center justify-between rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Icon name={isDarkMode ? 'moon' : 'sun'} className="h-5 w-5 text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300" />
                <span>Theme</span>
              </div>
              <div className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isDarkMode ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            </button>

            <button
              onClick={() => {
                signOutUser();
                handleNavigate();
              }}
              className="group flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/10 dark:hover:text-red-400 transition-colors"
            >
              <Icon name="logout" className="h-5 w-5 text-slate-400 group-hover:text-red-500 dark:text-slate-500 dark:group-hover:text-red-400" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
