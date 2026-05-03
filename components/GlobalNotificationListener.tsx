import React, { useEffect, useState, useRef } from 'react';
import { db } from '../services/firebase';
import { motion, AnimatePresence, useMotionValue, useTransform, animate, Variants } from 'framer-motion';
import { Bell, X, AlertTriangle } from 'lucide-react';

const AUTO_DISMISS_MS = 5000;

const ProgressBar: React.FC<{ isAlert: boolean; duration: number }> = ({ isAlert, duration }) => {
    const progress = useMotionValue(100);
    const width = useTransform(progress, (v) => `${v}%`);

    useEffect(() => {
        const ctrl = animate(progress, 0, { duration: duration / 1000, ease: 'linear' });
        return () => ctrl.stop();
    }, []);

    return (
        <div className={`absolute bottom-0 left-0 right-0 h-[3px] overflow-hidden rounded-b-2xl ${isAlert ? 'bg-red-800/40' : 'bg-white/10'}`}>
            <motion.div
                style={{ width }}
                className={`h-full ${isAlert ? 'bg-red-200/80' : 'bg-blue-400/80'}`}
            />
        </div>
    );
};

export const GlobalNotificationListener: React.FC<{ user: any }> = ({ user }) => {
    const [queue, setQueue] = useState<any[]>([]);
    const [activeNotification, setActiveNotification] = useState<any | null>(null);
    const dismissRef = useRef<((id: string) => Promise<void>) | null>(null);

    useEffect(() => {
        if (!user) return;
        const unsubscribe = db.collection('user_notifications')
            .where('userId', '==', user.uid)
            .where('read', '==', false)
            .onSnapshot((snapshot) => {
                const fresh: any[] = [];
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        fresh.push({ id: change.doc.id, ...change.doc.data() });
                    }
                });
                if (fresh.length > 0) {
                    setQueue((prev) => [...prev, ...fresh]);
                }
            });
        return () => unsubscribe();
    }, [user]);

    // Dequeue one at a time
    useEffect(() => {
        if (!activeNotification && queue.length > 0) {
            setActiveNotification(queue[0]);
            setQueue((prev) => prev.slice(1));
        }
    }, [queue, activeNotification]);

    const handleDismiss = async (id: string) => {
        try {
            await db.collection('user_notifications').doc(id).update({ read: true });
        } catch {
            // silently ignore
        }
        setActiveNotification(null);
    };

    // Keep handleDismiss accessible for the timer without stale closure
    dismissRef.current = handleDismiss;

    // Auto-dismiss after 5s
    useEffect(() => {
        if (!activeNotification) return;
        const timer = setTimeout(() => dismissRef.current?.(activeNotification.id), AUTO_DISMISS_MS);
        return () => clearTimeout(timer);
    }, [activeNotification]);

    const isAlert = activeNotification?.type === 'alert';

    // Wobble keyframes for alerts — runs once on mount, zero ongoing cost
    const alertVariants: Variants = {
        initial: { opacity: 0, scale: 0.5, y: -60, rotateZ: -6 },
        animate: {
            opacity: 1, scale: 1, y: 0, rotateZ: 0,
            transition: {
                type: 'spring' as const,
                stiffness: 380, damping: 18, mass: 0.7,
            },
        },
        exit: {
            opacity: 0, scale: 0.85, y: -30,
            transition: { duration: 0.2, ease: 'easeIn' },
        },
    };

    const infoVariants: Variants = {
        initial: { opacity: 0, y: -50, scale: 0.92 },
        animate: {
            opacity: 1, y: 0, scale: 1,
            transition: { type: 'spring' as const, stiffness: 280, damping: 22 },
        },
        exit: {
            opacity: 0, y: -30, scale: 0.94,
            transition: { duration: 0.18, ease: 'easeIn' },
        },
    };

    return (
        <AnimatePresence mode="wait">
            {activeNotification && (
                <div
                    key={activeNotification.id}
                    className="fixed top-[72px] left-0 right-0 z-[99999] px-4 flex justify-center pointer-events-none"
                >
                    <motion.div
                        variants={isAlert ? alertVariants : infoVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className={`relative pointer-events-auto flex items-start gap-3.5 rounded-2xl px-4 pt-4 pb-5 shadow-2xl backdrop-blur-xl border w-full max-w-[360px] overflow-hidden ${
                            isAlert
                                ? 'bg-gradient-to-br from-red-600 to-rose-700 border-red-400/30'
                                : 'bg-gradient-to-br from-slate-800/95 to-slate-900/95 border-slate-700/50'
                        }`}
                    >
                        {/* Glow blob */}
                        <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-30 pointer-events-none ${
                            isAlert ? 'bg-red-300' : 'bg-blue-500'
                        }`} />

                        {/* Icon */}
                        <motion.div
                            initial={{ scale: 0, rotate: -30 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
                            className={`shrink-0 flex h-9 w-9 items-center justify-center rounded-xl shadow-lg ${
                                isAlert
                                    ? 'bg-white/25 text-white'
                                    : 'bg-blue-500/30 text-blue-300'
                            }`}
                        >
                            {isAlert
                                ? <AlertTriangle className="h-5 w-5" />
                                : <Bell className="h-5 w-5" />
                            }
                        </motion.div>

                        {/* Text */}
                        <div className="flex-1 min-w-0 mr-1">
                            <motion.p
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.12 }}
                                className={`text-[11px] font-bold uppercase tracking-widest mb-0.5 ${
                                    isAlert ? 'text-red-200' : 'text-blue-400'
                                }`}
                            >
                                {isAlert ? '⚠ Urgent Alert' : 'System Message'}
                            </motion.p>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.18 }}
                                className={`text-sm leading-snug font-medium ${
                                    isAlert ? 'text-white' : 'text-slate-100'
                                }`}
                            >
                                {activeNotification.message}
                            </motion.p>
                        </div>

                        {/* Close */}
                        <button
                            onClick={() => handleDismiss(activeNotification.id)}
                            className={`shrink-0 p-1.5 rounded-lg transition-colors ${
                                isAlert
                                    ? 'text-red-200 hover:text-white hover:bg-white/20'
                                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            <X className="h-4 w-4" />
                        </button>

                        {/* Progress bar auto-dismiss countdown */}
                        <ProgressBar isAlert={isAlert} duration={AUTO_DISMISS_MS} />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
