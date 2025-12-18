import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { User } from '../../types';
import { Search, Shield, ShieldOff, MoreVertical, Trash2, Ban, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const snapshot = await db.collection('users').get();
                const fetchedUsers = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
                setUsers(fetchedUsers);
            } catch (error) {
                console.error("Error fetching users:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const [suspendingUser, setSuspendingUser] = useState<User | null>(null);

    const toggleAdminRole = async (user: User) => {
        const newRole = user.role === 'admin' ? 'student' : 'admin';
        try {
            await db.collection('users').doc(user.uid).update({ role: newRole });
            // Update Admins Collection
            // NOTE: admins collection is secondary, but we maintain it for legacy reasons if needed
            if (newRole === 'admin') {
                await db.collection('admins').doc(user.uid).set({
                    uid: user.uid,
                    email: user.email,
                    role: 'admin',
                    promotedAt: new Date().toISOString()
                });
            } else {
                await db.collection('admins').doc(user.uid).delete();
            }

            setUsers(prev => prev.map(u => u.uid === user.uid ? { ...u, role: newRole } : u));
        } catch (error) {
            console.error("Error updating role:", error);
            alert("Failed to update user role");
        }
    };

    const handleSuspend = async (duration: '1_day' | '1_week' | '1_month' | '1_year' | 'indefinite') => {
        if (!suspendingUser) return;

        let disabledUntil: Date | null = null;
        const now = new Date();

        switch (duration) {
            case '1_day': disabledUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000); break;
            case '1_week': disabledUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); break;
            case '1_month': disabledUntil = new Date(now.setMonth(now.getMonth() + 1)); break;
            case '1_year': disabledUntil = new Date(now.setFullYear(now.getFullYear() + 1)); break;
            case 'indefinite': disabledUntil = null; break;
        }

        try {
            await db.collection('users').doc(suspendingUser.uid).update({
                isDisabled: true,
                disabledUntil: disabledUntil ? new Date(disabledUntil) : null
            });
            setUsers(prev => prev.map(u => u.uid === suspendingUser.uid ? {
                ...u,
                isDisabled: true,
                disabledUntil: disabledUntil ? { toDate: () => disabledUntil } as any : null
            } : u));
            setSuspendingUser(null);
        } catch (error) {
            console.error("Error suspending user:", error);
            alert("Failed to suspend user");
        }
    };

    const reenbleUser = async (user: User) => {
        try {
            await db.collection('users').doc(user.uid).update({
                isDisabled: false,
                disabledUntil: null
            });
            setUsers(prev => prev.map(u => u.uid === user.uid ? { ...u, isDisabled: false, disabledUntil: null } : u));
        } catch (error) {
            console.error("Error enabling user:", error);
            alert("Failed to enable user");
        }
    }


    const deleteUser = async (user: User) => {
        if (!window.confirm(`⚠️ DANGER: Are you sure you want to DELETE ${user.name}? They will be blocked and their data wiped.`)) return;

        try {
            // Soft Delete: Mark as deleted and clear PII
            await db.collection('users').doc(user.uid).update({
                isDeleted: true,
                isDisabled: true, // Redundant but safe
                name: 'Deleted User',
                avatar: `https://ui-avatars.com/api/?name=Deleted+User&background=000000&color=fff`,
                bio: 'This account has been deleted.',
                email: `${user.uid}@deleted.arvanago.com` // Prevent unique constraint issues if re-registering
            });

            // Delete from Admins if exists
            await db.collection('admins').doc(user.uid).delete();

            setUsers(prev => prev.filter(u => u.uid !== user.uid));
        } catch (error) {
            console.error("Error deleting user:", error);
            alert("Failed to delete user. Check console for details.");
        }
    };

    const filteredUsers = users.filter(user =>
        (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase())) &&
        !user.isDeleted // FILTER OUT DELETED USERS
    );

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-[#1e293b]/50 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search users by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-500/50"
                    />
                </div>
                <div className="text-sm text-slate-400">
                    Total Users: <span className="text-white font-bold">{users.length}</span>
                </div>
            </div>

            <div className="bg-[#1e293b]/50 rounded-xl border border-white/10 backdrop-blur-sm overflow-hidden">
                <table className="w-full text-left text-sm text-slate-400">
                    <thead className="bg-white/5 text-xs uppercase font-semibold text-slate-200">
                        <tr>
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Joined</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredUsers.map((user) => (
                            <tr key={user.uid} className={`hover:bg-white/5 transition-colors ${user.isDisabled ? 'opacity-50 grayscale' : ''}`}>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                                            alt=""
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.onerror = null; // Prevent infinite loop
                                                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;
                                            }}
                                            className="w-10 h-10 rounded-full bg-slate-700 object-cover"
                                        />
                                        <div>
                                            <div className="font-medium text-white">{user.name}</div>
                                            <div className="text-xs text-slate-500">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${user.role === 'admin'
                                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                        : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                        }`}>
                                        {user.role === 'admin' ? <Shield className="w-3 h-3" /> : null}
                                        {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Student'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {user.isDisabled ? (
                                        <div className="flex flex-col">
                                            <span className="inline-flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                                                Disabled
                                            </span>
                                            {user.disabledUntil && (
                                                <span className="text-[10px] text-red-400 mt-1">
                                                    Until: {format(user.disabledUntil.toDate(), 'MMM d, yyyy')}
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                                            Active
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {user.lastLogin && typeof user.lastLogin.toDate === 'function'
                                        ? format(user.lastLogin.toDate(), 'MMM d, yyyy')
                                        : 'Recently'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => toggleAdminRole(user)}
                                            className={`p-2 rounded-lg transition-colors ${user.role === 'admin'
                                                ? 'hover:bg-purple-500/10 text-purple-400'
                                                : 'hover:bg-blue-500/10 text-blue-400'
                                                }`}
                                            title={user.role === 'admin' ? "Remove Admin Access" : "Grant Admin Access"}
                                        >
                                            {user.role === 'admin' ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                                        </button>

                                        {user.isDisabled ? (
                                            <button
                                                onClick={() => reenbleUser(user)}
                                                className="p-2 rounded-lg hover:bg-green-500/10 text-green-400 transition-colors"
                                                title="Enable User"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => setSuspendingUser(user)}
                                                className="p-2 rounded-lg hover:bg-amber-500/10 text-amber-400 transition-colors"
                                                title="Disable User"
                                            >
                                                <Ban className="w-4 h-4" />
                                            </button>
                                        )}

                                        <button
                                            onClick={() => deleteUser(user)}
                                            className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                                            title="Delete User"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredUsers.length === 0 && (
                    <div className="p-12 text-center text-slate-500">
                        No users found matching your search.
                    </div>
                )}
            </div>

            {/* Suspension Modal */}
            {suspendingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-[#1e293b] rounded-2xl border border-white/10 p-6 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-2">Suspend {suspendingUser.name}</h3>
                        <p className="text-slate-400 text-sm mb-6">Select how long this user should be disabled. They will be automatically re-enabled after this period.</p>

                        <div className="space-y-3">
                            <button onClick={() => handleSuspend('1_day')} className="w-full p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-left transition-colors flex items-center justify-between group">
                                <span className="text-slate-200 group-hover:text-white">24 Hours</span>
                                <span className="text-xs text-slate-500">1 Day</span>
                            </button>
                            <button onClick={() => handleSuspend('1_week')} className="w-full p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-left transition-colors flex items-center justify-between group">
                                <span className="text-slate-200 group-hover:text-white">7 Days</span>
                                <span className="text-xs text-slate-500">1 Week</span>
                            </button>
                            <button onClick={() => handleSuspend('1_month')} className="w-full p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-left transition-colors flex items-center justify-between group">
                                <span className="text-slate-200 group-hover:text-white">30 Days</span>
                                <span className="text-xs text-slate-500">1 Month</span>
                            </button>
                            <button onClick={() => handleSuspend('1_year')} className="w-full p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-left transition-colors flex items-center justify-between group">
                                <span className="text-slate-200 group-hover:text-white">365 Days</span>
                                <span className="text-xs text-slate-500">1 Year</span>
                            </button>
                            <button onClick={() => handleSuspend('indefinite')} className="w-full p-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-left transition-colors flex items-center justify-between group">
                                <span className="text-red-400 group-hover:text-red-300 font-medium">Indefinite Ban</span>
                                <span className="text-xs text-red-500/60">Permanent</span>
                            </button>
                        </div>

                        <button
                            onClick={() => setSuspendingUser(null)}
                            className="mt-6 w-full py-3 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
