import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar.tsx';
import Header from './Header.tsx';
import { Course, User } from '@/types';

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
}) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const mainPanelRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const backgroundRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();




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

  useEffect(() => () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  const currentPage = useMemo(() => {
    const segments = location.pathname.split('?')[0]?.split('/').filter(Boolean) ?? [];
    const [first, second, third, fourth] = segments;

    const staticPages = new Map<string, { title: string; subtitle: string }>([
      ['dashboard', { title: 'Dashboard', subtitle: 'Your learning HQ' }],
      ['my-learnings', { title: 'My Learnings', subtitle: 'Progress tracker' }],
      ['explore', { title: 'Explore Courses', subtitle: 'Discover new skills' }],
      ['leaderboard', { title: 'Leaderboard', subtitle: 'Global rankings' }],
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

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Detect mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;



  // Calculate unread count (Deprecated, chat moved to separate page)
  const unreadCount = 0;

  const UserSearchModal = React.lazy(() => import('./UserSearchModal'));




  return (
    <>
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-white to-slate-200 text-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-gray-200">

        <div className="pointer-events-none fixed -top-24 -left-24 h-72 w-72 rounded-full opacity-70 dark:opacity-40 will-change-transform" style={{ background: 'radial-gradient(circle, rgba(124, 58, 237, 0.4) 0%, transparent 70%)', animation: 'pulseGlow 14s ease-in-out infinite' }} />
        <div className="pointer-events-none fixed bottom-[-6rem] left-1/2 h-80 w-80 -translate-x-1/2 rounded-full opacity-70 dark:opacity-40 will-change-transform" style={{ background: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, transparent 70%)', animation: 'pulseGlow 18s ease-in-out infinite reverse' }} />
        <div className="pointer-events-none fixed top-1/3 right-[-8rem] h-96 w-96 rounded-full opacity-60 dark:opacity-30 will-change-transform" style={{ background: 'radial-gradient(circle, rgba(168, 85, 247, 0.35) 0%, transparent 70%)', animation: 'driftGlow 22s ease-in-out infinite' }} />
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
            className={`relative flex flex-1 flex-col md:ml-56 ${location.pathname === '/chat' && isMobile ? 'overflow-hidden' : 'overflow-y-auto'}`}
            onMouseMove={handlePanelPointerMove}
            onMouseLeave={handlePanelPointerLeave}
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
              pageTitle={currentPage.title}
              pageSubtitle={currentPage.subtitle}
              isDarkMode={isDarkMode}
              onThemeToggle={onThemeToggle}
              unreadChatCount={unreadCount}
              onSearchClick={() => setIsSearchModalOpen(true)}
            />
            <main className={`relative z-10 flex-1 ${location.pathname === '/chat' ? 'p-0 sm:p-4 h-[calc(100vh-4rem)] md:h-auto overflow-hidden' : 'px-2 pb-24 pt-4 sm:px-6 sm:pb-6 lg:px-10'}`}>
              {location.pathname === '/chat' ? (
                <div className="h-full w-full max-w-7xl mx-auto">
                  <Outlet
                    context={{
                      user,
                      courses,
                      onProfileUpdate,
                      coursesLoading,
                      coursesError,
                      refreshCourses: onRefreshCourses,
                      isDarkMode,
                      onThemeToggle,
                    }}
                  />
                </div>
              ) : (
                <div className="relative mx-auto max-w-6xl">
                  <div className="glass-panel relative overflow-hidden rounded-[1.5rem] md:rounded-[2rem] border border-white/50 bg-white/90 shadow-xl transition-colors duration-500 dark:border-white/10 dark:bg-slate-900/90 dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25),_transparent_65%)] dark:bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.2),_transparent_70%)]" />
                    <div className="pointer-events-none absolute -top-20 -left-10 h-40 w-40 rounded-full bg-brand-primary/30 blur-3xl opacity-70" style={{ animation: 'pulseGlow 16s ease-in-out infinite' }} />
                    <div className="pointer-events-none absolute bottom-[-3rem] right-[-2rem] h-48 w-48 rounded-full bg-sky-500/40 blur-3xl opacity-80" style={{ animation: 'pulseGlow 20s ease-in-out infinite alternate' }} />
                    <div className="relative z-10 p-3 sm:p-6 lg:p-10">
                      <div className="animate-fade-in-up">
                        <Outlet
                          context={{
                            user,
                            courses,
                            onProfileUpdate,
                            coursesLoading,
                            coursesError,
                            refreshCourses: onRefreshCourses,
                            isDarkMode,
                            onThemeToggle,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>

        {/* Global Chat Widget */}
        <React.Suspense fallback={null}>

          <UserSearchModal
            isOpen={isSearchModalOpen}
            onClose={() => setIsSearchModalOpen(false)}
          />
        </React.Suspense>

        {/* Mobile Bottom Navigation */}

      </div>
    </>
  );
};

export default SidebarLayout;
