import React, { memo, useEffect, useMemo, useState } from 'react';
import { User, Course } from '../types.ts';
import Icon from './common/Icon.tsx';
import StudentAnalytics from './StudentAnalytics.tsx';
import { motion, useReducedMotion } from 'framer-motion';
import Button from '@/components/ui/Button.tsx';
import Card from '@/components/ui/Card.tsx';
import { MOTION } from '@/utils/motion.ts';

interface DashboardProps {
  user: User;
  courses: Course[];
  navigateToFilteredCourses: (category: string) => void;
  navigateToCourse: (course: Course) => void;
}

type GoalType = 'lessons' | 'minutes';

const GOAL_STORAGE_KEY = 'edusimulate:dashboardWeeklyGoal';

const parseDurationToMinutes = (duration: string): number => {
  const hourMatch = duration.match(/(\d+)\s*h/i);
  const minuteMatch = duration.match(/(\d+)\s*m/i);

  if (hourMatch || minuteMatch) {
    const hours = hourMatch ? Number(hourMatch[1]) : 0;
    const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;
    return (hours * 60) + minutes;
  }

  const numeric = Number(duration.replace(/[^\d]/g, ''));
  return Number.isFinite(numeric) ? numeric : 0;
};

interface StatCardProps {
  icon: string;
  value: string;
  label: string;
  meaning: string;
  ctaLabel: string;
  onCtaClick: () => void;
  emptyStateCopy?: string;
  isEmpty?: boolean;
  bgGradient: string;
}

