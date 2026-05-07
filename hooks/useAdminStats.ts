import { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import { db } from '../services/firebase';

export interface AdminStats {
    topCoursesCount: number;
    topProductsCount: number;
    numberOfCustomers: number;
    totalRevenue: number;
    revenueSeries: { name: string; data: number[] }[];
    revenueCategories: string[];
    categorySeries: number[];
    categoryLabels: string[];
    mostSoldItems: any[];
    coursesSoldThisMonth: number;
    revenueChangePercent: number | null;
    loading: boolean;
}

export const useAdminStats = () => {
    const [stats, setStats] = useState<AdminStats>({
        topCoursesCount: 0,
        topProductsCount: 0,
        numberOfCustomers: 0,
        totalRevenue: 0,
        revenueSeries: [],
        revenueCategories: [],
        categorySeries: [],
        categoryLabels: [],
        mostSoldItems: [],
        coursesSoldThisMonth: 0,
        revenueChangePercent: null,
        loading: true,
    });

    useEffect(() => {
        const authUnsubscribe = db.app.auth().onAuthStateChanged(async (user) => {
            if (!user) {
                setStats(prev => ({ ...prev, loading: false }));
                return;
            }

            try {
                const [coursesSnap, productsSnap, coursePaymentsSnap, storeOrdersSnap] = await Promise.all([
                    db.collection('courses').get(),
                    db.collection('products').get(),
                    db.collection('course_payments').where('status', '==', 'paid').get(),
                    db.collection('store_orders').where('status', '==', 'paid').get(),
                ]);

                const coursesMap = new Map(coursesSnap.docs.map((d) => [d.id, d.data()]));
                const productsMap = new Map(productsSnap.docs.map((d) => [d.id, d.data()]));

                const monthlyLabels: string[] = [];
                const monthIndexMap = new Map<string, number>();
                for (let i = 5; i >= 0; i--) {
                    const dt = new Date();
                    dt.setMonth(dt.getMonth() - i);
                    const key = `${dt.getFullYear()}-${dt.getMonth()}`;
                    monthIndexMap.set(key, monthlyLabels.length);
                    monthlyLabels.push(dt.toLocaleString('en-IN', { month: 'short' }));
                }

                const courseRevenueByMonth = new Array(monthlyLabels.length).fill(0);
                const productRevenueByMonth = new Array(monthlyLabels.length).fill(0);
                const coursesSoldThisMonthSet = new Set<string>();
                const courseSalesCount = new Map<string, number>();
                const productSalesCount = new Map<string, number>();
                const dedupedCustomerSpend = new Map<string, number>();

                let totalCourseRevenue = 0;
                let totalProductRevenue = 0;

                coursePaymentsSnap.forEach((doc) => {
                    const p = doc.data();
                    const amount = Number(p.amount || 0);
                    const ts = p.createdAt as firebase.firestore.Timestamp | undefined;
                    const dt = ts?.toDate?.() || null;
                    if (dt) {
                        const monthKey = `${dt.getFullYear()}-${dt.getMonth()}`;
                        const idx = monthIndexMap.get(monthKey);
                        if (idx !== undefined) courseRevenueByMonth[idx] += amount;
                    }

                    totalCourseRevenue += amount;
                    if (p.courseId) {
                        courseSalesCount.set(p.courseId, (courseSalesCount.get(p.courseId) || 0) + 1);
                        const now = new Date();
                        if (dt && dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth()) {
                            coursesSoldThisMonthSet.add(p.courseId);
                        }
                    }
                    if (p.userId) dedupedCustomerSpend.set(p.userId, (dedupedCustomerSpend.get(p.userId) || 0) + amount);
                });

                storeOrdersSnap.forEach((doc) => {
                    const o = doc.data();
                    const amount = Number(o.totalAmount || 0);
                    const ts = o.createdAt as firebase.firestore.Timestamp | undefined;
                    const dt = ts?.toDate?.() || null;
                    if (dt) {
                        const monthKey = `${dt.getFullYear()}-${dt.getMonth()}`;
                        const idx = monthIndexMap.get(monthKey);
                        if (idx !== undefined) productRevenueByMonth[idx] += amount;
                    }

                    totalProductRevenue += amount;
                    if (o.userId) dedupedCustomerSpend.set(o.userId, (dedupedCustomerSpend.get(o.userId) || 0) + amount);
                    (o.items || []).forEach((item: any) => {
                        if (item?.productId) {
                            productSalesCount.set(item.productId, (productSalesCount.get(item.productId) || 0) + Number(item.quantity || 0));
                        }
                    });
                });

                const numberOfCustomers = Array.from(dedupedCustomerSpend.values()).filter((total) => total > 2).length;
                const topCoursesCount = Array.from(courseSalesCount.values()).filter((count) => count > 0).length;
                const topProductsCount = Array.from(productSalesCount.values()).filter((count) => count > 0).length;

                const mostSoldItems = [
                    ...Array.from(courseSalesCount.entries()).map(([id, count]) => ({
                        id: `course-${id}`,
                        itemId: id,
                        type: 'Course',
                        title: coursesMap.get(id)?.title || 'Unknown Course',
                        category: coursesMap.get(id)?.category || 'Course',
                        price: Number(coursesMap.get(id)?.price || 0),
                        salesCount: count,
                        thumbnail: coursesMap.get(id)?.thumbnail || ''
                    })),
                    ...Array.from(productSalesCount.entries()).map(([id, count]) => ({
                        id: `product-${id}`,
                        itemId: id,
                        type: 'Product',
                        title: productsMap.get(id)?.name || 'Unknown Product',
                        category: productsMap.get(id)?.category || 'Store',
                        price: Number(productsMap.get(id)?.price || 0),
                        salesCount: count,
                        thumbnail: productsMap.get(id)?.imageUrl || ''
                    })),
                ].sort((a, b) => b.salesCount - a.salesCount).slice(0, 8);

                const currentMonthRevenue = (courseRevenueByMonth.at(-1) || 0) + (productRevenueByMonth.at(-1) || 0);
                const previousMonthRevenue = (courseRevenueByMonth.at(-2) || 0) + (productRevenueByMonth.at(-2) || 0);
                const revenueChangePercent = previousMonthRevenue > 0
                    ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
                    : null;

                setStats({
                    topCoursesCount,
                    topProductsCount,
                    numberOfCustomers,
                    totalRevenue: totalCourseRevenue + totalProductRevenue,
                    revenueSeries: [
                        { name: 'Course Revenue', data: courseRevenueByMonth },
                        { name: 'Store Revenue', data: productRevenueByMonth },
                    ],
                    revenueCategories: monthlyLabels,
                    categorySeries: [topCoursesCount, topProductsCount],
                    categoryLabels: ['Courses Sold', 'Products Sold'],
                    mostSoldItems,
                    coursesSoldThisMonth: coursesSoldThisMonthSet.size,
                    revenueChangePercent,
                    loading: false,
                });
            } catch (error) {
                console.error('Error fetching admin stats:', error);
                setStats(prev => ({ ...prev, loading: false }));
            }
        });

        return () => authUnsubscribe();
    }, []);

    return stats;
};
