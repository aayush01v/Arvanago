import React, { useMemo } from 'react';
import Chart from 'react-apexcharts';
import { User, Course } from '../types';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

interface StudentAnalyticsProps {
    user: User;
    courses: Course[];
}

const StudentAnalytics: React.FC<StudentAnalyticsProps> = ({ user, courses }) => {
    const chartRef = useScrollAnimation();

    // 1. Calculate Skill Distribution (Radar Chart)
    // Logic: aggregate progress by category from enrolled/ongoing courses
    const skillsData = useMemo(() => {
        const categoryProgress: { [key: string]: { total: number; count: number } } = {};

        // Combine enrolled and ongoing
        const userCourseIds = Array.from(new Set([...user.enrolledCourses, ...user.ongoingCourses]));

        userCourseIds.forEach(id => {
            const course = courses.find(c => c.id === id);
            if (course) {
                if (!categoryProgress[course.category]) {
                    categoryProgress[course.category] = { total: 0, count: 0 };
                }
                categoryProgress[course.category].total += course.progress || 0;
                categoryProgress[course.category].count += 1;
            }
        });

        const categories = Object.keys(categoryProgress);
        const data = categories.map(cat => {
            const stats = categoryProgress[cat];
            return Math.round(stats.total / stats.count);
        });

        // Fallback if no data
        if (categories.length < 3) {
            return {
                categories: ['Programming', 'Design', 'Marketing', 'Business', 'Soft Skills', 'Data Science'],
                data: [80, 45, 30, 60, 75, 50] // Mock data for empty state to look good
            };
        }

        return { categories, data };
    }, [user, courses]);

    // 2. Learning Activity (Bar Chart) - Mocked for now based on streak
    // In a real app, we'd need a daily activity log in Firestore
    const activityData = useMemo(() => {
        return [
            { x: 'Mon', y: 4 },
            { x: 'Tue', y: 6 },
            { x: 'Wed', y: user.streak > 0 ? 8 : 2 }, // Higher if active
            { x: 'Thu', y: 5 },
            { x: 'Fri', y: 7 },
            { x: 'Sat', y: 3 },
            { x: 'Sun', y: 9 },
        ];
    }, [user.streak]);


    const barChartOptions: ApexCharts.ApexOptions = {
        chart: {
            type: 'bar',
            toolbar: { show: false },
            background: 'transparent',
            fontFamily: 'inherit',
        },
        colors: ['#3b82f6'],
        plotOptions: {
            bar: {
                borderRadius: 8,
                columnWidth: '40%',
                distributed: true,
            }
        },
        dataLabels: { enabled: false },
        legend: { show: false },
        xaxis: {
            categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            labels: { style: { colors: '#94a3b8' } },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            show: false,
        },
        grid: {
            show: false,
            padding: { top: 0, right: 0, bottom: 0, left: 0 }
        },
        tooltip: {
            theme: 'dark',
            y: { formatter: (val) => `${val} hrs` }
        },
        theme: { mode: 'light' } // Override to control text colors manually if needed
    };

    const radarChartOptions: ApexCharts.ApexOptions = {
        chart: {
            type: 'radar',
            toolbar: { show: false },
            background: 'transparent',
            fontFamily: 'inherit',
        },
        stroke: { width: 2, colors: ['#8b5cf6'] },
        fill: { opacity: 0.2, colors: ['#8b5cf6'] },
        markers: { size: 4, colors: ['#8b5cf6'], strokeColors: '#fff', strokeWidth: 2 },
        yaxis: { show: false },
        xaxis: {
            categories: skillsData.categories,
            labels: {
                style: {
                    colors: skillsData.categories.map(() => '#94a3b8'),
                    fontSize: '12px',
                    fontFamily: 'inherit'
                }
            }
        },
        tooltip: { theme: 'dark' },
        plotOptions: {
            radar: {
                polygons: {
                    strokeColors: '#e2e8f0',
                    connectorColors: '#e2e8f0',
                }
            }
        }
    };

    return (
        <div ref={chartRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6 scroll-animate">

            {/* Activity Chart */}
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/50 dark:border-white/10 rounded-3xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Learning Activity</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Hours spent this week</p>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold font-mono">
                        +12% vs last week
                    </div>
                </div>
                <div className="h-[300px] w-full">
                    <Chart options={barChartOptions} series={[{ name: 'Hours', data: activityData.map(d => d.y) }]} type="bar" height="100%" />
                </div>
            </div>

            {/* Skills Radar */}
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/50 dark:border-white/10 rounded-3xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Skill Proficiency</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Based on course completion</p>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-bold font-mono">
                        Level {user.level} Scholar
                    </div>
                </div>
                <div className="h-[300px] w-full">
                    <Chart options={radarChartOptions} series={[{ name: 'Score', data: skillsData.data }]} type="radar" height="100%" />
                </div>
            </div>

        </div>
    );
};

export default StudentAnalytics;
