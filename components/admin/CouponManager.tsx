import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Tag, Loader2, Calendar, BookOpen, ShoppingBag, Globe } from 'lucide-react';
import { Coupon, Course, Product } from '@/types';
import { createCoupon, getCoupons, deleteCoupon, getCourses } from '@/services/firestoreService';
import { db } from '@/services/firebase';

const CouponManager: React.FC = () => {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState('');

    // Form State
    const [code, setCode] = useState('');
    const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
    const [discountValue, setDiscountValue] = useState<number>(0);
    const [expiryDate, setExpiryDate] = useState('');
    const [maxUses, setMaxUses] = useState<number | ''>('');

    // Scope
    const [applicableTo, setApplicableTo] = useState<'courses' | 'store' | 'all'>('courses');
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [selectedProductId, setSelectedProductId] = useState<string>('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [couponsData, coursesData, productsSnap] = await Promise.all([
                getCoupons(),
                getCourses(),
                db.collection('products').get()
            ]);
            setCoupons(couponsData);
            setCourses(coursesData);
            setProducts(productsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateError('');

        // Client-side validation
        if (discountType === 'percentage' && (discountValue <= 0 || discountValue > 100)) {
            setCreateError('Percentage discount must be between 1 and 100.');
            return;
        }
        if (discountType === 'fixed' && discountValue <= 0) {
            setCreateError('Fixed discount must be greater than 0.');
            return;
        }

        setIsCreating(true);
        try {
            await createCoupon({
                code: code.toUpperCase().trim(),
                discountType,
                discountValue,
                applicableTo,
                courseId: applicableTo === 'courses' && selectedCourseId ? selectedCourseId : undefined,
                productId: applicableTo === 'store' && selectedProductId ? selectedProductId : undefined,
                expiryDate: expiryDate ? new Date(expiryDate).toISOString() : undefined,
                maxUses: maxUses !== '' ? Number(maxUses) : undefined,
            });
            setCode('');
            setDiscountValue(0);
            setExpiryDate('');
            setSelectedCourseId('');
            setSelectedProductId('');
            setMaxUses('');

            const updatedCoupons = await getCoupons();
            setCoupons(updatedCoupons);
        } catch (error: any) {
            setCreateError(error.message || 'Failed to create coupon.');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this coupon? This cannot be undone.')) return;
        try {
            await deleteCoupon(id);
            setCoupons(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            console.error(error);
        }
    };

    const getScopeIcon = (c: Coupon) => {
        if (c.applicableTo === 'store') return <ShoppingBag className="w-3 h-3 text-purple-400" />;
        if (c.applicableTo === 'all') return <Globe className="w-3 h-3 text-emerald-400" />;
        return <BookOpen className="w-3 h-3 text-blue-400" />;
    };

    const getScopeLabel = (c: Coupon) => {
        if (c.productId) {
            const p = products.find(p => p.id === c.productId);
            return p ? p.name.substring(0, 20) + (p.name.length > 20 ? '…' : '') : 'Specific Product';
        }
        if (c.courseId) {
            const course = courses.find(co => co.id === c.courseId);
            return course ? course.title.substring(0, 20) + '…' : 'Specific Course';
        }
        if (c.applicableTo === 'store') return 'All Store Products';
        if (c.applicableTo === 'all') return 'Courses + Store';
        return 'All Courses';
    };

    return (
        <div className="space-y-6">
            {/* Create Coupon Card */}
            <div className="p-6 rounded-2xl bg-[#1e293b]/50 border border-white/10 backdrop-blur-sm">
                <h3 className="text-white text-lg font-semibold mb-5 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-blue-400" />
                    Create New Coupon
                </h3>
                <form onSubmit={handleCreate} className="space-y-4">
                    {/* Row 1: Code, Type, Value, Expiry, Max Uses */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Code *</label>
                            <div className="relative">
                                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                                    placeholder="SAVE20"
                                    className="w-full pl-9 pr-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-lg text-white text-sm focus:border-blue-500 outline-none uppercase tracking-wider"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Discount Type *</label>
                            <select
                                value={discountType}
                                onChange={(e) => setDiscountType(e.target.value as any)}
                                className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-lg text-white text-sm focus:border-blue-500 outline-none"
                            >
                                <option value="percentage">Percentage (%)</option>
                                <option value="fixed">Fixed Amount (₹)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                                Value * {discountType === 'percentage' ? '(1–100)' : '(₹)'}
                            </label>
                            <input
                                type="number"
                                value={discountValue}
                                onChange={(e) => setDiscountValue(Number(e.target.value))}
                                min="1"
                                max={discountType === 'percentage' ? 100 : undefined}
                                className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-lg text-white text-sm focus:border-blue-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Expiry (Optional)</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                <input
                                    type="date"
                                    value={expiryDate}
                                    onChange={(e) => setExpiryDate(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-lg text-white text-sm focus:border-blue-500 outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Max Uses (Optional)</label>
                            <input
                                type="number"
                                value={maxUses}
                                onChange={(e) => setMaxUses(e.target.value === '' ? '' : Number(e.target.value))}
                                min="1"
                                placeholder="Unlimited"
                                className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-lg text-white text-sm focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Row 2: Scope selection */}
                    <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5 space-y-3">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Scope & Target</p>
                        <div className="flex flex-wrap gap-3">
                            {(['courses', 'store', 'all'] as const).map(scope => (
                                <button
                                    key={scope}
                                    type="button"
                                    onClick={() => { setApplicableTo(scope); setSelectedCourseId(''); setSelectedProductId(''); }}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                                        applicableTo === scope
                                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                                            : 'bg-slate-800 border-white/10 text-slate-300 hover:border-blue-500/50'
                                    }`}
                                >
                                    {scope === 'courses' && <BookOpen className="w-4 h-4" />}
                                    {scope === 'store' && <ShoppingBag className="w-4 h-4" />}
                                    {scope === 'all' && <Globe className="w-4 h-4" />}
                                    {scope === 'courses' ? 'Courses Only' : scope === 'store' ? 'Store Only' : 'Courses + Store'}
                                </button>
                            ))}
                        </div>

                        {/* Sub-target selector */}
                        {applicableTo === 'courses' && (
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Restrict to specific course (optional)</label>
                                <select
                                    value={selectedCourseId}
                                    onChange={(e) => setSelectedCourseId(e.target.value)}
                                    className="w-full md:w-80 px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white text-sm focus:border-blue-500 outline-none"
                                >
                                    <option value="">All Courses</option>
                                    {courses.map(c => (
                                        <option key={c.id} value={c.id}>{c.title}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {applicableTo === 'store' && (
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Restrict to specific product (optional)</label>
                                <select
                                    value={selectedProductId}
                                    onChange={(e) => setSelectedProductId(e.target.value)}
                                    className="w-full md:w-80 px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white text-sm focus:border-blue-500 outline-none"
                                >
                                    <option value="">All Store Products</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {createError && (
                        <p className="text-sm text-red-400 bg-red-900/20 border border-red-900/30 p-3 rounded-lg">
                            ⚠️ {createError}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={isCreating || !code || discountValue <= 0}
                        className="bg-blue-600 text-white font-semibold py-2.5 px-6 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-blue-500/20"
                    >
                        {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Create Coupon
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
                    <p className="text-slate-400 text-center py-8">No coupons yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px] text-left text-sm text-slate-400">
                            <thead className="bg-white/5 text-xs uppercase font-semibold text-slate-200">
                                <tr>
                                    <th className="px-4 py-3 rounded-l-lg">Code</th>
                                    <th className="px-4 py-3">Discount</th>
                                    <th className="px-4 py-3">Scope</th>
                                    <th className="px-4 py-3">Target</th>
                                    <th className="px-4 py-3">Usage</th>
                                    <th className="px-4 py-3">Expiry</th>
                                    <th className="px-4 py-3 rounded-r-lg text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {coupons.map((coupon) => (
                                    <tr key={coupon.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3 font-mono font-bold text-white tracking-wider">
                                            {coupon.code}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20 text-xs font-bold">
                                                {coupon.discountType === 'percentage'
                                                    ? `${coupon.discountValue}% OFF`
                                                    : `₹${coupon.discountValue} OFF`}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md w-fit ${
                                                coupon.applicableTo === 'store' ? 'bg-purple-500/10 text-purple-400' :
                                                coupon.applicableTo === 'all' ? 'bg-emerald-500/10 text-emerald-400' :
                                                'bg-blue-500/10 text-blue-400'
                                            }`}>
                                                {getScopeIcon(coupon)}
                                                {coupon.applicableTo === 'store' ? 'Store' : coupon.applicableTo === 'all' ? 'All' : 'Courses'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-300 text-xs max-w-[130px] truncate" title={getScopeLabel(coupon)}>
                                            {getScopeLabel(coupon)}
                                        </td>
                                        <td className="px-4 py-3 text-slate-300">
                                            {coupon.usageCount || 0}
                                            {coupon.maxUses ? ` / ${coupon.maxUses}` : ''} uses
                                        </td>
                                        <td className="px-4 py-3">
                                            {coupon.expiryDate
                                                ? <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{new Date(coupon.expiryDate).toLocaleDateString()}</span>
                                                : <span className="text-slate-500">No expiry</span>}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => handleDelete(coupon.id)}
                                                className="text-red-400 hover:text-red-300 hover:bg-red-400/10 p-2 rounded-lg transition-colors"
                                                title="Delete coupon"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CouponManager;
