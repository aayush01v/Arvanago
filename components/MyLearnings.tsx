import React, { useState, useMemo } from 'react';
import { User, Course, Task } from '../types.ts';
import Icon from './common/Icon.tsx';
import { motion, AnimatePresence } from 'framer-motion';

interface MyLearningsProps {
    user: User;
    courses: Course[];
    navigateToCourse: (course: Course) => void;
}

type Tab = 'in_progress' | 'completed' | 'wishlist' | 'tasks';

const CourseCard: React.FC<{ course: Course; onClick: () => void; index: number }> = React.memo(({ course, onClick, index }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ y: -5 }}
        onClick={onClick}
        className="interactive-card flex flex-col rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-lg overflow-hidden cursor-pointer group hover:shadow-2xl hover:border-brand-primary/30 transition-all duration-300"
    >
        <div className="relative h-44 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10 opacity-70 group-hover:opacity-50 transition-opacity" />
            <img src={course.thumbnailUrl ?? course.thumbnail} alt={course.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />

            <div className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/50 text-white shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                    <Icon name="play" className="w-5 h-5 fill-current" />
                </div>
            </div>

            <div className="absolute top-3 right-3 z-20">
                <div className="px-2 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center gap-1">
                    <Icon name="star" className="w-3 h-3 text-yellow-400 fill-current" />
                    <span className="text-xs font-bold text-white">{course.rating || 4.8}</span>
                </div>
            </div>
        </div>

        <div className="p-5 flex flex-col flex-grow">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1 line-clamp-1 group-hover:text-brand-primary transition-colors">{course.title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{course.author.name}</p>

            <div className="mt-auto">
                <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Progress</span>
                    <span className="text-xs font-bold text-brand-primary">{course.progress}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${course.progress}%` }}
                        transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                        className="bg-gradient-to-r from-brand-primary to-brand-secondary h-full rounded-full shadow-[0_0_8px_rgba(56,189,248,0.6)]"
                    />
                </div>

                <button className="mt-4 w-full py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:bg-brand-primary hover:text-white dark:hover:bg-brand-primary transition-all duration-300 shadow-sm border border-transparent hover:shadow-brand-primary/25">
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
        className="interactive-card bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-2xl p-5 flex items-center justify-between border border-white/50 dark:border-white/10 cursor-pointer hover:border-brand-primary/40 group transition-all shadow-sm hover:shadow-md"
    >
        <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-inner
                ${task.completed
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                    : 'bg-brand-primary/10 text-brand-primary group-hover:bg-brand-primary group-hover:text-white'
                }`}
            >
                <Icon name={task.completed ? "check" : "check-circle"} className="w-6 h-6" />
            </div>
            <div>
                <p className="font-bold text-slate-800 dark:text-white text-lg group-hover:text-brand-primary transition-colors">{task.text}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                    <span className="font-medium text-rose-500 bg-rose-50 dark:bg-rose-900/10 px-2 py-0.5 rounded text-xs border border-rose-100 dark:border-rose-900/20">Due {task.dueDate}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                    <span className="truncate max-w-[200px]">{task.courseTitle}</span>
                </p>
            </div>
        </div>
        <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700 group-hover:border-brand-primary/30 group-hover:text-brand-primary transition-all">
            <Icon name="chevronRight" className="w-5 h-5 text-slate-400" />
        </div>
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
                    className="flex flex-col items-center justify-center py-20 bg-white/40 dark:bg-slate-800/40 rounded-[32px] border border-dashed border-slate-300 dark:border-slate-700 backdrop-blur-sm"
                >
                    <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center mb-6 shadow-inner">
                        <Icon name="search" className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">No items found</h3>
                    <p className="mt-2 text-slate-500 dark:text-slate-400 text-lg">
                        {searchTerm ? 'Adjust filters to find what you need.' : `Your ${activeTab.replace('_', ' ')} list is empty.`}
                    </p>
                </motion.div>
            )
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence>
                    {(content as Course[]).map((course, idx) => (
                        <CourseCard key={course.id} course={course} index={idx} onClick={() => navigateToCourse(course)} />
                    ))}
                </AnimatePresence>
            </div>
        )
    };

    const tabs: { id: Tab; label: string }[] = [
        { id: 'in_progress', label: 'In Progress' },
        { id: 'completed', label: 'Completed' },
        { id: 'wishlist', label: 'Wishlist' },
        { id: 'tasks', label: 'Pending Tasks' },
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in pb-24">
            {/* Header Area */}
            <div className="relative overflow-hidden rounded-[32px] glass-ambient dark:bg-slate-900/60 p-8 md:p-10 shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/20 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight"
                        >
                            My Learnings
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-lg text-slate-600 dark:text-slate-300 mt-2 max-w-xl"
                        >
                            Track your progress, manage tasks, and revisit your achievements.
                        </motion.p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="relative w-full md:w-80"
                    >
                        <input
                            type="text"
                            placeholder="Search your library..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white/60 dark:bg-black/20 border border-white/40 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary outline-none transition-all placeholder:text-slate-400 text-slate-800 dark:text-white backdrop-blur-md shadow-sm"
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <Icon name="search" className="w-5 h-5 text-slate-400" />
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-wrap gap-2 mb-8">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative px-6 py-3 rounded-full font-bold text-sm transition-all duration-300 outline-none
                            ${activeTab === tab.id ? 'text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'}
                        `}
                    >
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeTabLearning"
                                className="absolute inset-0 bg-slate-900 dark:bg-brand-primary rounded-full shadow-lg"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className="relative z-10">{tab.label}</span>
                    </button>
                ))}
            </div>

            <div className="min-h-[400px]">
                {renderContent()}
            </div>
        </div>
    );
};

export default MyLearnings;