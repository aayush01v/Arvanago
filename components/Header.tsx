
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Icon from './common/Icon.tsx';
import { User } from '../types.ts';
import { LOGO_URL } from '../constants.ts';

interface HeaderProps {
  user: User | null;
  onMenuClick: () => void;
  menuButtonRef?: React.RefObject<HTMLButtonElement>;
  isMenuOpen?: boolean;
  isScrolled: boolean;
  pageTitle: string;
  pageSubtitle?: string;
  isDarkMode: boolean;
  onThemeToggle: (isDark: boolean) => void;
  unreadChatCount?: number;
  onSearchClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  user,
  onMenuClick,
  menuButtonRef,
  isMenuOpen = false,
  isScrolled,
  pageTitle,
  pageSubtitle,
  isDarkMode,
  onThemeToggle,
  unreadChatCount = 0,
  onSearchClick,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine if we should show a Back button instead of Menu
  // Root pages: dashboard, leaderboard, courses (main list), profile (my profile), my-learnings, explore
  const rootPaths = ['/dashboard', '/leaderboard', '/courses', '/profile', '/my-learnings', '/explore'];
  const isSubPage = !rootPaths.includes(location.pathname) && location.pathname !== '/';

  return (
    <header
      className={`glass-reflection sticky top-0 z-30 border-b transition-all duration-300 ${isScrolled
        ? 'border-slate-200 bg-white/90 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90'
        : 'border-transparent bg-white/50 backdrop-blur-md dark:border-transparent dark:bg-slate-900/50'
        }`}
    >
      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4 md:h-18">

          {/* Left Section: Menu & Logo (Mobile) / Title (Desktop) */}
          <div className="flex items-center gap-4 flex-1">
            {isSubPage ? (
              <button
                onClick={() => {
                  if (window.history.state && window.history.state.idx > 0) {
                    navigate(-1);
                  } else {
                    navigate('/dashboard');
                  }
                }}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200 md:hidden"
                aria-label="Go Back"
              >
                <Icon name="arrowLeft" className="h-5 w-5" />
              </button>
            ) : (
              <button
                ref={menuButtonRef}
                onClick={onMenuClick}
                className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-700 active:scale-[0.98] active:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200 dark:active:bg-slate-700 dark:focus-visible:ring-offset-slate-900 md:hidden"
                aria-label="Open menu"
                aria-expanded={isMenuOpen}
                aria-controls="mobile-navigation-drawer"
              >
                <Icon name="menu" className="h-5 w-5" />
              </button>
            )}

            {/* Mobile Logo */}
            <div className="flex items-center gap-2 md:hidden">
              <img src={LOGO_URL} alt="Edusimulate" className="h-7 w-auto" />
              <span className="text-base font-bold text-slate-900 dark:text-white">Edusimulate</span>
            </div>

            {/* Desktop Page Title */}
            <div className="hidden md:flex flex-col">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                {pageTitle}
              </h1>
              {pageSubtitle && (
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{pageSubtitle}</p>
              )}
            </div>
          </div>

          {/* Right Section: Actions & Profile */}
          <div className="flex items-center gap-3 md:gap-4 justify-end">

            {/* Mobile Page Title (Center-ish if needed, or just hidden/simplified) */}
            <div className="md:hidden hidden sm:block">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{pageTitle}</span>
            </div>

            {/* Search Button */}
            {user && (
              <button
                onClick={onSearchClick}
                className="relative flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-brand-primary active:scale-[0.98] active:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white dark:active:bg-slate-700 dark:focus-visible:ring-offset-slate-900"
                aria-label="Search"
              >
                <Icon name="search" className="h-5 w-5" />
              </button>
            )}

            {/* Profile Dropdown / Info */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-700">
              {user ? (
                <>
                  <Link to="/profile" className="hidden text-right md:block hover:opacity-80 transition-opacity">
                    <p className="text-sm font-medium text-slate-900 dark:text-white leading-none">{user.name}</p>
                  </Link>
                  <Link to="/profile" className="hover:opacity-80 transition-opacity" aria-label="Open your profile">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-9 w-9 rounded-full bg-slate-100 object-cover ring-2 ring-white dark:ring-slate-800"
                    />
                  </Link>
                </>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 bg-brand-primary text-white text-sm font-bold rounded-full hover:bg-brand-secondary transition-colors"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
