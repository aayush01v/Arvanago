import React from 'react';
import { Navigate } from 'react-router-dom';
import { User } from '../types';

interface AdminRouteProps {
    user: User | null;
    authReady: boolean;
    children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ user, authReady, children }) => {
    if (!authReady) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-black">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/admin/login" replace />;
    }

    if (user.role !== 'admin' && user.role !== 'super_admin') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
                <h1 className="text-2xl font-bold mb-2 text-red-500">Access Denied</h1>
                <p className="text-gray-400 mb-4">You do not have permission to view this page.</p>
                <button
                    onClick={() => window.location.href = '/dashboard'}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                    Return to Dashboard
                </button>
            </div>
        );
    }

    return <>{children}</>;
};

export default AdminRoute;
