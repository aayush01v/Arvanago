import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Tag, Loader2, Calendar, BookOpen } from 'lucide-react';
import { Coupon, Course } from '@/types';
import { createCoupon, getCoupons, deleteCoupon, getCourses } from '@/services/firestoreService';

const CouponManager: React.FC = () => {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    // Form State
    const [code, setCode] = useState('');
    const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
    const [discountValue, setDiscountValue] = useState<number>(0);
    const [expiryDate, setExpiryDate] = useState('');
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [couponsData, coursesData] = await Promise.all([
                getCoupons(),
                getCourses()
            ]);
            setCoupons(couponsData);
            setCourses(coursesData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            await createCoupon({
                code,
                discountType,
                discountValue,
                courseId: selectedCourseId || undefined,
                expiryDate: expiryDate ? new Date(expiryDate).toISOString() : undefined,
            });
            setCode('');
            setDiscountValue(0);
            setExpiryDate('');
            setSelectedCourseId('');

            // Refresh coupons list
            const updatedCoupons = await getCoupons();
            setCoupons(updatedCoupons);
        } catch (error) {
            console.error(error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this coupon?')) return;
        try {
            await deleteCoupon(id);
            setCoupons(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Create Coupon Card */}
            <div className="p-6 rounded-2xl bg-[#1e293b]/50 border border-white/10 backdrop-blur-sm">
                <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-blue-400" />
                    Create New Coupon
                </h3>
                <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                    <div className="md:col-span-1">
                        <label className="block text-xs font-medium text-slate-400 mb-1">Code</label>
                        <div className="relative">
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                placeholder="SAVE20"
                                className="w-full pl-9 pr-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white text-sm focus:border-blue-500 outline-none uppercase"
                                required
                            />
                        </div>
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-xs font-medium text-slate-400 mb-1">Type</label>
                        <select
                            value={discountType}
                            onChange={(e) => setDiscountType(e.target.value as any)}
                            className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white text-sm focus:border-blue-500 outline-none"
                        >
                            <option value="percentage">Percentage (%)</option>
                            <option value="fixed">Fixed Amount</option>
                        </select>
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-xs font-medium text-slate-400 mb-1">Value</label>
                        <input
                            type="number"
                            value={discountValue}
                            onChange={(e) => setDiscountValue(Number(e.target.value))}
                            min="0"
                            className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white text-sm focus:border-blue-500 outline-none"
                            required
                        />
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-xs font-medium text-slate-400 mb-1">Course (Optional)</label>
                        <select
                            value={selectedCourseId}
                            onChange={(e) => setSelectedCourseId(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white text-sm focus:border-blue-500 outline-none truncate"
                        >
                            <option value="">All Courses</option>
                            {courses.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.title.length > 20 ? c.title.substring(0, 20) + '...' : c.title}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-xs font-medium text-slate-400 mb-1">Expiry (Optional)</label>
                        <input
                            type="date"
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white text-sm focus:border-blue-500 outline-none"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isCreating || !code}
                        className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Create
                    </button>
                </form>
            </div>

            {/* Coupons List */}
            <div className="p-6 rounded-2xl bg-[#1e293b]/50 border border-white/10 backdrop-blur-sm">
                <h3 className="text-white text-lg font-semibold mb-4">Active Coupons</h3>
                {loading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    </div>
                ) : coupons.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">No active coupons found.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead className="bg-white/5 text-xs uppercase font-semibold text-slate-200">
                                <tr>
                                    <th className="px-4 py-3 rounded-l-lg">Code</th>
                                    <th className="px-4 py-3">Discount</th>
                                    <th className="px-4 py-3">Usage</th>
                                    <th className="px-4 py-3">Course</th>
                                    <th className="px-4 py-3">Expiry</th>
                                    <th className="px-4 py-3 rounded-r-lg text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {coupons.map((coupon) => {
                                    const linkedCourse = courses.find(c => c.id === coupon.courseId);
                                    return (
                                        <tr key={coupon.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-3 font-mono font-bold text-white tracking-wider">
                                                {coupon.code}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20">
                                                    {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `Flat ${coupon.discountValue} OFF`}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-300">
                                                {coupon.usageCount} uses
                                            </td>
                                            <td className="px-4 py-3 text-slate-300">
                                                {linkedCourse ? (
                                                    <div className="flex items-center gap-1" title={linkedCourse.title}>
                                                        <BookOpen className="w-3 h-3 text-blue-400" />
                                                        <span className="truncate max-w-[100px]">{linkedCourse.title}</span>
                                                    </div>
                                                ) : <span className="opacity-50">All Courses</span>}
                                            </td>
                                            <td className="px-4 py-3">
                                                {coupon.expiryDate ? (
                                                    <span className="flex items-center gap-1.5 text-slate-300">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {new Date(coupon.expiryDate).toLocaleDateString()}
                                                    </span>
                                                ) : <span className="text-slate-500">No expiry</span>}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() => handleDelete(coupon.id)}
                                                    className="text-red-400 hover:text-red-300 hover:bg-red-400/10 p-2 rounded-lg transition-colors"
                                                    title="Delete Coupon"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CouponManager;
