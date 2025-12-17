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

    const toggleAdminRole = async (user: User) => {
        const newRole = user.role === 'admin' ? 'student' : 'admin';
        try {
            // Update User Doc
            await db.collection('users').doc(user.uid).update({ role: newRole });

            // Update Admins Collection
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

            // Update UI
            setUsers(prev => prev.map(u => u.uid === user.uid ? { ...u, role: newRole } : u));
        } catch (error) {
            console.error("Error updating role:", error);
            alert("Failed to update user role");
        }
    };

    const toggleDisableUser = async (user: User) => {
        const newState = !user.isDisabled;
        try {
            await db.collection('users').doc(user.uid).update({ isDisabled: newState });
            setUsers(prev => prev.map(u => u.uid === user.uid ? { ...u, isDisabled: newState } : u));
        } catch (error) {
            console.error("Error updating user status:", error);
            alert("Failed to update user status");
        }
    };

    const deleteUser = async (user: User) => {
        if (!window.confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) return;

        try {
            await db.collection('users').doc(user.uid).delete();
            // Also remove from admins if they are one
            if (user.role === 'admin') {
                await db.collection('admins').doc(user.uid).delete();
            }
            setUsers(prev => prev.filter(u => u.uid !== user.uid));
        } catch (error) {
            console.error("Error deleting user:", error);
            alert("Failed to delete user");
        }
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
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
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                                            Disabled
                                        </span>
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

                                        <button
                                            onClick={() => toggleDisableUser(user)}
                                            className={`p-2 rounded-lg transition-colors ${user.isDisabled
                                                ? 'hover:bg-green-500/10 text-green-400'
                                                : 'hover:bg-amber-500/10 text-amber-400'
                                                }`}
                                            title={user.isDisabled ? "Enable User" : "Disable User"}
                                        >
                                            {user.isDisabled ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                                        </button>

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
        </div>
    );
};

export default UserManagement;
