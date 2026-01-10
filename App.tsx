
import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import { HelmetProvider } from 'react-helmet-async';
import SEO from './components/SEO';
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Course, User } from './types.ts';
import { auth } from './services/firebase.ts';
import {
  clearCoursesCache,
  getCourses,
  getOrCreateUser,
  updateUserThemePreference,
  updateUserProfile,
} from './services/firestoreService.ts';
import SidebarLayout from './components/SidebarLayout.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import { PENDING_COURSE_STORAGE_KEY, PENDING_ACTION_STORAGE_KEY } from './constants.ts';
import HomePage from '@/pages/HomePage';
import { safeLocalStorage } from '@/utils/safeStorage';

const GLOBAL_THEME_KEY = 'edusimulate:theme';

// Temporarily using direct imports instead of lazy to test navigation
import DashboardPage from '@/pages/DashboardPage';
import MyLearningsPage from '@/pages/MyLearningsPage';
import PublicExplorePage from '@/pages/PublicExplorePage';
import LeaderboardPage from '@/pages/LeaderboardPage';
import ChatPage from './pages/ChatPage';
import ProfilePage from '@/pages/ProfilePage';
import PublicProfilePage from '@/pages/PublicProfilePage';
import CourseDetailPage from '@/pages/CourseDetailPage';
import CourseLecturePage from '@/pages/CourseLecturePage';
import CourseLearnPage from '@/pages/CourseLearnPage';
import LoginRoute from '@/pages/LoginRoute';
import CoursePreviewPage from '@/pages/CoursePreviewPage';
import ExploreCoursesPage from '@/pages/ExploreCoursesPage';
import SettingsPage from '@/pages/SettingsPage';
import AdminPage from '@/pages/AdminPage';
import AboutPage from '@/pages/AboutPage';
import AdminLoginPage from '@/pages/AdminLoginPage';
import NotFoundPage from '@/pages/NotFoundPage';
import BlogPage from '@/pages/BlogPage';
import BlogPostPage from '@/pages/BlogPostPage';
import AdminBlogPage from '@/pages/AdminBlogPage';
import MyNotesPage from '@/pages/MyNotesPage';
import PublicNotePage from '@/pages/PublicNotePage';
import VideoPreviewPage from '@/pages/VideoPreviewPage';
import AdminRoute from '@/components/AdminRoute';

const SuspenseFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-brand-primary" />
  </div>
);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const stored = safeLocalStorage.getItem(GLOBAL_THEME_KEY);
    return stored === 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  const fetchSequenceRef = useRef(0);
  const coursesLengthRef = useRef(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    coursesLengthRef.current = courses.length;
  }, [courses.length]);

  const fetchCourseData = useCallback(
    async (options?: { forceRefresh?: boolean }) => {
      const requestId = ++fetchSequenceRef.current;
      const shouldShowLoading = options?.forceRefresh || coursesLengthRef.current === 0;

      if (shouldShowLoading) {
        setCoursesLoading(true);
      }

      try {
        const courseData = await getCourses({ forceRefresh: options?.forceRefresh });
        if (fetchSequenceRef.current === requestId) {
          setCourses(courseData);
          coursesLengthRef.current = courseData.length;
          setCoursesError(null);
        }
      } catch (error) {
        console.error('Failed to fetch courses:', error);
        if (fetchSequenceRef.current === requestId) {
          setCoursesError("We couldn't load courses right now. Please try again later.");
        }
      } finally {
        if (shouldShowLoading && fetchSequenceRef.current === requestId) {
          setCoursesLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    void fetchCourseData();
  }, [fetchCourseData]);

  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        if (!firebaseUser.emailVerified) {
          // Force sign out if email is not verified
          await auth.signOut();
          setUser(null);
          setAuthReady(true);
          return;
        }

        try {
          const appUser = await getOrCreateUser(
            firebaseUser.uid,
            firebaseUser.displayName,
            firebaseUser.email,
            firebaseUser.photoURL,
          );
          setUser(appUser);
          setAuthError(null);
        } catch (error: any) {
          console.error('Error getting user data:', error);
          await auth.signOut(); // Force sign out if getOrCreateUser fails (e.g. disabled)
          setUser(null);
          setAuthError(error.message || "Failed to load user profile. Please try again.");
        } finally {
          setAuthReady(true);
          void fetchCourseData({ forceRefresh: true });
        }
      } else {
        setUser(null);
        setAuthError(null);
        clearCoursesCache();
        setAuthReady(true);
        void fetchCourseData({ forceRefresh: true });
      }
    });

    return () => unsubscribe();
  }, [fetchCourseData]);

  const persistThemePreference = useCallback((mode: boolean, currentUser: User | null) => {
    const theme = mode ? 'dark' : 'light';
    if (currentUser) {
      safeLocalStorage.setItem(`${GLOBAL_THEME_KEY}:${currentUser.uid}`, theme);
    } else {
      safeLocalStorage.setItem(GLOBAL_THEME_KEY, theme);
    }
  }, []);

  const handleThemeToggle = useCallback(
    (mode: boolean) => {
      setIsDarkMode(mode);
      persistThemePreference(mode, user);
      if (user) {
        updateUserThemePreference(user.uid, mode ? 'dark' : 'light').catch((error) =>
          console.error('Failed to update theme preference:', error),
        );
      }
    },
    [persistThemePreference, user],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (user) {
      const stored = safeLocalStorage.getItem(`${GLOBAL_THEME_KEY}:${user.uid}`);
      const preference = stored ?? user.themePreference ?? 'light';
      const dark = preference === 'dark';

      setIsDarkMode(dark);
      persistThemePreference(dark, user);
    } else {
      const stored = safeLocalStorage.getItem(GLOBAL_THEME_KEY);
      setIsDarkMode(stored === 'dark');
    }
  }, [user, persistThemePreference]);

  const handleProfileUpdate = useCallback((updates: Partial<User>) => {
    setUser((previous) => (previous ? { ...previous, ...updates } : previous));
  }, []);

  // After auth + courses are ready, handle pending course redirect & pending actions
  useEffect(() => {
    if (!authReady || !user) return;

    const pendingCourseId = safeLocalStorage.getItem(PENDING_COURSE_STORAGE_KEY);
    const pendingAction = safeLocalStorage.getItem(PENDING_ACTION_STORAGE_KEY);

    if (!pendingCourseId || coursesLoading) return;

    const matchedCourse = courses.find((course) => course.id === pendingCourseId);

    if (matchedCourse) {
      safeLocalStorage.removeItem(PENDING_COURSE_STORAGE_KEY);
      safeLocalStorage.removeItem(PENDING_ACTION_STORAGE_KEY);

      // Handle Wishlist Action post-login
      if (pendingAction === 'wishlist') {
        const addToWishlist = async () => {
          // Check if already in wishlist to avoid duplicates
          if (!user.wishlist.includes(matchedCourse.id)) {
            const updatedWishlist = [...user.wishlist, matchedCourse.id];
            // Update UI instantly
            setUser((prev) => (prev ? { ...prev, wishlist: updatedWishlist } : prev));
            // Persist
            await updateUserProfile(user.uid, { wishlist: updatedWishlist });
          }
          // Navigate with state to show toast
          navigate(`/courses/${matchedCourse.id}`, {
            replace: true,
            state: { showWishlistToast: true },
          });
        };

        void addToWishlist();
        return;
      }

      // Default Redirect Logic
      navigate(`/courses/${matchedCourse.id}`, {
        replace: true,
      });
    } else {
      // No matching course found or no pending course, default routing handled below/already done
      // Just clean up if pendingCourseId existed but course wasn't found
      safeLocalStorage.removeItem(PENDING_COURSE_STORAGE_KEY);
      safeLocalStorage.removeItem(PENDING_ACTION_STORAGE_KEY);
    }
  }, [authReady, user, coursesLoading, courses, navigate]); // Removed location.pathname from dependency to avoid loops

  const handlePublicCourseSelect = useCallback(
    (course: Course) => {
      navigate(`/courses/${course.id}`);
    },
    [navigate, user],
  );

  const handleExploreCourseNavigate = useCallback(
    (course: Course) => {
      if (user) {
        navigate(`/courses/${course.id}`);
        return;
      }

      // Guest → remember intention and go to login
      safeLocalStorage.setItem(PENDING_COURSE_STORAGE_KEY, course.id);
      navigate('/login');
    },
    [navigate, user],
  );

  const CourseRouteWrapper: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const isEnrolled = Boolean(
      courseId &&
      (user?.enrolledCourses?.includes(courseId) || user?.ongoingCourses?.includes(courseId)),
    );

    if (!authReady) {
      return <SuspenseFallback />;
    }

    // DEBUG: IGNORE ENROLLMENT CHECK TO TEST PAYMENT
    // if (!user || !isEnrolled) {
    if (true) {
      return (
        <CoursePreviewPage
          courses={courses}
          isDarkMode={isDarkMode}
          onToggleTheme={handleThemeToggle}
          user={user}
          isLoading={coursesLoading}
          onProfileUpdate={handleProfileUpdate}
        />
      );
    }

    return (
      <SidebarLayout
        user={user}
        courses={courses}
        isDarkMode={isDarkMode}
        onThemeToggle={handleThemeToggle}
        onProfileUpdate={handleProfileUpdate}
        coursesLoading={coursesLoading}
        coursesError={coursesError}
        onRefreshCourses={fetchCourseData}
      >
        {/* If enrolled and strictly on the detail page, redirect to learn page to avoid flash */}
        {isEnrolled && location.pathname === `/courses/${courseId}` ? (
          <Navigate to={`/courses/${courseId}/learn`} replace />
        ) : (
          <Outlet />
        )}
      </SidebarLayout>
    );
  };



  return (
    <HelmetProvider>
      <SEO />
      <ErrorBoundary>
        <Suspense fallback={<SuspenseFallback />}>
          {!authReady ? (
            <SuspenseFallback />
          ) : (
            <Routes>
              {/* PUBLIC ROUTES */}
              <Route
                path="/"
                element={
                  user ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <HomePage
                      user={user}
                      courses={courses}
                      isLoading={coursesLoading}
                      error={coursesError}
                      onCourseSelect={handlePublicCourseSelect}
                      onRefreshCourses={() => fetchCourseData({ forceRefresh: true })}
                    />
                  )
                }
              />


              <Route path="/about" element={<AboutPage />} />

              <Route path="/login" element={<LoginRoute user={user} authError={authError} />} />

              <Route element={<CourseRouteWrapper />}>
                <Route path="/courses/:courseId" element={<CourseDetailPage />} />
              </Route>

              {/* PUBLIC PROFILE (Shared Layout, No Auth Required) */}
              <Route
                element={
                  <SidebarLayout
                    user={user}
                    courses={courses}
                    isDarkMode={isDarkMode}
                    onThemeToggle={handleThemeToggle}
                    onProfileUpdate={handleProfileUpdate}
                    coursesLoading={coursesLoading}
                    coursesError={coursesError}
                    onRefreshCourses={fetchCourseData}
                  />
                }
              >
                <Route path="/u/:username" element={<PublicProfilePage />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:id" element={<BlogPostPage />} />
              </Route>

              {/* PRIVATE ROUTES (AUTH REQUIRED) */}
              <Route element={<ProtectedRoute user={user} authReady={authReady} />}>
                <Route
                  element={
                    <SidebarLayout
                      user={user!}
                      courses={courses}
                      isDarkMode={isDarkMode}
                      onThemeToggle={handleThemeToggle}
                      onProfileUpdate={handleProfileUpdate}
                      coursesLoading={coursesLoading}
                      coursesError={coursesError}
                      onRefreshCourses={fetchCourseData}
                    />
                  }
                >
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/my-learnings" element={<MyLearningsPage />} />
                  <Route path="/mynotes" element={<MyNotesPage />} />
                  <Route path="/note/:noteId" element={<PublicNotePage />} />
                  <Route path="/explore" element={<ExploreCoursesPage />} />
                  <Route path="/leaderboard" element={<LeaderboardPage />} />
                  <Route path="/chat" element={<ChatPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  {/* Public Profile moved out to allow guest access */}
                  <Route path="/courses/:courseId/learn" element={<CourseLearnPage />} />
                  <Route
                    path="/courses/:courseId/lectures/:lectureId"
                    element={<CourseLecturePage />}
                  />
                </Route>
              </Route>

              {/* ADMIN ROUTES */}
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route
                path="/admin"
                element={
                  <AdminRoute user={user} authReady={authReady}>
                    <AdminPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/blog"
                element={
                  <AdminRoute user={user} authReady={authReady}>
                    <SidebarLayout
                      user={user}
                      courses={courses}
                      isDarkMode={isDarkMode}
                      onThemeToggle={handleThemeToggle}
                      onProfileUpdate={handleProfileUpdate}
                      coursesLoading={coursesLoading}
                      coursesError={coursesError}
                      onRefreshCourses={fetchCourseData}
                    >
                      <AdminBlogPage />
                    </SidebarLayout>
                  </AdminRoute>
                }
              />

              <Route
                path="/preview"
                element={
                  <AdminRoute user={user} authReady={authReady}>
                    <SidebarLayout
                      user={user}
                      courses={courses}
                      isDarkMode={isDarkMode}
                      onThemeToggle={handleThemeToggle}
                      onProfileUpdate={handleProfileUpdate}
                      coursesLoading={coursesLoading}
                      coursesError={coursesError}
                      onRefreshCourses={fetchCourseData}
                    >
                      <VideoPreviewPage />
                    </SidebarLayout>
                  </AdminRoute>
                }
              />

              {/* CATCH-ALL */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          )}
        </Suspense>
      </ErrorBoundary>
    </HelmetProvider>
  );
};

export default App;
