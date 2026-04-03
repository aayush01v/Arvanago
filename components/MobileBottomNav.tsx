import React from 'react';
import { NavLink, matchPath, useLocation } from 'react-router-dom';
import Icon from './common/Icon';
import { User } from '../types';
import { SHELL_TOKENS } from './shell/tokens';

interface MobileBottomNavProps {
    user: User | null;
    unreadChatCount?: number;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ user, unreadChatCount = 0 }) => {
    const location = useLocation();

    // Don't show on login page or if no user (though layout might handle that)
    if (!user) return null;

    const navItems: { name: string; icon: string; path: string; patterns: string[] }[] = [
        { name: 'Dashboard', icon: 'dashboard', path: '/dashboard', patterns: ['/dashboard'] },
        { name: 'Learnings', icon: 'bookmark', path: '/my-learnings', patterns: ['/my-learnings'] },
        { name: 'Leaderboard', icon: 'leaderboard', path: '/leaderboard', patterns: ['/leaderboard'] },
        { name: 'Notes', icon: 'file-text', path: '/mynotes', patterns: ['/mynotes'] },
        { name: 'Chat', icon: 'message-circle', path: '/chat', patterns: ['/chat'] },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden print:hidden">
            {/* Glassmorphism Background */}
            <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]" />

            <div className="relative flex items-center justify-around h-[4.5rem] px-2 pb-safe-area-bottom">
                {navItems.map((item) => {
                    const isActive = item.patterns.some((pattern) =>
                        Boolean(matchPath({ path: `${pattern}/*`, end: false }, location.pathname) || matchPath({ path: pattern, end: true }, location.pathname))
                    );

                    return (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            className={`
                relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-300
                ${isActive
                                    ? 'text-brand-primary translate-y-[-2px]'
                                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                                }
              `}
                        >
                            <div className={`
                relative p-1.5 rounded-xl transition-all duration-300
                ${isActive ? 'bg-brand-primary/10' : 'bg-transparent'}
              `}>
                                <Icon
                                    name={item.icon}
                                    className={`w-6 h-6 transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'}`}
                                    fill={isActive ? 'currentColor' : 'none'}
                                    strokeWidth={isActive ? uiTokens.icon.activeStrokeWidth : uiTokens.icon.strokeWidth}
                                />

                                {/* Unread Badge for Chat */}
                                {item.name === 'Chat' && unreadChatCount > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-slate-900 animate-scale-in">
                                        {unreadChatCount > 9 ? '9+' : unreadChatCount}
                                    </span>
                                )}
                            </div>

                            <span className={`${SHELL_TOKENS.drawer.navLabel} text-[10px] transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                                {item.name}
                            </span>
                        </NavLink>
                    );
                })}
            </div>
        </div>
    );
};

export default MobileBottomNav;
