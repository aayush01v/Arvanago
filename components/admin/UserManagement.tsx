import React, { useMemo, useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { User } from '../../types';
import { Search, Shield, ShieldOff, Trash2, Ban, CheckCircle, Send, X, Loader2, ShoppingBag, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';


type StoreOrder = {
    id: string;
    userId?: string;
    totalAmount?: number;
    createdAt?: { toDate: () => Date };
    items?: Array<{ name?: string; quantity?: number; priceAtPurchase?: number }>;
    status?: string;
};

type BuyerStats = {
    totalSpent: number;
    orderCount: number;
    latestOrderAt: Date | null;
    orders: StoreOrder[];
};

type BuyerSort = 'latest_order_desc' | 'paid_amount_desc';
const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Notification & Filter States
    const [storePurchaserIds, setStorePurchaserIds] = useState<Set<string>>(new Set());
    const [buyerStatsByUserId, setBuyerStatsByUserId] = useState<Record<string, BuyerStats>>({});
    const [buyerSort, setBuyerSort] = useState<BuyerSort>('latest_order_desc');
    const [activeOrdersUser, setActiveOrdersUser] = useState<User | null>(null);
    const [showStorePurchasers, setShowStorePurchasers] = useState(false);
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');
    const [isAlertMode, setIsAlertMode] = useState(false);
    const [sendingNotification, setSendingNotification] = useState(false);

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

        const fetchStorePurchasers = async () => {
            try {
                const snapshot = await db.collection('store_orders').get();
                const buyerIds = new Set<string>();
                const buyerStats: Record<string, BuyerStats> = {};

                snapshot.docs.forEach(doc => {
                    const data = doc.data() as StoreOrder;
                    if (!data.userId) return;

                    buyerIds.add(data.userId);
                    if (!buyerStats[data.userId]) {
                        buyerStats[data.userId] = { totalSpent: 0, orderCount: 0, latestOrderAt: null, orders: [] };
                    }

                    const orderAmount = Number(data.totalAmount || 0);
                    const orderDate = data.createdAt && typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : null;
                    const existingLatest = buyerStats[data.userId].latestOrderAt;

                    buyerStats[data.userId].totalSpent += Number.isNaN(orderAmount) ? 0 : orderAmount;
                    buyerStats[data.userId].orderCount += 1;
                    buyerStats[data.userId].latestOrderAt = !existingLatest || (orderDate && orderDate > existingLatest) ? orderDate : existingLatest;
                    buyerStats[data.userId].orders.push({ id: doc.id, ...data });
                });

                setStorePurchaserIds(buyerIds);
                setBuyerStatsByUserId(buyerStats);
            } catch (error) {
                console.error("Error fetching store purchasers:", error);
            }
        };

        fetchUsers();
        fetchStorePurchasers();
    }, []);

    const [suspendingUser, setSuspendingUser] = useState<User | null>(null);

    const toggleAdminRole = async (user: User) => {
        const newRole = user.role === 'admin' ? 'student' : 'admin';
        try {
            await db.collection('users').doc(user.uid).update({ role: newRole });
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
            await db.collection('users').doc(user.uid).update({
                isDeleted: true,
                isDisabled: true,
                name: 'Deleted User',
                avatar: `https://ui-avatars.com/api/?name=Deleted+User&background=000000&color=fff`,
                bio: 'This account has been deleted.',
                email: `${user.uid}@deleted.arvanago.com`
            });
            await db.collection('admins').doc(user.uid).delete();
            setUsers(prev => prev.filter(u => u.uid !== user.uid));
        } catch (error) {
            console.error("Error deleting user:", error);
            alert("Failed to delete user. Check console for details.");
        }
    };

    const handleSendNotification = async () => {
        if (!notificationMessage.trim() || selectedUserIds.size === 0) return;
        setSendingNotification(true);
        try {
            const batch = db.batch();
            Array.from(selectedUserIds).forEach(uid => {
                const notifRef = db.collection('user_notifications').doc();
                batch.set(notifRef, {
                    userId: uid,
                    message: notificationMessage.trim(),
                    type: isAlertMode ? 'alert' : 'info',
                    read: false,
                    createdAt: new Date().toISOString()
                });
            });
            await batch.commit();
            setNotificationMessage('');
            setIsAlertMode(false);
            setIsNotificationModalOpen(false);
            setSelectedUserIds(new Set());
            alert(`Notification successfully sent to ${selectedUserIds.size} user(s).`);
        } catch (error) {
            console.error('Error sending notification:', error);
            alert('Failed to send notifications. Try again.');
        } finally {
            setSendingNotification(false);
        }
    };

    const [showDeletionRequests, setShowDeletionRequests] = useState(false);

    const filteredUsers = useMemo(() => {
        const baseUsers = users.filter(user =>
            (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchTerm.toLowerCase())) &&
            !user.isDeleted &&
            (!showDeletionRequests || user.deletionRequested) &&
            (!showStorePurchasers || storePurchaserIds.has(user.uid))
        );

        if (!showStorePurchasers) return baseUsers;

        return [...baseUsers].sort((a, b) => {
            const statsA = buyerStatsByUserId[a.uid];
            const statsB = buyerStatsByUserId[b.uid];
            if (buyerSort === 'paid_amount_desc') {
                return (statsB?.totalSpent || 0) - (statsA?.totalSpent || 0);
            }
            const timeA = statsA?.latestOrderAt?.getTime() || 0;
            const timeB = statsB?.latestOrderAt?.getTime() || 0;
            return timeB - timeA;
        });
    }, [users, searchTerm, showDeletionRequests, showStorePurchasers, storePurchaserIds, buyerStatsByUserId, buyerSort]);

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filters Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#1e293b]/50 p-4 rounded-xl border border-white/5 backdrop-blur-sm gap-4">
                <div className="relative w-full md:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search users by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-500/50"
                    />
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                    <label className="flex items-center gap-2 cursor-pointer bg-slate-800/50 px-3 py-1.5 rounded-lg border border-white/5 hover:bg-slate-800 transition">
                        <input
                            type="checkbox"
                            checked={showStorePurchasers}
                            onChange={(e) => setShowStorePurchasers(e.target.checked)}
                            className="form-checkbox rounded bg-slate-700 border-slate-600 focus:ring-blue-500"
                        />
                        <span className="flex items-center gap-1.5 font-medium text-slate-300">
                            <ShoppingBag className="w-3.5 h-3.5 text-blue-400" /> Store Buyers
                        </span>
                    </label>

                    {showStorePurchasers && (
                        <select
                            value={buyerSort}
                            onChange={(e) => setBuyerSort(e.target.value as BuyerSort)}
                            className="bg-slate-800/50 px-3 py-1.5 rounded-lg border border-white/10 text-slate-200"
                        >
                            <option value="latest_order_desc">Newest order first</option>
                            <option value="paid_amount_desc">Highest paid first</option>
                        </select>
                    )}

                    <label className="flex items-center gap-2 cursor-pointer bg-slate-800/50 px-3 py-1.5 rounded-lg border border-white/5 hover:bg-slate-800 transition">
                        <input
                            type="checkbox"
                            checked={showDeletionRequests}
                            onChange={(e) => setShowDeletionRequests(e.target.checked)}
                            className="form-checkbox rounded bg-slate-700 border-slate-600 text-red-500 focus:ring-red-500"
                        />
                        <span className={showDeletionRequests ? "text-red-400 font-medium" : "text-slate-300 font-medium"}>Pending Deletion</span>
                    </label>
                    <span className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-white/5 font-medium">Total: <span className="text-white ml-1">{filteredUsers.length}</span></span>
                </div>
            </div>

            {/* Bulk Actions Panel */}
            {selectedUserIds.size > 0 && (
                <div className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold">
                            {selectedUserIds.size}
                        </span>
                        <span className="text-sm font-medium text-blue-400">Users selected</span>
                    </div>
                    <button
                        onClick={() => setIsNotificationModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition shadow-lg shadow-blue-500/20"
                    >
                        <Send className="w-4 h-4" /> Send Notification
                    </button>
                </div>
            )}

            <div className="bg-[#1e293b]/50 rounded-xl border border-white/10 backdrop-blur-sm overflow-x-auto">
                <table className="w-full min-w-[800px] text-left text-sm text-slate-400">
                    <thead className="bg-white/5 text-xs uppercase font-semibold text-slate-200">
                        <tr>
                            <th className="px-6 py-4 w-12 text-center">
                                <input 
                                    type="checkbox" 
                                    className="form-checkbox rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500 transition cursor-pointer"
                                    checked={filteredUsers.length > 0 && selectedUserIds.size === filteredUsers.length}
                                    onChange={(e) => {
                                        if (e.target.checked) setSelectedUserIds(new Set(filteredUsers.map(u => u.uid)));
                                        else setSelectedUserIds(new Set());
                                    }}
                                />
                            </th>
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Joined</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredUsers.map((user) => (
                            <tr key={user.uid} className={`hover:bg-white/5 transition-colors ${user.isDisabled ? 'opacity-50 grayscale' : ''} ${selectedUserIds.has(user.uid) ? 'bg-blue-500/5' : ''}`}>
                                <td className="px-6 py-4 w-12 text-center">
                                    <input 
                                        type="checkbox" 
                                        className="form-checkbox rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500 transition cursor-pointer"
                                        checked={selectedUserIds.has(user.uid)}
                                        onChange={(e) => {
                                            const next = new Set(selectedUserIds);
                                            if (e.target.checked) next.add(user.uid);
                                            else next.delete(user.uid);
                                            setSelectedUserIds(next);
                                        }}
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <img
                                                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                                                alt=""
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.onerror = null;
                                                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;
                                                }}
                                                className={`w-10 h-10 rounded-full bg-slate-700 object-cover ${user.deletionRequested ? 'ring-2 ring-red-500' : ''}`}
                                            />
                                            {user.deletionRequested && (
                                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#1e293b]" title="Requested Deletion"></div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-medium text-white flex items-center gap-2">
                                                {user.name}
                                                {user.deletionRequested && <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">Deletion Req</span>}
                                            </div>
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

                                        {showStorePurchasers && buyerStatsByUserId[user.uid]?.orderCount ? (
                                            <button
                                                onClick={() => setActiveOrdersUser(user)}
                                                className="px-3 py-2 rounded-lg hover:bg-blue-500/10 text-blue-400 transition-colors text-xs font-semibold"
                                                title="View store orders"
                                            >
                                                Orders ({buyerStatsByUserId[user.uid].orderCount})
                                            </button>
                                        ) : null}

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
                        No users found matching your search or filters.
                    </div>
                )}
            </div>

            {/* SEND NOTIFICATION MODAL */}
            {isNotificationModalOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl transition-colors duration-300 ${
                        isAlertMode 
                            ? 'bg-[#1e0a0a] border-red-500/30' 
                            : 'bg-[#1e293b] border-white/10'
                    }`}>
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                {isAlertMode 
                                    ? <AlertTriangle className="w-5 h-5 text-red-400" />
                                    : <Send className="w-5 h-5 text-blue-400" />
                                }
                                {isAlertMode ? 'Alert Broadcast' : 'Live Broadcast'}
                            </h3>
                            <button onClick={() => { setIsNotificationModalOpen(false); setIsAlertMode(false); }} className="text-slate-400 hover:text-white transition p-1 rounded-lg hover:bg-white/10">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Alert Mode Toggle */}
                        <div className={`flex items-center justify-between p-3 rounded-xl mb-5 border transition-colors ${
                            isAlertMode 
                                ? 'bg-red-500/10 border-red-500/30' 
                                : 'bg-white/5 border-white/10'
                        }`}>
                            <div className="flex items-center gap-2.5">
                                <AlertTriangle className={`w-4 h-4 ${isAlertMode ? 'text-red-400' : 'text-slate-500'}`} />
                                <div>
                                    <p className={`text-sm font-semibold ${isAlertMode ? 'text-red-400' : 'text-slate-300'}`}>Alert Mode</p>
                                    <p className="text-xs text-slate-500">Message displays as urgent red notification</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsAlertMode(prev => !prev)}
                                className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                                    isAlertMode ? 'bg-red-500' : 'bg-slate-600'
                                }`}
                            >
                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                                    isAlertMode ? 'translate-x-6' : 'translate-x-0'
                                }`} />
                            </button>
                        </div>

                        <p className="text-slate-400 text-sm mb-4">
                            Sending to <strong className="text-white">{selectedUserIds.size} user(s)</strong>. They will see this immediately if online, or on next login.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Message</label>
                                <textarea
                                    value={notificationMessage}
                                    onChange={(e) => setNotificationMessage(e.target.value)}
                                    placeholder={isAlertMode ? "Enter urgent alert message..." : "Enter your system broadcast message..."}
                                    className={`w-full h-32 bg-black/20 border rounded-xl p-4 text-white text-sm focus:outline-none resize-none transition-colors ${
                                        isAlertMode 
                                            ? 'border-red-500/40 focus:border-red-500' 
                                            : 'border-white/10 focus:border-blue-500'
                                    }`}
                                />
                            </div>

                            <button
                                onClick={handleSendNotification}
                                disabled={sendingNotification || !notificationMessage.trim()}
                                className={`w-full py-3.5 font-bold rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                                    isAlertMode 
                                        ? 'bg-red-600 hover:bg-red-500 shadow-red-500/20 text-white' 
                                        : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20 text-white'
                                }`}
                            >
                                {sendingNotification ? <Loader2 className="w-5 h-5 animate-spin" /> : (isAlertMode ? <AlertTriangle className="w-5 h-5" /> : <Send className="w-5 h-5" />)}
                                {isAlertMode ? `Send Alert to ${selectedUserIds.size} Users` : `Broadcast to ${selectedUserIds.size} Users`}
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {activeOrdersUser && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#1e293b] p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white">Store Orders • {activeOrdersUser.name}</h3>
                            <button onClick={() => setActiveOrdersUser(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        <p className="text-sm text-slate-400 mb-4">Total paid: ₹{(buyerStatsByUserId[activeOrdersUser.uid]?.totalSpent || 0).toLocaleString()} • Orders: {buyerStatsByUserId[activeOrdersUser.uid]?.orderCount || 0}</p>
                        <div className="space-y-3">
                            {(buyerStatsByUserId[activeOrdersUser.uid]?.orders || []).slice().sort((a,b)=> ((b.createdAt?.toDate?.().getTime()||0)-(a.createdAt?.toDate?.().getTime()||0))).map(order => (
                                <div key={order.id} className="rounded-xl bg-black/20 border border-white/10 p-3">
                                    <div className="flex justify-between text-sm"><span className="text-white font-medium">₹{Number(order.totalAmount || 0).toLocaleString()}</span><span className="text-slate-400">{order.createdAt?.toDate ? format(order.createdAt.toDate(), 'MMM d, yyyy p') : '—'}</span></div>
                                    <div className="text-xs text-slate-500 mt-2">{order.items?.map((item) => `${item.name || 'Item'} × ${item.quantity || 1}`).join(', ') || 'No items'}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Suspension Modal */}

            {suspendingUser && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
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
