import React, { useState, useMemo } from 'react';
import { User, Course, Task } from '../types.ts';
import Icon from './common/Icon.tsx';
import { motion, AnimatePresence } from 'framer-motion';
import { allTimeLeaderboard } from '../constants.ts';

interface MyLearningsProps {
    user: User;
    courses: Course[];
    navigateToCourse: (course: Course) => void;
}

type Tab = 'in_progress' | 'completed' | 'wishlist' | 'tasks';

const estimateEta = (progress: number): string => {
    if (progress >= 90) return 'Under 1 hour left';
    if (progress >= 70) return '1-2 hours left';
    if (progress >= 40) return '2-3 hours left';
    return '3+ hours left';
};

const CourseCard: React.FC<{ course: Course; onClick: () => void; index: number }> = React.memo(({ course, onClick, index }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ y: -3 }}
        onClick={onClick}
        className="interactive-card flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden cursor-pointer group"
    >
        <div className="relative h-44 overflow-hidden">
            <img src={course.thumbnailUrl ?? course.thumbnail} loading="lazy" decoding="async" alt={course.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute top-3 right-3 z-20">
                <div className="px-2 py-1 rounded-full bg-slate-900/70 border border-white/10 flex items-center gap-1">
                    <Icon name="star" className="w-3 h-3 text-yellow-400 fill-current" />
                    <span className="text-xs font-semibold text-white">{course.rating || 4.8}</span>
                </div>
            </div>
        </div>

        <div className="p-4 rhythm-stack-sm flex flex-col flex-grow">
            <h3 className="font-semibold text-base text-slate-900 dark:text-white line-clamp-1 group-hover:text-brand-primary transition-colors">{course.title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{course.author.name}</p>

            <div className="mt-auto rhythm-stack-xs">
                <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Progress</span>
                    <span className="text-xs font-semibold text-brand-primary">{course.progress}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${course.progress}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                        className="bg-brand-primary h-full rounded-full"
                    />
                </div>

                <button className="mt-2 w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-sm hover:opacity-90 transition-opacity">
                    {course.progress > 0 ? 'Continue' : 'Start Course'}
                </button>
            </div>
        </div>
    </motion.div>
));