const StatCardComponent: React.FC<StatCardProps> = ({
  icon,
  value,
  label,
  meaning,
  ctaLabel,
  onCtaClick,
  emptyStateCopy,
  isEmpty,
  bgGradient,
}) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={`relative overflow-hidden rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50 ${bgGradient} dark:bg-slate-800 h-full flex flex-col`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

      <div className="relative z-10 flex justify-between items-start">
        <div className="p-3 rounded-xl bg-white/90 dark:bg-slate-900/50 backdrop-blur-sm shadow-sm text-text-primary">
          <Icon name={icon} className="w-6 h-6" />
        </div>
        <span className="text-[11px] font-bold uppercase tracking-wider bg-white/80 dark:bg-black/20 px-2 py-1 rounded-lg backdrop-blur text-slate-700 dark:text-white/90">
          {label}
        </span>
      </div>

      <div className="relative z-10 mt-6 space-y-2">
        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{value}</h3>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{meaning}</p>
        {isEmpty && emptyStateCopy && (
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{emptyStateCopy}</p>
        )}
      </div>

      <button
        onClick={onCtaClick}
        className="relative z-10 mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-white px-4 py-2.5 text-sm font-bold text-white dark:text-slate-900 hover:opacity-90 transition-opacity"
      >
        {ctaLabel}
        <Icon name="arrowRight" className="w-4 h-4" />
      </button>
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
            </Button>
          </div>
        </div>
      </div>
    </Card>
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
      className="ui-focus-ring ui-transition flex h-full flex-col items-center rounded-2xl border border-slate-200 bg-white p-4 text-center dark:border-slate-700 dark:bg-slate-800/40 hover:border-brand-primary/30 hover:bg-white hover:shadow-lg dark:hover:bg-slate-800 active:translate-y-[1px] group"
    >
      <div className={`ui-transition mb-3 rounded-full bg-slate-50 p-4 dark:bg-slate-900 group-hover:scale-110 ${category.color.replace('bg-', 'bg-opacity-10 ')}`}>
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
  const [goalType, setGoalType] = useState<GoalType>('lessons');
  const [goalValue, setGoalValue] = useState<number>(6);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const saved = window.localStorage.getItem(GOAL_STORAGE_KEY);
    if (!saved) {
      return;
    }

    try {
      const parsed = JSON.parse(saved) as { type?: GoalType; value?: number };
      if (parsed.type === 'lessons' || parsed.type === 'minutes') {
        setGoalType(parsed.type);
      }
      if (typeof parsed.value === 'number' && Number.isFinite(parsed.value)) {
        setGoalValue(Math.max(1, parsed.value));
      }
    } catch {
      // no-op: fallback to defaults
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(GOAL_STORAGE_KEY, JSON.stringify({ type: goalType, value: goalValue }));
  }, [goalType, goalValue]);

  const ongoingCourses = useMemo(() =>
    user.ongoingCourses
      .map(courseId => courses.find(c => c.id === courseId))
      .filter((c): c is Course => !!c),
    [user.ongoingCourses, courses]
  );

  const recentActivity = useMemo(() => {
    const taskSignals = user.pendingTasks.slice(0, 3).map(task => `${task.text} (${task.dueDate})`);
    return taskSignals.length > 0 ? taskSignals : ['No pending tasks logged this week yet.'];
  }, [user.pendingTasks]);

  const lectureProgress = useMemo(() => {
    return ongoingCourses.map(course => {
      const totalLectures = course.lectures?.length ?? 0;
      const completedLectures = user.progress?.[course.id]?.length ?? Math.round((course.progress / 100) * totalLectures);
      const pendingLectures = Math.max(totalLectures - completedLectures, 0);
      return {
        course,
        completedLectures,
        pendingLectures,
        totalLectures,
      };
    });
  }, [ongoingCourses, user.progress]);

  const todayPlan = useMemo(() => {
    const plans: string[] = [];
    const mostPending = [...lectureProgress].sort((a, b) => b.pendingLectures - a.pendingLectures)[0];
    if (mostPending && mostPending.pendingLectures > 0) {
      plans.push(`Finish ${Math.min(2, mostPending.pendingLectures)} lecture(s) in ${mostPending.course.title}.`);
    }

    const quizTask = user.pendingTasks.find(task => task.text.toLowerCase().includes('quiz'));
    if (quizTask) {
      plans.push(`Revise and complete: ${quizTask.text}.`);
    }

    const lowProgressCourse = ongoingCourses
      .filter(course => course.progress < 60)
      .sort((a, b) => a.progress - b.progress)[0];
    if (lowProgressCourse) {
      plans.push(`Do a 25-minute focus sprint on ${lowProgressCourse.title}.`);
    }

    if (plans.length < 2) {
      plans.push('Review one weak topic and take a quick recap quiz.');
    }

    return plans.slice(0, 3);
  }, [lectureProgress, ongoingCourses, user.pendingTasks]);

  const subjectProgress = useMemo(() => {
    const grouped = new Map<string, { totalProgress: number; pendingModules: number; count: number }>();

    ongoingCourses.forEach(course => {
      const current = grouped.get(course.category) ?? { totalProgress: 0, pendingModules: 0, count: 0 };
      current.totalProgress += course.progress;
      current.pendingModules += course.progress < 100 ? 1 : 0;
      current.count += 1;
      grouped.set(course.category, current);
    });

    return Array.from(grouped.entries()).map(([subject, stats]) => ({
      subject,
      progress: Math.round(stats.totalProgress / Math.max(stats.count, 1)),
      pending: stats.pendingModules,
    }));
  }, [ongoingCourses]);

  const needsAttention = useMemo(() => {
    const results: string[] = [];
    const lowAccuracySignal = user.pendingTasks
      .filter(task => task.text.toLowerCase().includes('quiz'))
      .slice(0, 2)
      .map(task => `${task.courseTitle}: quiz follow-up pending`);

    const lowProgressSignal = ongoingCourses
      .filter(course => course.progress <= 35)
      .slice(0, 2)
      .map(course => `${course.title}: progress below 35%`);

    results.push(...lowAccuracySignal, ...lowProgressSignal);

    if (user.lastLogin?.toDate) {
      const daysSinceLogin = Math.floor((Date.now() - user.lastLogin.toDate().getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceLogin >= 5) {
        results.push(`Activity gap detected: last active ${daysSinceLogin} days ago`);
      }
    }

    return results.slice(0, 4);
  }, [ongoingCourses, user.lastLogin, user.pendingTasks]);

  const weeklyProgress = useMemo(() => {
    const completedLessons = lectureProgress.reduce((sum, item) => sum + item.completedLectures, 0);
    const completedMinutes = lectureProgress.reduce((sum, item) => {
      const completedDuration = item.course.lectures
        .slice(0, item.completedLectures)
        .reduce((lectureSum, lecture) => lectureSum + parseDurationToMinutes(lecture.duration), 0);
      return sum + completedDuration;
    }, 0);

    const actual = goalType === 'lessons' ? completedLessons : completedMinutes;
    const pct = Math.min(Math.round((actual / Math.max(goalValue, 1)) * 100), 100);

    return {
      actual,
      pct,
      label: goalType === 'lessons' ? `${completedLessons} lessons done` : `${completedMinutes} mins focused`,
    };
  }, [goalType, goalValue, lectureProgress]);

  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const firstName = user.name.split(' ')[0];
  const metricAnnouncement = `Dashboard metrics updated. Total points ${user.points.toLocaleString()}, current streak ${user.streak} days, completed courses 8.`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: MOTION.duration.slow, ease: MOTION.easing.standard }}
        >
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">{firstName}</span> 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Let's make today productive. You're doing great!
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: MOTION.duration.fast, duration: MOTION.duration.standard, ease: MOTION.easing.standard }}
          className="text-sm font-bold text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-slate-200 dark:border-slate-700 px-5 py-2.5 rounded-full shadow-sm"
        >
          {currentDate}
        </motion.div>
      </div>

      {/* Stats Grid */}
      <p className="sr-only" aria-live="polite" role="status">
        {metricAnnouncement}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          icon="star"
          value={user.points.toLocaleString()}
          label="Total Points"
          meaning={user.points > 0 ? '+12% vs last 7 days' : 'Today: 0 points, 7 days: 0 points'}
          isEmpty={user.points === 0}
          emptyStateCopy="No points yet—finish your first module to earn points."
          ctaLabel="Review Notes"
          onCtaClick={() => navigateToFilteredCourses('all')}
          bgGradient="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10"
        />
        <StatCard
          icon="zap"
          value={`${user.streak} Days`}
          label="Current Streak"
          meaning={user.streak > 0 ? `${user.streak}-day streak; complete 1 lesson today to extend.` : 'No active streak yet; complete 1 lesson today to begin.'}
          isEmpty={user.streak === 0}
          emptyStateCopy="No streak yet—complete today\'s lesson to start your streak."
          ctaLabel="Continue Lesson"
          onCtaClick={() => {
            if (ongoingCourses[0]) {
              navigateToCourse(ongoingCourses[0]);
              return;
            }
            navigateToFilteredCourses('all');
          }}
          bgGradient="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10"
        />
        <StatCard
          icon="check"
          value={completedCoursesCount.toString()}
          label="Completed Courses"
          meaning={completedCoursesCount > 0 ? `${completedCoursesCount} finished all-time` : 'All-time completions: 0'}
          isEmpty={completedCoursesCount === 0}
          emptyStateCopy="No completions yet—start a daily quiz to finish your first course faster."
          ctaLabel="Start Daily Quiz"
          onCtaClick={() => navigateToFilteredCourses('all')}
          bgGradient="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10"
        />
      </div>

      {/* Main Content Area: Analytics + Ongoing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Analytics (2/3 width) */}
        <div className="lg:col-span-2 space-y-8">
          <StudentAnalytics user={user} courses={courses} />

          <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Icon name="sparkles" className="w-5 h-5 text-brand-primary" />
                Today&apos;s Plan
              </h3>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Based on progress + recent activity</span>
            </div>
            <ul className="space-y-3">
              {todayPlan.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-200">
                  <span className="mt-0.5 w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                    <Icon name="check" className="w-3.5 h-3.5" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
              Recent signals: {recentActivity.join(' • ')}
            </div>
          </section>

          <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Syllabus progress by subject/topic</h3>
            <div className="space-y-4">
              {subjectProgress.length > 0 ? subjectProgress.map((item) => (
                <div key={item.subject}>
                  <div className="flex justify-between text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    <span>{item.subject}</span>
                    <span>{item.progress}% • {item.pending} pending</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-900 rounded-full">
                    <div className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary" style={{ width: `${item.progress}%` }} />
                  </div>
                </div>
              )) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">Start a course to see subject-wise syllabus progress.</p>
              )}
            </div>
          </section>

          <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Needs attention</h3>
            {needsAttention.length > 0 ? (
              <ul className="space-y-3">
                {needsAttention.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-200">
                    <span className="mt-0.5 w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-300 flex items-center justify-center">
                      <Icon name="clock" className="w-3.5 h-3.5" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">Great job — no urgent weak areas detected right now.</p>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Icon name="play" className="w-5 h-5 text-brand-primary" /> Continue Learning
              </h2>
            </div>

            <motion.div
              className="space-y-4"
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: {
                    staggerChildren: shouldReduceMotion ? 0 : 0.15
                  }
                }
              }}
              initial="hidden"
              animate="show"
            >
              {ongoingCourses.length > 0 ? (
                ongoingCourses.slice(0, 3).map((course) => (
                  <motion.div key={course.id} variants={{ hidden: { opacity: 0, x: shouldReduceMotion ? 0 : -20 }, show: { opacity: 1, x: 0 } }}>
                    <DashboardCourseCard course={course} navigateToCourse={navigateToCourse} />
                  </motion.div>
                ))
              ) : (
                <div className="py-12 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon name="book-open" className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 font-bold">No active courses yet.</p>
                  <Button variant="ghost" onClick={() => navigateToFilteredCourses('all')} className="mt-2 p-0 text-sm hover:underline">
                    Find something new
                  </Button>
                </div>
              )}
            </motion.div>
          </section>
        </div>

        {/* Right Column: Discover (1/3 width) */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Explore Categories</h2>
          <motion.div
            className="grid grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: shouldReduceMotion ? 0 : 0.1
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
              <h4 className="font-bold text-lg mb-3">Weekly Goal Settings</h4>
              <div className="space-y-3 text-sm">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setGoalType('lessons')}
                    className={`px-3 py-1.5 rounded-lg border transition ${goalType === 'lessons' ? 'bg-white text-brand-primary border-white' : 'bg-white/10 border-white/30 text-white'}`}
                  >
                    Lessons
                  </button>
                  <button
                    type="button"
                    onClick={() => setGoalType('minutes')}
                    className={`px-3 py-1.5 rounded-lg border transition ${goalType === 'minutes' ? 'bg-white text-brand-primary border-white' : 'bg-white/10 border-white/30 text-white'}`}
                  >
                    Minutes
                  </button>
                </div>
                <label className="block">
                  <span className="text-white/85 text-xs font-semibold">Weekly target</span>
                  <input
                    type="number"
                    min={1}
                    max={goalType === 'lessons' ? 50 : 1200}
                    value={goalValue}
                    onChange={(e) => setGoalValue(Math.max(1, Number(e.target.value) || 1))}
                    className="mt-1 w-full rounded-lg bg-white/15 border border-white/30 px-3 py-2 text-white placeholder:text-white/70 focus:outline-none focus:ring-2 focus:ring-white/60"
                  />
                </label>
              </div>
              <p className="text-white/90 text-sm mt-4 mb-3">{weeklyProgress.label} / target {goalValue} {goalType}</p>
              <div className="w-full bg-black/20 rounded-full h-2 mb-2">
                <div className="bg-white h-full rounded-full" style={{ width: `${weeklyProgress.pct}%` }} />
              </div>
              <div className="flex justify-between text-xs font-bold text-white/80">
                <span>Progress</span>
                <span>{weeklyProgress.pct}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
