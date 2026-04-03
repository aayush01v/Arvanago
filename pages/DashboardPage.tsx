import React, { useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import Dashboard from '@/components/Dashboard.tsx';
import { Course } from '@/types';
import { SidebarLayoutContext } from '@/components/SidebarLayout.tsx';
import Skeleton from '@/components/ui/Skeleton.tsx';

const DashboardPage: React.FC = () => {
  const { user, courses, coursesLoading } = useOutletContext<SidebarLayoutContext>();
  const navigate = useNavigate();

  const handleNavigateToFilteredCourses = useCallback(
    (category: string) => {
      const params = new URLSearchParams();
      params.set('category', category);
      navigate({ pathname: '/explore', search: params.toString() });
    },
    [navigate],
  );

  const handleCourseSelect = useCallback(
    (course: Course) => {
      navigate(`/courses/${course.id}/learn`);
    },
    [navigate],
  );

  if (coursesLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-5 w-80 max-w-full" />
          </div>
          <Skeleton className="h-10 w-40 rounded-full" />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <div key={index} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <Skeleton className="mt-6 h-8 w-24" />
              <Skeleton className="mt-2 h-5 w-36" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {[0, 1, 2].map((index) => (
              <div key={index} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <Skeleton className="h-40 w-full rounded-xl" />
                <Skeleton className="mt-4 h-6 w-3/5" />
                <Skeleton className="mt-2 h-4 w-4/5" />
                <Skeleton className="mt-4 h-10 w-full rounded-xl" />
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-1 xl:grid-cols-2">
              {[0, 1, 2, 3].map((index) => (
                <div key={index} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                  <Skeleton className="h-14 w-14 rounded-full" />
                  <Skeleton className="mt-3 h-4 w-20" />
                  <Skeleton className="mt-2 h-3 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Dashboard
      user={user}
      courses={courses}
      navigateToFilteredCourses={handleNavigateToFilteredCourses}
      navigateToCourse={handleCourseSelect}
    />
  );
};

export default DashboardPage;
