import React, { useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import AdminSidebar from '../components/admin/AdminSidebar';
import CourseManager from '../components/admin/CourseManager';
import UserManagement from '../components/admin/UserManagement';
import AdminSettings from '../components/admin/AdminSettings';
import { useAdminStats } from '../hooks/useAdminStats';
import { Users, BookOpen, DollarSign, TrendingUp, Clock } from 'lucide-react';

const AdminPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'courses' | 'users' | 'settings'>('dashboard');
    const {
        totalCourses,
        activeUsers,
        totalRevenue,
        revenueSeries,
        categorySeries,
        categoryLabels,
        recentCourses,
        loading
    } = useAdminStats();

    // Chart Options
    const revenueOptions: ApexCharts.ApexOptions = {
        chart: {
            type: 'area',
            height: 350,
            toolbar: { show: false },
            background: 'transparent'
        },
        colors: ['#3b82f6', '#ec4899'],
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 2 },
        xaxis: {
            categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
            labels: { style: { colors: '#94a3b8' } },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            labels: { style: { colors: '#94a3b8' } }
        },
        grid: {
            borderColor: 'rgba(255,255,255,0.05)',
            strokeDashArray: 4,
        },
        theme: { mode: 'dark' },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.7,
                opacityTo: 0.1,
                stops: [0, 90, 100]
            }
        },
        legend: { position: 'top', horizontalAlign: 'right' }
    };

    const categoryOptions: ApexCharts.ApexOptions = {
        chart: {
            type: 'donut',
            background: 'transparent'
        },
        labels: categoryLabels,
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'],
        stroke: { show: true, colors: ['#000000'], width: 2 },
        dataLabels: { enabled: false },
        legend: { position: 'bottom', labels: { colors: '#94a3b8' } },
        plotOptions: {
            pie: {
                donut: {
                    size: '70%',
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: 'Courses',
                            color: '#e2e8f0',
                            formatter: function (w) {
                                return w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0).toString()
                            }
                        }
                    }
                }
            }
        }
    };

    const renderContent = () => {
        if (loading && activeTab === 'dashboard') {
            return (
                <div className="flex items-center justify-center h-full min-h-[400px]">
                    <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-blue-500" />
                </div>
            );
        }

        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className="space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-6 rounded-2xl bg-[#1e293b]/50 border border-white/10 backdrop-blur-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <BookOpen className="w-16 h-16 text-blue-500" />
                                </div>
                                <h3 className="text-slate-400 text-sm font-medium mb-2 flex items-center gap-2">
                                    Top Courses
                                </h3>
                                <p className="text-3xl font-bold text-white mb-1">{totalCourses}</p>
                                <p className="text-xs text-green-400 flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" /> +2 new this month
                                </p>
                            </div>

                            <div className="p-6 rounded-2xl bg-[#1e293b]/50 border border-white/10 backdrop-blur-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Users className="w-16 h-16 text-purple-500" />
                                </div>
                                <h3 className="text-slate-400 text-sm font-medium mb-2">Active Users</h3>
                                <p className="text-3xl font-bold text-white mb-1">{activeUsers}</p>
                                <p className="text-xs text-green-400 flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" /> +12% vs last month
                                </p>
                            </div>

                            <div className="p-6 rounded-2xl bg-[#1e293b]/50 border border-white/10 backdrop-blur-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <DollarSign className="w-16 h-16 text-amber-500" />
                                </div>
                                <h3 className="text-slate-400 text-sm font-medium mb-2">Total Revenue</h3>
                                <p className="text-3xl font-bold text-white mb-1">${totalRevenue.toLocaleString()}</p>
                                <p className="text-xs text-green-400 flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" /> +8% vs last month
                                </p>
                            </div>
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Revenue Chart */}
                            <div className="lg:col-span-2 p-6 rounded-2xl bg-[#1e293b]/50 border border-white/10 backdrop-blur-sm">
                                <h3 className="text-white text-lg font-semibold mb-6">Revenue Updates</h3>
                                <div className="min-h-[300px]">
                                    <ReactApexChart options={revenueOptions} series={revenueSeries} type="area" height={300} />
                                </div>
                            </div>

                            {/* Category Breakup */}
                            <div className="p-6 rounded-2xl bg-[#1e293b]/50 border border-white/10 backdrop-blur-sm">
                                <h3 className="text-white text-lg font-semibold mb-6">Yearly Breakup</h3>
                                <div className="min-h-[300px] flex items-center justify-center">
                                    <ReactApexChart options={categoryOptions} series={categorySeries} type="donut" height={300} />
                                </div>
                            </div>
                        </div>

                        {/* Recent Courses Table */}
                        <div className="p-6 rounded-2xl bg-[#1e293b]/50 border border-white/10 backdrop-blur-sm">
                            <h3 className="text-white text-lg font-semibold mb-4">Recent Courses</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-400">
                                    <thead className="bg-white/5 text-xs uppercase font-semibold text-slate-200">
                                        <tr>
                                            <th className="px-4 py-3 rounded-l-lg">Course Title</th>
                                            <th className="px-4 py-3">Category</th>
                                            <th className="px-4 py-3">Price</th>
                                            <th className="px-4 py-3 rounded-r-lg">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {recentCourses.map((course) => (
                                            <tr key={course.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-3 font-medium text-white flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded bg-slate-700 overflow-hidden flex-shrink-0">
                                                        {course.thumbnail ? (
                                                            <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-slate-800 text-xs">IMG</div>
                                                        )}
                                                    </div>
                                                    {course.title}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="px-2 py-1 rounded-full text-xs bg-slate-700 text-slate-300 border border-white/10">
                                                        {course.category}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-white">
                                                    ${course.price || 'Free'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${course.isPublished
                                                        ? 'bg-green-500/20 text-green-400 border border-green-500/20'
                                                        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20'
                                                        }`}>
                                                        {course.isPublished ? 'Active' : 'Draft'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );
            case 'courses':
                return <CourseManager />;
            case 'users':
                return <UserManagement />;
            case 'settings':
                return <AdminSettings />;
            default:
                return null;
        }
    };

    return (
        <div className="flex min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-blue-500/30">
            <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            <main className="flex-1 overflow-y-auto max-h-screen">
                <div className="p-4 md:p-8">
                    <header className="mb-8 flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-2">
                                {activeTab === 'dashboard' ? 'Dashboard' :
                                    activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                            </h2>
                            <p className="text-slate-400">Manage your platform content and settings</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-slate-500 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Last updated: Now
                            </span>
                        </div>
                    </header>

                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default AdminPage;
