import { useState, useEffect } from 'react';
import { db } from '../services/firebase';

export interface AdminStats {
    totalCourses: number;
    activeUsers: number;
    totalRevenue: number;
    revenueSeries: { name: string; data: number[] }[];
    categorySeries: number[];
    categoryLabels: string[];
    recentCourses: any[];
    loading: boolean;
}

export const useAdminStats = () => {
    const [stats, setStats] = useState<AdminStats>({
        totalCourses: 0,
        activeUsers: 0,
        totalRevenue: 0,
        revenueSeries: [],
        categorySeries: [],
        categoryLabels: [],
        recentCourses: [],
        loading: true,
    });

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;

        // Listen for auth state changes to ensure we have a user before fetching
        const authUnsubscribe = db.app.auth().onAuthStateChanged(async (user) => {
            if (!user) {
                // Not logged in, maybe stop loading or set empty
                setStats(prev => ({ ...prev, loading: false }));
                return;
            }



            try {
                // Fetch Counts
                const coursesSnap = await db.collection('courses').get();
                // Users collection requires authentication, so we wait for 'user' to be present
                const usersSnap = await db.collection('users').get();

                const totalCourses = coursesSnap.size;
                const activeUsers = usersSnap.size;

                // Calculate Category Breakdown
                const categoryCounts: Record<string, number> = {};
                coursesSnap.forEach(doc => {
                    const data = doc.data();
                    const cat = data.category || 'Uncategorized';
                    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
                });

                const categoryLabels = Object.keys(categoryCounts);
                const categorySeries = Object.values(categoryCounts);

                // Fetch Recent Courses
                const coursesData = coursesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                coursesData.sort((a: any, b: any) => {
                    const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                    const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                    return dateB - dateA;
                });
                const recentCourses = coursesData.slice(0, 5);

                // Mock Revenue Data (Area Chart)
                const totalRevenue = 12500;
                const revenueSeries = [
                    {
                        name: "Revenue",
                        data: [3100, 4000, 2800, 5100, 4200, 10900, 10000]
                    },
                    {
                        name: "Expenses",
                        data: [1100, 3200, 4500, 3200, 3400, 5200, 4100]
                    }
                ];

                setStats({
                    totalCourses,
                    activeUsers,
                    totalRevenue,
                    revenueSeries,
                    categorySeries,
                    categoryLabels,
                    recentCourses,
                    loading: false,
                });

            } catch (error) {
                console.error("Error fetching admin stats:", error);
                setStats(prev => ({ ...prev, loading: false }));
            }
        });

        return () => {
            authUnsubscribe();
            if (unsubscribe) unsubscribe();
        };
    }, []);

    return stats;
};
