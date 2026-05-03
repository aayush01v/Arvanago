import React from 'react';
import { User } from '@/types';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

interface AuthenticatedLayoutShellProps {
  user: User | null;
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
  isDarkMode: boolean;
  onThemeToggle: (isDark: boolean) => void;
  isScrolled: boolean;
  pageTitle: string;
  pageSubtitle?: string;
  isMobile: boolean;
  pathname: string;
  unreadCount?: number;
  onSearchClick: () => void;
  children: React.ReactNode;
  mainPanelRef: React.RefObject<HTMLDivElement>;
  backgroundRef: React.RefObject<HTMLDivElement>;
  onPanelPointerMove: (event: React.MouseEvent<HTMLDivElement>) => void;
  onPanelPointerLeave: () => void;
}

const AuthenticatedLayoutShell: React.FC<AuthenticatedLayoutShellProps> = ({
  user,
  isSidebarOpen,
  setSidebarOpen,
  isDarkMode,
  onThemeToggle,
  isScrolled,
  pageTitle,
  pageSubtitle,
  isMobile,
  pathname,
  unreadCount = 0,
  onSearchClick,
  children,
  mainPanelRef,
  backgroundRef,
  onPanelPointerMove,
  onPanelPointerLeave,
}) => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-white to-slate-200 text-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-gray-200">
      <div className="pointer-events-none fixed -left-24 -top-24 h-72 w-72 rounded-full opacity-70 will-change-transform dark:opacity-40" style={{ background: 'radial-gradient(circle, rgba(124, 58, 237, 0.4) 0%, transparent 70%)', animation: 'pulseGlow 14s ease-in-out infinite' }} />
      <div className="pointer-events-none fixed bottom-[-6rem] left-1/2 h-80 w-80 -translate-x-1/2 rounded-full opacity-70 will-change-transform dark:opacity-40" style={{ background: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, transparent 70%)', animation: 'pulseGlow 18s ease-in-out infinite reverse' }} />
      <div className="pointer-events-none fixed right-[-8rem] top-1/3 h-96 w-96 rounded-full opacity-60 will-change-transform dark:opacity-30" style={{ background: 'radial-gradient(circle, rgba(168, 85, 247, 0.35) 0%, transparent 70%)', animation: 'driftGlow 22s ease-in-out infinite' }} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(43,131,198,0.12),_transparent_55%)] dark:bg-[radial-gradient(circle_at_top,_rgba(43,131,198,0.15),_transparent_60%)]" />

      <div className="relative z-10 flex min-h-screen">
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isDarkMode={isDarkMode}
          setDarkMode={onThemeToggle}
          user={user}
        />
        <div
          ref={mainPanelRef}
          className={`relative flex flex-1 flex-col md:ml-56 ${pathname === '/chat' && isMobile ? 'overflow-hidden' : 'overflow-y-auto'}`}
          onMouseMove={onPanelPointerMove}
          onMouseLeave={onPanelPointerLeave}
        >
          <div
            ref={backgroundRef}
            className="pointer-events-none absolute inset-0 opacity-90 transition-[background] duration-700 ease-out"
            style={{
              background: `radial-gradient(ellipse at 50% 50%, rgba(43,131,198,0.16), rgba(43,131,198,0) 55%)`,
            }}
          />
          <Header
            user={user}
            onMenuClick={() => setSidebarOpen(true)}
            isScrolled={isScrolled}
            pageTitle={pageTitle}
            pageSubtitle={pageSubtitle}
            isDarkMode={isDarkMode}
            onThemeToggle={onThemeToggle}
            unreadChatCount={unreadCount}
            onSearchClick={onSearchClick}
          />
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthenticatedLayoutShell;
