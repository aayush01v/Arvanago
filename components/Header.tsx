
import React from 'react';
import { Link } from 'react-router-dom';
import Icon from './common/Icon.tsx';
import { User } from '../types.ts';
import { LOGO_URL } from '../constants.ts';

interface HeaderProps {
  user: User;
  onMenuClick: () => void;
  isScrolled: boolean;
  pageTitle: string;
  pageSubtitle?: string;
  isDarkMode: boolean;
  onThemeToggle: (isDark: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({
  user,
  onMenuClick,
  isScrolled,
  pageTitle,
  pageSubtitle,
  isDarkMode,
  onThemeToggle,
}) => {
  return (
    <header
      className={`glass-reflection sticky top-0 z-30 border-b transition-all duration-500 ${isScrolled
        ? 'border-white/20 bg-white/75 shadow-[0_12px_30px_rgba(15,23,42,0.2)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/80 dark:shadow-[0_16px_40px_rgba(15,23,42,0.55)]'
        : 'border-white/10 bg-white/40 shadow-[0_8px_22px_rgba(15,23,42,0.15)] backdrop-blur-xl dark:border-white/5 dark:bg-slate-900/40 dark:shadow-[0_12px_32px_rgba(15,23,42,0.45)]'
        }`}
    >
      <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3 md:h-20 md:grid md:grid-cols-[auto_1fr_auto] md:items-center md:gap-6">
          <div className="flex items-center gap-3">
            <button
              onClick={onMenuClick}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/40 bg-white/60 text-slate-600 shadow-md shadow-white/40 transition-transform duration-300 hover:-translate-y-0.5 hover:bg-white/80 dark:border-white/10 dark:bg-white/10 dark:text-slate-200 md:hidden"
              aria-label="Open menu"
            >
              <Icon name="menu" className="h-5 w-5" />
            </button>

            {/* Logo: Visible on small screens (mobile/tablet) OR when there is space (lg/xl) if desired, but user said "when screen have space". 
                For now, let's bring it back for mobile/tablet where sidebar is hidden. 
                And if user wanted it "when screen have space" on desktop, maybe they mean next to the title? 
                Let's stick to showing it on mobile/tablet (md:hidden) first as it's definitely needed there. 
            */}
            <div className="flex items-center gap-2 md:hidden">
              <img src={LOGO_URL} alt="Edusimulate" className="h-8 w-auto" />
              <span className="text-lg font-bold text-slate-900 dark:text-white hidden sm:block">Edusimulate</span>
            </div>
          </div>

          <div className="flex justify-center md:flex md:flex-col md:items-start md:justify-center">
            {/* Mobile Title (hidden on tiny screens if logo takes space, or keeping it as is) */}
            <div className="md:hidden hidden sm:block">
              <div className="inline-flex max-w-[12rem] items-center gap-2 rounded-xl border border-white/40 bg-white/70 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-600 shadow-sm shadow-white/40 backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:text-slate-200">
                <Icon name="sparkle" className="h-3 w-3 text-brand-primary" />
                <span className="truncate">{pageTitle}</span>
              </div>
            </div>
            <div className="hidden flex-col md:flex">
              <span className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500 dark:text-slate-400">
                {pageSubtitle ?? 'Now viewing'}
              </span>
              <span className="mt-1 text-lg font-semibold tracking-[0.2em] text-slate-700 dark:text-slate-100">
                {pageTitle}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 md:gap-5">
            {/* Chat */}
            <Link to="/chat">
              <button
                className={`
                  flex h-10 w-10 items-center justify-center rounded-xl border border-white/40 bg-white/60 text-slate-600 shadow-sm shadow-white/40 transition-all duration-300 hover:scale-105 hover:bg-white/80 hover:text-brand-primary dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:text-white relative group
                `}
                aria-label="Chat"
              >
                <Icon name="message-circle" className="h-5 w-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 group-hover:scale-110 transition-transform"></span>
              </button>
            </Link>

            {/* Theme Toggle Button - Visible when space permits (hidden on very small screens if crowded, but usually fine) */}
            <button
              onClick={() => onThemeToggle(!isDarkMode)}
              className="group flex h-10 w-10 items-center justify-center rounded-xl border border-white/40 bg-white/60 text-slate-600 shadow-sm shadow-white/40 transition-all duration-300 hover:scale-105 hover:bg-white/80 hover:text-brand-primary dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:text-white"
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              <div className="relative h-5 w-5 overflow-hidden">
                <div className={`absolute inset-0 transform transition-transform duration-500 ${isDarkMode ? 'translate-y-0' : '-translate-y-8'}`}>
                  <Icon name="moon" className="h-5 w-5" />
                </div>
                <div className={`absolute inset-0 transform transition-transform duration-500 ${isDarkMode ? 'translate-y-8' : 'translate-y-0'}`}>
                  <Icon name="sun" className="h-5 w-5" />
                </div>
              </div>
            </button>

            <div className="hidden flex-col text-right sm:flex">
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-200">{user.name}</span>
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-400">Learner</span>
            </div>
            <div className="relative">
              <span className="absolute inset-0 rounded-full bg-brand-primary/40 opacity-60 blur-md" />
              <img
                src={user.avatar}
                alt={user.name}
                className="relative h-11 w-11 rounded-full border-2 border-white/70 shadow-[0_6px_18px_rgba(43,131,198,0.35)] dark:border-white/30"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
