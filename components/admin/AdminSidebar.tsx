import React from 'react';
import { LayoutDashboard, BookOpen, Users, Settings, LogOut, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { signOutUser } from '@/services/authService';

interface AdminSidebarProps {
    activeTab: 'dashboard' | 'courses' | 'users' | 'settings' | 'blog' | 'coupons';
    setActiveTab: (tab: 'dashboard' | 'courses' | 'users' | 'settings' | 'blog' | 'coupons') => void;
    isOpen?: boolean;
    onClose?: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, setActiveTab, isOpen = false, onClose }) => {
    const navigate = useNavigate();
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'courses', label: 'Courses', icon: BookOpen },
        { id: 'coupons', label: 'Coupons', icon: BookOpen },
        { id: 'blog', label: 'Blog', icon: BookOpen },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'settings', label: 'Settings', icon: Settings },
    ] as const;

    const handleLogout = async () => {
        await signOutUser();
        navigate('/');
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 h-screen bg-slate-950 md:bg-slate-900/95 backdrop-blur-xl border-r border-border-subtle/40 flex flex-col transition-transform duration-300 md:translate-x-0 md:static ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 border-b border-border-subtle/40 flex items-center justify-between">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Admin Panel
                    </h1>
                    <button
                        onClick={onClose}
                        className="p-1 text-text-secondary hover:text-text-primary md:hidden"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                setActiveTab(item.id);
                                onClose?.();
                            }}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${activeTab === item.id
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                                : 'text-text-secondary hover:bg-surface-muted/20 hover:text-text-primary'
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-border-subtle/40">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </div>
        </>
    );
};

export default AdminSidebar;
