import React, { memo, useMemo } from 'react';
import { User, Course } from '../types.ts';
import Icon from './common/Icon.tsx';
import StudentAnalytics from './StudentAnalytics.tsx';
import { motion } from 'framer-motion';

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
  bgGradient: string;
}

const StatCardComponent: React.FC<StatCardProps> = ({ icon, value, label, trend, bgGradient }) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={`relative overflow-hidden rounded-2xl p-6 shadow-sm border border-border-subtle/70 dark:border-border-subtle/60 ${bgGradient} dark:bg-slate-800`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

      <div className="relative z-10 flex justify-between items-start">
        <div className="p-3 rounded-xl bg-white/90 dark:bg-slate-900/50 backdrop-blur-sm shadow-sm text-text-primary">
          <Icon name={icon} className="w-6 h-6" />
        </div>
        {trend && (
          <span className="flex items-center gap-1 text-xs font-bold bg-white/80 dark:bg-black/20 px-2 py-1 rounded-lg backdrop-blur text-text-primary">
            <Icon name="trending-up" className="w-3 h-3" /> {trend}
          </span>
        )}
      </div>

      <div className="relative z-10 mt-6">
        <h3 className="text-3xl font-black text-text-primary tracking-tight">{value}</h3>
        <p className="font-medium text-text-secondary mt-1 opacity-90">{label}</p>
      </div>
    </motion.div>
  );
};

const StatCard = memo(StatCardComponent);

interface DashboardCourseCardProps {
  course: Course;
  navigateToCourse: (course: Course) => void;
}

const DashboardCourseCardComponent: React.FC<DashboardCourseCardProps> = ({ course, navigateToCourse }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="group bg-white dark:bg-slate-800 rounded-2xl border border-border-subtle/80 dark:border-border-subtle/60 overflow-hidden shadow-sm hover:shadow-xl hover:border-brand-primary/20 transition-all duration-300"
    >
      <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row h-full">
        <div className="relative w-full sm:w-48 lg:w-full xl:w-48 h-48 sm:h-auto lg:h-48 xl:h-auto flex-shrink-0 overflow-hidden">
          <img
            src={course.thumbnailUrl ?? course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent sm:bg-gradient-to-r lg:bg-gradient-to-t xl:bg-gradient-to-r" />
          <div className="absolute bottom-3 left-3 sm:top-3 sm:left-3 sm:bottom-auto lg:bottom-3 lg:top-auto lg:left-3 xl:top-3 xl:left-3 xl:bottom-auto">
            <span className="px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-md border border-white/20 text-xs font-bold text-white shadow-sm">
              {course.category}
            </span>
          </div>
        </div>

        <div className="p-5 flex flex-col flex-grow justify-between">
          <div>
            <h3 className="font-bold text-lg text-text-primary mb-2 line-clamp-1 group-hover:text-brand-primary transition-colors">{course.title}</h3>
            <p className="text-sm text-text-secondary line-clamp-2">{course.description}</p>
          </div>

          <div className="mt-4 pt-4 border-t border-border-subtle/70 dark:border-border-subtle/60">
            <div className="flex justify-between text-xs font-bold text-text-secondary mb-2">
              <span>Progress</span>
              <span className="text-brand-primary">{course.progress}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-2 overflow-hidden mb-4">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${course.progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="bg-brand-primary h-full rounded-full"
              />
            </div>

              <button
              onClick={() => navigateToCourse(course)}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-slate-50 text-slate-50 dark:text-slate-950 text-sm font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <span>Continue Learning</span>
              <Icon name="arrowRight" className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const DashboardCourseCard = memo(DashboardCourseCardComponent);

interface CategoryCardProps {
  category: { name: string; icon: string; color: string; desc: string };
  navigateToFilteredCourses: (category: string) => void;
  index: number;
}

const CategoryCardComponent: React.FC<CategoryCardProps> = ({ category, navigateToFilteredCourses, index }) => {
  const activeColorClass = category.color.replace('bg-', 'text-');

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => navigateToFilteredCourses(category.name)}
      className="flex flex-col items-center text-center p-4 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 hover:border-brand-primary/30 hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg transition-all group h-full"
    >
      <div className={`p-4 rounded-full bg-slate-50 dark:bg-slate-900 mb-3 group-hover:scale-110 transition-transform ${category.color.replace('bg-', 'bg-opacity-10 ')}`}>
        <div className={`${activeColorClass}-600 dark:${activeColorClass}-400`}>
          <Icon name={category.icon} className="w-6 h-6" />
        </div>
      </div>
      <span className="font-bold text-sm text-text-primary mb-1">
        {category.name}
      </span>
      <span className="text-xs text-text-secondary font-medium">
        {category.desc}
      </span>
    </motion.button>
  );
};

