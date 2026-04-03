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
}

const StatCardComponent: React.FC<StatCardProps> = ({ icon, value, label, trend }) => {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="rounded-2xl p-4 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rhythm-stack-sm"
    >
      <div className="flex justify-between items-center">
        <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-white">
          <Icon name={icon} className="w-5 h-5" />
        </div>
        {trend && (
          <span className="text-xs font-semibold px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300">
            {trend}
          </span>
        )}
      </div>

      <div>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300">{label}</p>
      </div>
    </motion.div>
  );
};

const StatCard = memo(StatCardComponent);

interface DashboardCourseCardProps {
  course: Course;
  navigateToCourse: (course: Course) => void;
  isPrimary?: boolean;
}

const DashboardCourseCardComponent: React.FC<DashboardCourseCardProps> = ({ course, navigateToCourse, isPrimary = false }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm"
    >
      <div className="flex flex-col sm:flex-row h-full">
        <div className={`relative w-full sm:w-52 ${isPrimary ? 'h-52' : 'h-44'} sm:h-auto flex-shrink-0 overflow-hidden`}>
          <img
            src={course.thumbnailUrl ?? course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        <div className="p-4 rhythm-stack-md flex flex-col flex-grow justify-between">
          <div className="rhythm-stack-xs">
            <div className="flex items-center justify-between gap-3">
              <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-900 text-xs font-semibold text-slate-600 dark:text-slate-300">
                {course.category}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{course.progress}% complete</span>
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-1">{course.title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{course.description}</p>
          </div>

          <div className="rhythm-stack-sm">
            <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${course.progress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="bg-brand-primary h-full rounded-full"
              />
            </div>

            <button
              onClick={() => navigateToCourse(course)}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
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
      className="flex flex-col items-center text-center p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-brand-primary/30 transition-all group h-full rhythm-stack-xs"
    >
      <div className={`p-3 rounded-full bg-slate-50 dark:bg-slate-900 ${category.color.replace('bg-', 'bg-opacity-10 ')}`}>
        <div className={`${activeColorClass}-600 dark:${activeColorClass}-400`}>
          <Icon name={category.icon} className="w-5 h-5" />
        </div>
      </div>
      <span className="font-semibold text-sm text-slate-800 dark:text-white">{category.name}</span>
      <span className="text-xs text-slate-500 dark:text-slate-400">{category.desc}</span>
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
  const primaryCourse = ongoingCourses[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 rhythm-stack-lg">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="rhythm-stack-xs">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Hello, {firstName} 👋
          </h2>
          <p className="text-slate-600 dark:text-slate-400">Stay focused on your next lesson today.</p>
        </div>

        <div className="text-sm font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl">
          {currentDate}
        </div>
      </div>

      <section className="rhythm-stack-md">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Icon name="play" className="w-5 h-5 text-brand-primary" /> Continue Learning
          </h3>
        </div>

        {primaryCourse ? (
          <div className="rhythm-stack-sm">
            <DashboardCourseCard course={primaryCourse} navigateToCourse={navigateToCourse} isPrimary />
            {ongoingCourses.length > 1 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {ongoingCourses.slice(1, 3).map((course) => (
                  <DashboardCourseCard key={course.id} course={course} navigateToCourse={navigateToCourse} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="py-12 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rhythm-stack-sm">
            <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
              <Icon name="book-open" className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-semibold">No active courses yet.</p>
            <button onClick={() => navigateToFilteredCourses('all')} className="text-brand-primary text-sm font-semibold hover:underline">
              Find something new
            </button>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rhythm-stack-md">
          <StudentAnalytics user={user} courses={courses} />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard icon="star" value={user.points.toLocaleString()} label="Total Points" trend="+12%" />
            <StatCard icon="zap" value={`${user.streak} Days`} label="Current Streak" trend="Active" />
            <StatCard icon="check" value="8" label="Completed Courses" />
          </div>
        </div>

        <div className="rhythm-stack-md">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Explore Categories</h3>
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
                <CategoryCard category={cat} navigateToFilteredCourses={navigateToFilteredCourses} index={idx} />
              </motion.div>
            ))}
          </motion.div>

          <div className="rounded-2xl p-4 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rhythm-stack-sm">
            <h4 className="font-semibold text-slate-900 dark:text-white">Weekly Goal</h4>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Complete 3 lessons to maintain your streak.</p>
            <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-2">
              <div className="bg-brand-primary h-full rounded-full w-[60%]" />
            </div>
            <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>Progress</span>
              <span>60%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
