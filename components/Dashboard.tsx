import React, { memo, useMemo } from 'react';
import { User, Course } from '../types.ts';
import Icon from './common/Icon.tsx';
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
  color: string;
  delay?: number;
}

const StatCardComponent: React.FC<StatCardProps> = ({ icon, value, label, color, delay = 0 }) => {
  const ref = useScrollAnimation();
  return (
    <div
      ref={ref}
      className="interactive-card bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm rounded-2xl p-6 flex items-center shadow-lg dark:shadow-dark-glow border border-white/50 dark:border-white/10 transition-all duration-300 hover:border-brand-primary/30 scroll-animate will-change-transform group"
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className={`p-4 rounded-full mr-5 ${color} bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}>
        <Icon name={icon} className={`w-7 h-7 text-${color.replace('bg-', '')}`} />
      </div>
      <div>
        <p className="text-3xl font-bold text-slate-800 dark:text-white drop-shadow-sm">{value}</p>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
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
  const ref = useScrollAnimation();
  return (
    <div
      ref={ref}
      className="interactive-card group relative flex flex-col rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl overflow-hidden scroll-animate will-change-transform hover:shadow-2xl hover:shadow-brand-primary/10"
    >
      <div className="relative h-48 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10 opacity-60 group-hover:opacity-40 transition-opacity" />
        <img
          src={course.thumbnailUrl ?? course.thumbnail}
          alt={course.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute bottom-4 left-4 z-20">
          <span className="inline-block px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs font-semibold text-white mb-2">
            {course.category}
          </span>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-grow relative">
        <h3 className="font-bold text-xl text-slate-900 dark:text-white mb-2 line-clamp-1">{course.title}</h3>

        <div className="mt-auto space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Progress</span>
              <span className="text-xs font-bold text-brand-primary drop-shadow-sm">{course.progress}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700/50 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-brand-primary to-brand-secondary h-full rounded-full shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                style={{ width: `${course.progress}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => navigateToCourse(course)}
            className="w-full py-3 rounded-xl bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary dark:text-brand-light font-bold border border-brand-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Icon name="play" className="w-4 h-4" />
            Continue Learning
          </button>
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
  const ref = useScrollAnimation();
  return (
    <button
      ref={ref}
      onClick={() => navigateToFilteredCourses(category.name)}
      className="scroll-animate group flex flex-col items-center justify-center p-6 rounded-3xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border border-white/50 dark:border-white/10 shadow-lg hover:shadow-xl hover:border-brand-primary/30 hover:-translate-y-1 transition-all duration-300"
    >
      <div className={`
        p-4 rounded-2xl mb-4 transition-all duration-300
        ${category.color} bg-opacity-10 dark:bg-opacity-20 
        group-hover:scale-110 group-hover:bg-opacity-20 dark:group-hover:bg-opacity-30
      `}>
        <Icon name={category.icon} className={`w-8 h-8 text-${category.color.replace('bg-', '')}-600 dark:text-${category.color.replace('bg-', '')}-400`} />
      </div>
      <span className="font-bold text-sm text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
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
  const welcomeRef = useScrollAnimation();
  const continueLearningRef = useScrollAnimation();
  const exploreRef = useScrollAnimation();

  const ongoingCourses = useMemo(() =>
    user.ongoingCourses
      .map(courseId => courses.find(c => c.id === courseId))
      .filter((c): c is Course => !!c),
    [user.ongoingCourses, courses]
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in space-y-12">
      {/* Header */}
      <div ref={welcomeRef} className="scroll-animate relative">
        {/* Optimized glow using radial gradient instead of heavy blur filter */}
        <div
          className="absolute -top-20 -left-20 w-64 h-64 rounded-full pointer-events-none opacity-40"
          style={{ background: 'radial-gradient(circle, rgba(124, 58, 237, 0.4) 0%, transparent 70%)' }}
        />
        <h1 className="relative text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
          Welcome back, <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent drop-shadow-sm">
            {user.name.split(' ')[0]}
          </span>
          <span className="text-3xl md:text-5xl ml-2">👋</span>
        </h1>
        <p className="mt-3 text-lg text-slate-600 dark:text-slate-300 font-medium max-w-xl">
          Your learning streak is on fire! Let's keep the momentum going.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        <StatCard icon="star" value={user.points.toLocaleString()} label="Points Earned" color="bg-yellow-400" />
        <StatCard icon="flame" value={`${user.streak} Days`} label="Learning Streak" color="bg-red-500" delay={100} />
        <StatCard icon="check" value="8" label="Courses Completed" color="bg-green-500" delay={200} />
      </div>

      {/* Ongoing Courses */}
      <section ref={continueLearningRef} className="scroll-animate space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Icon name="play" className="w-6 h-6 text-brand-primary" />
            Continue Learning
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {ongoingCourses.length > 0 ? (
            ongoingCourses.map((course) => (
              <DashboardCourseCard key={course.id} course={course} navigateToCourse={navigateToCourse} />
            ))
          ) : (
            <div className="col-span-full py-16 text-center rounded-3xl bg-white/30 dark:bg-slate-800/30 border border-dashed border-slate-300 dark:border-slate-700 backdrop-blur-sm">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="book" className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">No active courses</p>
              <p className="text-slate-500 dark:text-slate-400">Pick a category below to start your journey!</p>
            </div>
          )}
        </div>
      </section>

      {/* Explore Categories */}
      <section ref={exploreRef} className="scroll-animate space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Icon name="search" className="w-6 h-6 text-brand-secondary" />
          Explore Categories
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORY_DETAILS.map(cat => (
            <CategoryCard key={cat.name} category={cat} navigateToFilteredCourses={navigateToFilteredCourses} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;