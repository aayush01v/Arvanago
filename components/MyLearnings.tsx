


import React, { useState, useMemo } from 'react';
import { User, Course, Task } from '../types.ts';
import Icon from './common/Icon.tsx';

interface MyLearningsProps {
    user: User;
    courses: Course[];
    navigateToCourse: (course: Course) => void;
}

type Tab = 'in_progress' | 'completed' | 'wishlist' | 'tasks';

const CourseCard: React.FC<{ course: Course; onClick: () => void }> = ({ course, onClick }) => (
    <div
        onClick={onClick}
        className="interactive-card flex flex-col rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-lg overflow-hidden cursor-pointer group hover:shadow-2xl hover:border-brand-primary/30 transition-all duration-300"
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
                    <div className="bg-gradient-to-r from-brand-primary to-brand-secondary h-full rounded-full shadow-[0_0_8px_rgba(56,189,248,0.6)]" style={{ width: `${course.progress}%` }}></div>
                </div>

                <button className="mt-4 w-full py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:bg-brand-primary hover:text-white dark:hover:bg-brand-primary transition-all duration-300">
                    {course.progress > 0 ? 'Continue' : 'Start Course'}
                </button>
            </div>
        </div>
    </div>
);

const TaskItem: React.FC<{ task: Task; onClick: () => void }> = ({ task, onClick }) => (
    <div onClick={onClick} className="interactive-card bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-5 flex items-center justify-between border border-white/50 dark:border-white/10 cursor-pointer hover:border-brand-primary/40 group transition-all">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors">
                <Icon name="check-circle" className="w-5 h-5" />
            </div>
            <div>
                <p className="font-bold text-slate-800 dark:text-white group-hover:text-brand-primary transition-colors">{task.text}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    <span className="font-medium text-rose-500">Due {task.dueDate}</span> • {task.courseTitle}
                </p>
            </div>
        </div>
        <Icon name="chevronRight" className="w-5 h-5 text-slate-400 group-hover:text-brand-primary transition-colors transform group-hover:translate-x-1" />
    </div>
);

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
                <div className="flex flex-col items-center justify-center py-20 bg-white/30 dark:bg-slate-800/30 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                    <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-6">
                        <Icon name="search" className="w-10 h-10 text-slate-300 dark:text-slate-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">No items found</h3>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">
                        {searchTerm ? 'Adjust filters to find what you need.' : `Your ${activeTab.replace('_', ' ')} list is empty.`}
                    </p>
                </div>
            )
        }

        if (activeTab === 'tasks') {
            return (
                <div className="space-y-4 max-w-4xl mx-auto">
                    {(content as Task[]).map(task => {
                        const course = courses.find(c => c.id === task.courseId);
                        return course ? <TaskItem key={task.id} task={task} onClick={() => navigateToCourse(course)} /> : null;
                    })}
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {(content as Course[]).map(course => (
                    <CourseCard key={course.id} course={course} onClick={() => navigateToCourse(course)} />
                ))}
            </div>
        )
    };

    const TabButton: React.FC<{ tabId: Tab, label: string }> = ({ tabId, label }) => (
        <button
            onClick={() => setActiveTab(tabId)}
            className={`
                px-5 py-2.5 font-bold text-sm rounded-full transition-all duration-300 whitespace-nowrap
                ${activeTab === tabId
                    ? 'bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-lg shadow-brand-primary/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                }
            `}
        >
            {label}
        </button>
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in">
            {/* Header Area */}
            <div className="flex flex-col gap-2 relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-secondary/10 rounded-full blur-[100px] pointer-events-none" />
                <h1 className="text-4xl font-black text-slate-900 dark:text-white">My Learnings</h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl">Track your progress, manage tasks, and revisit your achievements.</p>
            </div>

            {/* Controls Bar */}
            <div className="glass-ambient p-2 rounded-[24px] shadow-xl border border-white/50 dark:border-white/5 flex flex-col xl:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-1 p-1 overflow-x-auto w-full xl:w-auto scrollbar-none">
                    <TabButton tabId="in_progress" label="In Progress" />
                    <TabButton tabId="completed" label="Completed" />
                    <TabButton tabId="wishlist" label="Wishlist" />
                    <TabButton tabId="tasks" label="Pending Tasks" />
                </div>

                <div className="relative w-full xl:w-96 px-2 pb-2 xl:pb-0">
                    <input
                        type="text"
                        placeholder="Search your library..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary outline-none transition-all placeholder:text-slate-400 text-slate-800 dark:text-white"
                    />
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Icon name="search" className="w-5 h-5 text-slate-400" />
                    </div>
                </div>
            </div>

            <div className="min-h-[400px]">
                {renderContent()}
            </div>
        </div>
    );
};

export default MyLearnings;