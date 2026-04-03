import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Course, User } from '@/types';
import IncomingCallListener from '@/components/IncomingCallListener';
import AuthenticatedLayoutShell from '@/components/AuthenticatedLayoutShell';

export interface SidebarLayoutContext {
  user: User | null;
  courses: Course[];
  onProfileUpdate: (updates: Partial<User>) => void;
  coursesLoading: boolean;
  coursesError: string | null;
  refreshCourses: (options?: { forceRefresh?: boolean }) => Promise<void>;
  isDarkMode: boolean;
  onThemeToggle: (isDark: boolean) => void;
}

interface SidebarLayoutProps {
  user: User | null;
  courses: Course[];
  isDarkMode: boolean;
  onThemeToggle: (isDark: boolean) => void;
  onProfileUpdate: (updates: Partial<User>) => void;
  coursesLoading: boolean;
  coursesError: string | null;
  onRefreshCourses: (options?: { forceRefresh?: boolean }) => Promise<void>;
  children?: React.ReactNode;
}

const SidebarLayout: React.FC<SidebarLayoutProps> = ({
  user,
  courses,
  isDarkMode,
  onThemeToggle,
  onProfileUpdate,
  coursesLoading,
  coursesError,
  onRefreshCourses,
  children,
}) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const mainPanelRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    const panel = mainPanelRef.current;
    if (!panel) return;

    const handleScroll = () => setIsScrolled(panel.scrollTop > 10);
    panel.addEventListener('scroll', handleScroll, { passive: true });
    return () => panel.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const panel = mainPanelRef.current;
    if (panel) {
      panel.scrollTo({ top: 0 });
    }
  }, [location.pathname]);

  const handlePanelPointerMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const panel = mainPanelRef.current;
    const background = backgroundRef.current;

    if (!panel || !background) {
      return;
    }

    const rect = panel.getBoundingClientRect();
    const nextX = ((event.clientX - rect.left) / rect.width) * 100;
    const nextY = ((event.clientY - rect.top) / rect.height) * 100;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      background.style.background = `radial-gradient(ellipse at ${nextX}% ${nextY}%, rgba(43,131,198,0.16), rgba(43,131,198,0) 55%)`;
    });
  }, []);

  const handlePanelPointerLeave = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(() => {
      const background = backgroundRef.current;
      if (background) {
        background.style.background = `radial-gradient(ellipse at 50% 50%, rgba(43,131,198,0.16), rgba(43,131,198,0) 55%)`;
      }
    });
  }, []);

  useEffect(
    () => () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    },
    [],
  );

  const currentPage = useMemo(() => {
    const segments = location.pathname.split('?')[0]?.split('/').filter(Boolean) ?? [];
    const [first, second, third, fourth] = segments;

    const staticPages = new Map<string, { title: string; subtitle: string }>([
      ['dashboard', { title: 'Dashboard', subtitle: 'Your learning HQ' }],
      ['my-learnings', { title: 'My Learnings', subtitle: 'Progress tracker' }],
      ['explore', { title: 'Explore Courses', subtitle: 'Discover new skills' }],
      ['leaderboard', { title: 'Leaderboard', subtitle: 'Global rankings' }],
      ['mynotes', { title: 'My Notes', subtitle: 'Vaults and linked notes' }],
      ['profile', { title: 'Profile', subtitle: 'Personal hub' }],
    ]);

    if (!first) {
      return staticPages.get('dashboard')!;
    }

    const staticPage = staticPages.get(first);
    if (staticPage) {
      return staticPage;
    }

    if (first === 'courses' && second && !third) {
      const matchedCourse = courses.find((course) => course.id === second);
      if (matchedCourse) {
        return { title: matchedCourse.title, subtitle: 'Course overview' };
      }
      return { title: 'Course overview', subtitle: 'Course details' };
    }

    if (first === 'courses' && second && third === 'lectures' && fourth) {
      const matchedCourse = courses.find((course) => course.id === second);
      const matchedLecture = matchedCourse?.lectures.find((lecture) => lecture.id === fourth);

      if (matchedCourse && matchedLecture) {
        return { title: matchedLecture.title, subtitle: matchedCourse.title };
      }

      if (matchedCourse) {
        return { title: 'Course lecture', subtitle: matchedCourse.title };
      }

      return { title: 'Course lecture', subtitle: 'Learning session' };
    }

    return staticPages.get('dashboard')!;
  }, [courses, location.pathname]);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const unreadCount = 0;
  const UserSearchModal = React.lazy(() => import('./UserSearchModal'));

  const sidebarContext = useMemo(
    () => ({
      user,
      courses,
      onProfileUpdate,
      coursesLoading,
      coursesError,
      refreshCourses: onRefreshCourses,
      isDarkMode,
      onThemeToggle,
    }),
    [
      user,
      courses,
      onProfileUpdate,
      coursesLoading,
      coursesError,
      onRefreshCourses,
      isDarkMode,
      onThemeToggle,
    ],
  );

  return (
    <>
      <IncomingCallListener currentUser={user} />
      <AuthenticatedLayoutShell
        user={user}
        isSidebarOpen={isSidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isDarkMode={isDarkMode}
        onThemeToggle={onThemeToggle}
        isScrolled={isScrolled}
        pageTitle={currentPage.title}
        pageSubtitle={currentPage.subtitle}
        isMobile={isMobile}
        pathname={location.pathname}
        unreadCount={unreadCount}
        onSearchClick={() => setIsSearchModalOpen(true)}
        mainPanelRef={mainPanelRef}
        backgroundRef={backgroundRef}
        onPanelPointerMove={handlePanelPointerMove}
        onPanelPointerLeave={handlePanelPointerLeave}
      >
        <main
          className={`relative ${location.pathname === '/chat' ? 'z-40 h-[calc(100vh-4rem)] overflow-hidden p-0 sm:p-4 md:h-auto' : 'z-10 px-2 pb-24 pt-4 sm:px-6 sm:pb-6 lg:px-10'}`}
        >
          {location.pathname === '/chat' ? (
            <div className="mx-auto h-full w-full max-w-7xl">{children || <Outlet context={sidebarContext} />}</div>
          ) : (
            <div className="relative mx-auto max-w-6xl">
              <div className="glass-panel relative overflow-hidden rounded-[1.5rem] border border-white/50 bg-white/90 shadow-xl transition-colors duration-500 dark:border-white/10 dark:bg-slate-900/90 dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] md:rounded-[2rem]">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25),_transparent_65%)] dark:bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.2),_transparent_70%)]" />
                <div className="pointer-events-none absolute -left-10 -top-20 h-40 w-40 rounded-full bg-brand-primary/30 opacity-70 blur-3xl" style={{ animation: 'pulseGlow 16s ease-in-out infinite' }} />
                <div className="pointer-events-none absolute bottom-[-3rem] right-[-2rem] h-48 w-48 rounded-full bg-sky-500/40 opacity-80 blur-3xl" style={{ animation: 'pulseGlow 20s ease-in-out infinite alternate' }} />
                <div className="relative z-10 p-3 sm:p-6 lg:p-10">
                  <div className="animate-fade-in-up">{children || <Outlet context={sidebarContext} />}</div>
                </div>
              </div>
            </div>
          )}
        </main>
      </AuthenticatedLayoutShell>

      {isSearchModalOpen && user && (
        <React.Suspense fallback={null}>
          <UserSearchModal
            isOpen={isSearchModalOpen}
            onClose={() => setIsSearchModalOpen(false)}
          />
        </React.Suspense>
      )}
    </>
  );
};

export default SidebarLayout;
