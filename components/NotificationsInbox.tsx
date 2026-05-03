import React, { useEffect, useState, useCallback } from 'react';
import { db } from '../services/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Clock, X, Info, AlertTriangle, BellOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
    id: string;
    message: string;
    type?: 'info' | 'alert';
    read: boolean;
    createdAt: string;
}

interface NotificationsInboxProps {
    user: any;
    isOpen: boolean;
    onClose: () => void;
}

export const NotificationsInbox: React.FC<NotificationsInboxProps> = ({ user, isOpen, onClose }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);

    const loadAndScrub = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const snapshot = await db.collection('user_notifications')
                .where('userId', '==', user.uid)
                .get();

            const batch = db.batch();
            const valid: Notification[] = [];
            const now = Date.now();
            const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

            snapshot.docs.forEach((doc) => {
                const data = doc.data();
                const created = new Date(data.createdAt).getTime();
                if (now - created > SEVEN_DAYS) {
                    batch.delete(doc.ref);
                } else {
                    valid.push({ id: doc.id, ...data } as Notification);
                }
            });

            await batch.commit();
            // Newest first, alerts bubble to top
            valid.sort((a, b) => {
                if (a.type === 'alert' && b.type !== 'alert') return -1;
                if (b.type === 'alert' && a.type !== 'alert') return 1;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
            setNotifications(valid);
        } catch (err) {
            console.error('Inbox load error:', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (isOpen) loadAndScrub();
    }, [isOpen, loadAndScrub]);

    const alertCount = notifications.filter(n => n.type === 'alert' && !n.read).length;
    const infoCount = notifications.filter(n => n.type !== 'alert' && !n.read).length;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-[2px]"
                    />

                    {/* Panel */}
                    <motion.div
                        key="panel"
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed top-[68px] right-3 sm:right-6 z-[101] w-[calc(100vw-24px)] max-w-[360px] flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                        style={{ maxHeight: 'calc(100dvh - 88px)' }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-brand-primary" />
                                <span className="font-bold text-slate-800 dark:text-white text-sm">Admin Inbox</span>
                                {alertCount > 0 && (
                                    <span className="flex items-center gap-1 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                        <AlertTriangle className="w-3 h-3" /> {alertCount} alert{alertCount > 1 ? 's' : ''}
                                    </span>
                                )}
                                {infoCount > 0 && alertCount === 0 && (
                                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                        {infoCount} new
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="overflow-y-auto flex-1 p-2 space-y-2">
                            {loading ? (
                                <div className="py-10 flex flex-col items-center gap-3 text-slate-400">
                                    <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                                    <span className="text-xs font-medium">Loading messages…</span>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="py-10 flex flex-col items-center gap-3 text-slate-400">
                                    <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                        <BellOff className="w-6 h-6 opacity-40" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">All clear!</p>
                                        <p className="text-xs mt-0.5">No messages from admin yet.</p>
                                    </div>
                                </div>
                            ) : (
                                notifications.map((notif) => {
                                    const isAlert = notif.type === 'alert';
                                    return (
                                        <div
                                            key={notif.id}
                                            className={`relative p-3.5 rounded-xl border transition-colors ${
                                                isAlert
                                                    ? 'bg-red-50 dark:bg-red-900/15 border-red-200 dark:border-red-800/50'
                                                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`shrink-0 mt-0.5 w-7 h-7 rounded-full flex items-center justify-center ${
                                                    isAlert
                                                        ? 'bg-red-100 dark:bg-red-800/50 text-red-500 dark:text-red-400'
                                                        : 'bg-blue-100 dark:bg-blue-800/30 text-blue-500 dark:text-blue-400'
                                                }`}>
                                                    {isAlert
                                                        ? <AlertTriangle className="w-3.5 h-3.5" />
                                                        : <Mail className="w-3.5 h-3.5" />
                                                    }
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    {isAlert && (
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-red-500 dark:text-red-400 mb-1">
                                                            ⚠ Urgent Alert
                                                        </p>
                                                    )}
                                                    <p className={`text-sm leading-relaxed font-medium ${
                                                        isAlert
                                                            ? 'text-red-900 dark:text-red-200'
                                                            : 'text-slate-700 dark:text-slate-200'
                                                    }`}>
                                                        {notif.message}
                                                    </p>
                                                    <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                                                        <Clock className="w-3 h-3" />
                                                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1.5">
                            <Info className="w-3 h-3 text-slate-400" />
                            <p className="text-[10px] font-medium text-slate-400">Messages auto-delete after 7 days</p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