const TaskItem: React.FC<{ task: Task; onClick: () => void; index: number }> = React.memo(({ task, onClick, index }) => (
    <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        onClick={onClick}
        className="bg-white dark:bg-slate-900 rounded-2xl p-4 flex items-center justify-between border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-brand-primary/40 transition-all shadow-sm"
    >
        <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                task.completed
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                    : 'bg-brand-primary/10 text-brand-primary'
            }`}>
                <Icon name={task.completed ? 'check' : 'check-circle'} className="w-5 h-5" />
            </div>
            <div>
                <p className="font-semibold text-slate-800 dark:text-white">{task.text}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1">
                    <span className="font-medium">Due {task.dueDate}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                    <span className="truncate max-w-[200px]">{task.courseTitle}</span>
                </p>
            </div>
        </div>
        <Icon name="chevronRight" className="w-5 h-5 text-slate-400" />
    </motion.div>
));

const MyLearnings: React.FC<MyLearningsProps> = ({ user, courses, navigateToCourse }) => {
    const [activeTab, setActiveTab] = useState<Tab>('in_progress');
    const [searchTerm, setSearchTerm] = useState('');

    const enrolledCourses = useMemo(() => {
        const enrolledCourseIds = Array.from(new Set([
            ...user.enrolledCourses,
            ...user.ongoingCourses,
        ]));

        return enrolledCourseIds
            .map(id => courses.find(c => c.id === id))
            .filter((c): c is Course => !!c);
    }, [courses, user.enrolledCourses, user.ongoingCourses]);

    const inProgressCourses = useMemo(() =>
        enrolledCourses.filter(c => c.progress < 100),
        [enrolledCourses]);

    const resumeCourse = useMemo(() => {
        if (!inProgressCourses.length) return null;
        return [...inProgressCourses].sort((a, b) => b.progress - a.progress)[0];
    }, [inProgressCourses]);

    const completedCourses = useMemo(() =>
        enrolledCourses.filter(c => c.progress === 100),
        [enrolledCourses]);

    const wishlistCourses = useMemo(() =>
        user.wishlist
            .map(id => courses.find(c => c.id === id))
            .filter((c): c is Course => !!c),
        [user.wishlist, courses]
    );

    const filterCourses = (list: Course[]) =>
        list.filter(course =>
            course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.author.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

    const filteredInProgress = useMemo(() => filterCourses(inProgressCourses), [inProgressCourses, searchTerm]);
    const filteredCompleted = useMemo(() => filterCourses(completedCourses), [completedCourses, searchTerm]);
    const filteredWishlist = useMemo(() => filterCourses(wishlistCourses), [wishlistCourses, searchTerm]);

    const filteredTasks = useMemo(() => {
        return user.pendingTasks.filter(task =>
            task.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.courseTitle.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [user.pendingTasks, searchTerm]);

    const motivationLeaders = useMemo(() => {
        const withUser = allTimeLeaderboard.some((entry) => entry.user.uid === user.uid)
            ? allTimeLeaderboard
            : [
                ...allTimeLeaderboard,
                {
                    rank: allTimeLeaderboard.length + 1,
                    user: { uid: user.uid, name: user.name, avatar: user.avatar || `https://i.pravatar.cc/150?u=${user.uid}` },
                    points: user.points,
                },
            ];

        return withUser
            .sort((a, b) => b.points - a.points)
            .slice(0, 5)
            .map((entry, idx) => ({ ...entry, rank: idx + 1 }));
    }, [user.avatar, user.name, user.points, user.uid]);

    const renderContent = () => {
        let content;
        let count = 0;
        switch (activeTab) {
            case 'in_progress':
                content = filteredInProgress;
                count = content.length;
                break;
            case 'completed':
                content = filteredCompleted;
                count = content.length;
                break;
            case 'wishlist':
                content = filteredWishlist;
                count = content.length;
                break;
            case 'tasks':
                content = filteredTasks;
                count = content.length;
                break;
            default:
                content = [];
        }

        if (count === 0) {
            return (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700"
                >
                    <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                        <Icon name="search" className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">No items found</h3>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">
                        {searchTerm ? 'Adjust filters to find what you need.' : `Your ${activeTab.replace('_', ' ')} list is empty.`}
                    </p>
                </motion.div>
            );
        }

        if (activeTab === 'tasks') {
            return (
                <div className="space-y-4 max-w-4xl mx-auto">
                    <AnimatePresence>
                        {(content as Task[]).map((task, idx) => {
                            const course = courses.find(c => c.id === task.courseId);
                            return course ? <TaskItem key={task.id} task={task} index={idx} onClick={() => navigateToCourse(course)} /> : null;
                        })}
                    </AnimatePresence>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <AnimatePresence>
                    {(content as Course[]).map((course, idx) => (
                        <CourseCard key={course.id} course={course} index={idx} onClick={() => navigateToCourse(course)} />
                    ))}
                </AnimatePresence>
            </div>
        );
    };

    const tabs: { id: Tab; label: string }[] = [
        { id: 'in_progress', label: 'In Progress' },
        { id: 'completed', label: 'Completed' },
        { id: 'wishlist', label: 'Wishlist' },
        { id: 'tasks', label: 'Pending Tasks' },
    ];

    return (
        <div className="w-full rhythm-stack-lg animate-fade-in pb-24">
            <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 md:p-8 border border-slate-200 dark:border-slate-700 rhythm-stack-md">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                    <div className="min-w-0">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight"
                        >
                            My Learnings
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-slate-600 dark:text-slate-300 mt-2"
                        >
                            Resume your current course first, then manage everything else.
                        </motion.p>
                    </div>

                    <div className="relative w-full lg:w-80 lg:flex-shrink-0">
                        <input
                            type="text"
                            placeholder="Search your library..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary outline-none transition-all placeholder:text-slate-400 text-slate-800 dark:text-white"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <Icon name="search" className="w-5 h-5 text-slate-400" />
                        </div>
                    </div>
                </div>

                {resumeCourse && (
                    <button
                        onClick={() => navigateToCourse(resumeCourse)}
                        className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4 md:p-5 text-left hover:border-brand-primary/40 transition-colors"
                    >
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                            <div className="rhythm-stack-xs">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Resume next</p>
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{resumeCourse.title}</h2>
                                <p className="text-sm text-slate-600 dark:text-slate-300">{resumeCourse.progress}% complete · {estimateEta(resumeCourse.progress)}</p>
                            </div>
                            <span className="inline-flex items-center gap-2 text-sm font-semibold text-brand-primary">
                                Continue
                                <Icon name="arrowRight" className="w-4 h-4" />
                            </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-4 overflow-hidden">
                            <div className="h-full bg-brand-primary rounded-full" style={{ width: `${resumeCourse.progress}%` }} />
                        </div>
                    </button>
                )}
            </div>

            <div className="-mx-1 overflow-x-auto pb-1">
                <div className="px-1 flex flex-nowrap sm:flex-wrap gap-3 min-w-max sm:min-w-0">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 outline-none border whitespace-nowrap ${
                                activeTab === tab.id
                                    ? 'text-white bg-slate-900 dark:bg-brand-primary border-transparent'
                                    : 'text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-brand-primary/40'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="min-h-[400px] pt-1">
                {renderContent()}
            </div>

            <section className="bg-white/60 dark:bg-slate-900/50 backdrop-blur rounded-[28px] border border-white/40 dark:border-white/10 shadow-xl p-6 md:p-8">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <Icon name="leaderboard" className="w-6 h-6 text-brand-primary" />
                            Leaderboard Motivation
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Positioned below your modules so learning progress remains the primary focus.
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    {motivationLeaders.map((entry) => {
                        const isUser = entry.user.uid === user.uid;
                        return (
                            <div
                                key={entry.user.uid}
                                className={`rounded-2xl px-4 py-3 border flex items-center justify-between ${isUser
                                    ? 'bg-brand-primary/10 border-brand-primary/40'
                                    : 'bg-white/80 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="w-8 text-sm font-black text-slate-700 dark:text-slate-200">#{entry.rank}</span>
                                    <img src={entry.user.avatar} alt={entry.user.name} className="w-9 h-9 rounded-full object-cover border border-white/70 dark:border-slate-700" />
                                    <p className="font-semibold text-slate-900 dark:text-white">{entry.user.name}{isUser ? ' (You)' : ''}</p>
                                </div>
                                <div className="text-sm font-bold text-slate-700 dark:text-slate-200">{entry.points.toLocaleString()} pts</div>
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
};

export default MyLearnings;
