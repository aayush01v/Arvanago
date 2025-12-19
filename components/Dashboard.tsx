import React, { memo, useMemo } from 'react';
import { User, Course } from '../types.ts';
import Icon from './common/Icon.tsx';
import StudentAnalytics from './StudentAnalytics.tsx';
import { useScrollAnimation } from '../hooks/useScrollAnimation.ts';

interface DashboardProps {
  user: User;
  courses: Course[];
  navigateToFilteredCourses: (category: string) => void;
  navigateToCourse: (course: Course) => void;
}

interface StatCardProps {
  icon: string;
  value: string;
  label: string;
  trend?: string;
}

const StatCardComponent: React.FC<StatCardProps> = ({ icon, value, label, trend }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
          <Icon name={icon} className="w-5 h-5" />
        </div>
        {trend && <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full dark:bg-green-900/20 dark:text-green-400">{trend}</span>}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</p>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{label}</p>
      </div>
    </div>
  );
};

const StatCard = memo(StatCardComponent);

interface DashboardCourseCardProps {
  course: Course;
  navigateToCourse: (course: Course) => void;
}

const DashboardCourseCardComponent: React.FC<DashboardCourseCardProps> = ({ course, navigateToCourse }) => {
  return (
    <div className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md hover:border-brand-primary/20 transition-all duration-300">
      <div className="flex flex-col h-full">
        <div className="relative h-40 overflow-hidden">
          <img
            src={course.thumbnailUrl ?? course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-1 rounded-md bg-white/90 dark:bg-slate-900/90 backdrop-blur text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm">
              {course.category}
            </span>
          </div>
        </div>

        <div className="p-5 flex flex-col flex-grow">
          <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-2 line-clamp-1">{course.title}</h3>

          <div className="mt-auto pt-4 space-y-4">
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                <span>Progress</span>
                <span>{course.progress}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-brand-primary h-full rounded-full transition-all duration-500"
                  style={{ width: `${course.progress}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => navigateToCourse(course)}
              className="w-full py-2.5 px-4 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
            >
              <span>Continue</span>
              <Icon name="arrowRight" className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardCourseCard = memo(DashboardCourseCardComponent);

interface CategoryCardProps {
  category: { name: string; icon: string; color: string };
  navigateToFilteredCourses: (category: string) => void;
}

const CategoryCardComponent: React.FC<CategoryCardProps> = ({ category, navigateToFilteredCourses }) => {
  // Parsing color to use standard borders instead of bg opacity
  const activeColorClass = category.color.replace('bg-', 'text-');

  return (
    <button
      onClick={() => navigateToFilteredCourses(category.name)}
      className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-primary/30 hover:shadow-md transition-all text-left group"
    >
      <div className={`p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 group-hover:${activeColorClass}-600 transition-colors`}>
        <Icon name={category.icon} className="w-6 h-6" />
      </div>
      <span className="font-medium text-sm text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white">
        {category.name}
      </span>
    </button>
  );
};

const CategoryCard = memo(CategoryCardComponent);

const CATEGORY_DETAILS = [
  { name: 'NEET', icon: 'neet', color: 'bg-red-500' },
  { name: 'IIT JEE', icon: 'iit', color: 'bg-blue-500' },
  { name: 'School Preparation', icon: 'school', color: 'bg-green-500' },
  { name: 'UPSC', icon: 'upsc', color: 'bg-purple-500' },
  { name: 'Govt Job Exams', icon: 'government', color: 'bg-yellow-500' },
  { name: 'Defence', icon: 'defence', color: 'bg-indigo-500' },
] as const;

const Dashboard: React.FC<DashboardProps> = ({ user, courses, navigateToFilteredCourses, navigateToCourse }) => {
  const ongoingCourses = useMemo(() =>
    user.ongoingCourses
      .map(courseId => courses.find(c => c.id === courseId))
      .filter((c): c is Course => !!c),
    [user.ongoingCourses, courses]
  );

  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Overview</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Welcome back, {user.name.split(' ')[0]}. Here's what's happening today.
          </p>
        </div>
        <div className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-lg shadow-sm">
          {currentDate}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard icon="star" value={user.points.toLocaleString()} label="Total Points" trend="+12% this week" />
        <StatCard icon="zap" value={`${user.streak} Days`} label="Current Streak" trend="Keep it up!" />
        <StatCard icon="check" value="8" label="Completed Courses" />
      </div>

      {/* Main Content Area: Analytics + Ongoing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Analytics (2/3 width) */}
        <div className="lg:col-span-2 space-y-8">
          <StudentAnalytics user={user} courses={courses} />

          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Continue Learning</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {ongoingCourses.length > 0 ? (
                ongoingCourses.map((course) => (
                  <DashboardCourseCard key={course.id} course={course} navigateToCourse={navigateToCourse} />
                ))
              ) : (
                <div className="col-span-full py-12 text-center rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-slate-500 font-medium">No active courses yet.</p>
                  <button onClick={() => navigateToFilteredCourses('all')} className="text-brand-primary text-sm font-semibold mt-2 hover:underline">Browse Catalog</button>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Discover (1/3 width) */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Explore Items</h3>
          <div className="grid grid-cols-1 gap-3">
            {CATEGORY_DETAILS.map(cat => (
              <CategoryCard key={cat.name} category={cat} navigateToFilteredCourses={navigateToFilteredCourses} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;