const CategoryCard = memo(CategoryCardComponent);

const CATEGORY_DETAILS = [
  { name: 'NEET', icon: 'neet', color: 'bg-red-500', desc: 'Medical Entrance' },
  { name: 'IIT JEE', icon: 'iit', color: 'bg-blue-500', desc: 'Engineering' },
  { name: 'School Preparation', icon: 'school', color: 'bg-green-500', desc: 'K-12 Syllabus' },
  { name: 'UPSC', icon: 'upsc', color: 'bg-purple-500', desc: 'Civil Services' },
  { name: 'Govt Job Exams', icon: 'government', color: 'bg-yellow-500', desc: 'SSC, Bank' },
  { name: 'Defence', icon: 'defence', color: 'bg-indigo-500', desc: 'NDA, CDS' },
] as const;

const Dashboard: React.FC<DashboardProps> = ({ user, courses, navigateToFilteredCourses, navigateToCourse }) => {
  const ongoingCourses = useMemo(() =>
    user.ongoingCourses
      .map(courseId => courses.find(c => c.id === courseId))
      .filter((c): c is Course => !!c),
    [user.ongoingCourses, courses]
  );

  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const firstName = user.name.split(' ')[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">{firstName}</span> 👋
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Let's make today productive. You're doing great!
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm font-bold text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-slate-200 dark:border-slate-700 px-5 py-2.5 rounded-full shadow-sm"
        >
          {currentDate}
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          icon="star"
          value={user.points.toLocaleString()}
          label="Total Points"
          trend="+12%"
          bgGradient="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10"
        />
        <StatCard
          icon="zap"
          value={`${user.streak} Days`}
          label="Current Streak"
          trend="Rolling 🔥"
          bgGradient="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10"
        />
        <StatCard
          icon="check"
          value="8"
          label="Completed Courses"
          bgGradient="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10"
        />
      </div>

      {/* Main Content Area: Analytics + Ongoing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Analytics (2/3 width) */}
        <div className="lg:col-span-2 space-y-8">
          <StudentAnalytics user={user} courses={courses} />

          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Icon name="play" className="w-5 h-5 text-brand-primary" /> Continue Learning
              </h3>
            </div>

            <motion.div
              className="space-y-4"
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.15
                  }
                }
              }}
              initial="hidden"
              animate="show"
            >
              {ongoingCourses.length > 0 ? (
                ongoingCourses.slice(0, 3).map((course) => (
                  <motion.div key={course.id} variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }}>
                    <DashboardCourseCard course={course} navigateToCourse={navigateToCourse} />
                  </motion.div>
                ))
              ) : (
                <div className="py-12 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon name="book-open" className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 font-bold">No active courses yet.</p>
                  <button onClick={() => navigateToFilteredCourses('all')} className="text-brand-primary text-sm font-bold mt-2 hover:underline">
                    Find something new
                  </button>
                </div>
              )}
            </motion.div>
          </section>
        </div>

        {/* Right Column: Discover (1/3 width) */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Explore Categories</h3>
          <motion.div
            className="grid grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
            initial="hidden"
            animate="show"
          >
            {CATEGORY_DETAILS.map((cat, idx) => (
              <motion.div key={cat.name} variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
                <CategoryCard category={cat} navigateToFilteredCourses={navigateToFilteredCourses} index={0} />
              </motion.div>
            ))}
          </motion.div>

          <div className="bg-gradient-to-br from-brand-primary to-brand-secondary rounded-3xl p-6 text-white relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-10 -translate-y-10" />
            <div className="relative z-10">
              <h4 className="font-bold text-lg mb-2">Weekly Goal</h4>
              <p className="text-white/90 text-sm mb-4">Complete 3 lessons to maintain your streak!</p>
              <div className="w-full bg-black/20 rounded-full h-2 mb-2">
                <div className="bg-white h-full rounded-full w-[60%]" />
              </div>
              <div className="flex justify-between text-xs font-bold text-white/80">
                <span>Progress</span>
                <span>60%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
