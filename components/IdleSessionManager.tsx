import React, { useEffect, useState } from 'react';
import { auth } from '@/services/firebase';
import { safeLocalStorage } from '@/utils/safeStorage';
import { useNavigate } from 'react-router-dom';
import { Clock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const IDLE_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const LAST_ACTIVITY_KEY = 'edusimulate:last_activity';
const THROTTLE_MS = 60 * 1000; // 1 minute

export const IdleSessionManager: React.FC<{ user: any }> = ({ user }) => {
  const navigate = useNavigate();
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    // Only track if a user is actively authenticated
    if (!user) return; 

    let throttleTimer: NodeJS.Timeout | null = null;
    let intervalTimer: NodeJS.Timeout;

    const enforceLogout = async () => {
      try {
        await auth.signOut();
        safeLocalStorage.removeItem(LAST_ACTIVITY_KEY);
        setShowToast(true);
        navigate('/login', { replace: true });
        
        // Hide toast after 8 seconds
        setTimeout(() => setShowToast(false), 8000);
      } catch (error) {
        console.error("Failed to auto-sign out:", error);
      }
    };

    const handleActivity = () => {
      if (throttleTimer) return;
      
      const lastActivityStr = safeLocalStorage.getItem(LAST_ACTIVITY_KEY);
      const now = Date.now();
      
      if (lastActivityStr) {
        const lastActivity = parseInt(lastActivityStr, 10);
        if (!isNaN(lastActivity) && now - lastActivity > IDLE_TIMEOUT_MS) {
          void enforceLogout();
          return;
        }
      }

      safeLocalStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
      throttleTimer = setTimeout(() => {
        throttleTimer = null;
      }, THROTTLE_MS);
    };

    const checkIdleStatus = () => {
      const lastActivityStr = safeLocalStorage.getItem(LAST_ACTIVITY_KEY);
      if (lastActivityStr) {
        const now = Date.now();
        const lastActivity = parseInt(lastActivityStr, 10);
        if (!isNaN(lastActivity) && now - lastActivity > IDLE_TIMEOUT_MS) {
          void enforceLogout();
        }
      }
    };

    // Attach listeners for any user interaction
    window.addEventListener('mousemove', handleActivity, { passive: true });
    window.addEventListener('keydown', handleActivity, { passive: true });
    window.addEventListener('click', handleActivity, { passive: true });
    window.addEventListener('scroll', handleActivity, { passive: true });
    window.addEventListener('touchstart', handleActivity, { passive: true });

    // Initial check and set
    checkIdleStatus();
    handleActivity();
    
    // Interval check every minute natively incase user just leaves the tab open forever
    intervalTimer = setInterval(checkIdleStatus, THROTTLE_MS);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      if (throttleTimer) clearTimeout(throttleTimer);
      clearInterval(intervalTimer);
    };
  }, [user, navigate]);

  return (
    <AnimatePresence>
      {showToast && (
      <div className="fixed top-6 left-0 right-0 px-4 flex justify-center z-[100] pointer-events-none">
        <motion.div
           initial={{ opacity: 0, y: -50, scale: 0.95 }}
           animate={{ opacity: 1, y: 0, scale: 1 }}
           exit={{ opacity: 0, y: -50, scale: 0.95 }}
           className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-4 flex items-start gap-4 pointer-events-auto"
        >
          <div className="p-3 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div className="flex-1 mt-0.5 min-w-0">
            <h4 className="font-bold text-slate-900 dark:text-white">Session Expired</h4>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
              For your security, you've been logged out due to 7 days of inactivity.
            </p>
          </div>
          <button 
            onClick={() => setShowToast(false)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
};

export default IdleSessionManager;
