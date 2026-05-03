
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { NotificationsInbox } from './NotificationsInbox.tsx';
import { db } from '../services/firebase.ts';
import HeaderAction from './common/HeaderAction.tsx';
import Icon from './common/Icon.tsx';
import { User } from '../types.ts';
import { LOGO_URL } from '../constants.ts';
import { SHELL_TOKENS } from './shell/tokens.ts';
import { useStoreCart } from '../hooks/useStoreCart.tsx';

interface HeaderProps {
  user: User | null;
  onMenuClick: () => void;
  menuButtonRef?: React.RefObject<HTMLButtonElement | null>;
  isScrolled: boolean;
  pageTitle: string;
  pageSubtitle?: string;
  isDarkMode: boolean;
  onThemeToggle: (isDark: boolean) => void;
  unreadChatCount?: number;
  onSearchClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  user,
  onMenuClick,
  menuButtonRef,
  isScrolled,
  pageTitle,
  pageSubtitle,
  isDarkMode,
  onThemeToggle,
  unreadChatCount = 0,
  onSearchClick,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cartItemCount, setCartOpen } = useStoreCart();

  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = db.collection('user_notifications')
      .where('userId', '==', user.uid)
      .where('read', '==', false)
      .onSnapshot((snap) => {
        setUnreadCount(snap.docs.length);
      });
    return () => unsubscribe();
  }, [user]);

  // Determine if we should show a Back button instead of Menu
  // Root pages: dashboard, leaderboard, courses (main list), profile (my profile), my-learnings, explore
  const rootPaths = ['/dashboard', '/leaderboard', '/courses', '/profile', '/my-learnings', '/explore'];
  const isSubPage = !rootPaths.includes(location.pathname) && location.pathname !== '/';

  return (
    <>
    <header
      className={`glass-reflection sticky top-0 z-30 border-b transition-all duration-300 ${isScrolled
        ? 'border-slate-200 bg-white/90 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90'
        : 'border-transparent bg-white/50 backdrop-blur-md dark:border-transparent dark:bg-slate-900/50'
        }`}
    >
      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={`flex ${SHELL_TOKENS.header.height} items-center justify-between gap-4`}>

          {/* Left Section: Menu & Logo (Mobile) / Title (Desktop) */}
          <div className="flex items-center gap-4 flex-1">
            {isSubPage ? (
              <HeaderAction
                icon="arrowLeft"
                onClick={() => {
                  if (window.history.state && window.history.state.idx > 0) {
                    navigate(-1);
                  } else {
                    navigate('/dashboard');
                  }
                }}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-secondary shadow-sm transition-colors hover:surface-muted hover:text-primary dark:border-slate-700 dark:bg-slate-800 md:hidden"
                aria-label="Go Back"
              />
            ) : (
              <button
                ref={menuButtonRef}
                onClick={onMenuClick}
                className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-700 active:scale-[0.98] active:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200 dark:active:bg-slate-700 dark:focus-visible:ring-offset-slate-900 md:hidden"
                aria-label="Open menu"
                aria-expanded={false}
                aria-controls="mobile-navigation-drawer"
              >
                <Icon name="menu" className="h-5 w-5" />
              </button>
            )}

            {/* Mobile Logo */}
            <div className={SHELL_TOKENS.header.mobileLogoWrap}>
              <img src={LOGO_URL} alt="Edusimulate" className="h-7 w-auto" />
              <span className="text-base font-bold text-primary">Edusimulate</span>
            </div>

            {/* Desktop Page Title */}
            <div className="hidden md:flex flex-col">
              <h1 className="text-xl font-bold text-primary leading-tight">
                {pageTitle}
              </h1>
              {pageSubtitle && (
                <p className="text-xs text-secondary font-medium">{pageSubtitle}</p>
              )}
            </div>
          </div>

          {/* Right Section: Actions & Profile */}
          <div className={SHELL_TOKENS.header.actionCluster}>

            {/* Mobile Page Title (Center-ish if needed, or just hidden/simplified) */}
            <div className="md:hidden hidden sm:block">
              <span className="text-sm font-semibold text-primary">{pageTitle}</span>
            </div>

            {/* Global Actions (Search, Inbox & Cart) */}
            <div className="flex items-center gap-1 sm:gap-2">
              {user && (
                <>
                  {location.pathname.startsWith('/chat') && (
                    <HeaderAction
                      icon="search"
                      onClick={onSearchClick}
                      className="relative flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-brand-primary active:scale-[0.98] active:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white dark:active:bg-slate-700 dark:focus-visible:ring-offset-slate-900"
                      aria-label="Search Chats"
                    />
                  )}

                  {/* My Orders — only on /store */}
                  {location.pathname.startsWith('/store') && (
                    <button
                      onClick={() => window.dispatchEvent(new CustomEvent('store:openOrders'))}
                      title="My Orders"
                      className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-slate-100 hover:bg-brand-primary/10 dark:bg-slate-800 dark:hover:bg-brand-primary/20 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-brand-primary transition-all text-xs font-semibold"
                      aria-label="My Orders"
                    >
                      <Icon name="package" className="w-4 h-4 shrink-0" />
                      <span className="hidden sm:block">My Orders</span>
                    </button>
                  )}

                  {/* Inbox Action */}
                  <button
                    onClick={() => setIsInboxOpen(true)}
                    className="relative flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-brand-primary active:scale-[0.98] active:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white dark:active:bg-slate-700 dark:focus-visible:ring-offset-slate-900 group"
                    aria-label="Notifications"
                  >
                    <Icon name="mail" className="h-[22px] w-[22px]" />
                    {unreadCount > 0 && (
                      <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900 group-hover:scale-110 transition-transform animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>
                </>
              )}

              {/* Cart is visible to everyone */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-brand-primary active:scale-[0.98] active:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white dark:active:bg-slate-700 dark:focus-visible:ring-offset-slate-900"
                aria-label="View Cart"
              >
                <Icon name="shopping-bag" className="h-[22px] w-[22px]" />
                {cartItemCount > 0 && (
                  <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-brand-primary text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900 group-hover:scale-110 transition-transform">
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </button>
            </div>

            {/* Profile Dropdown / Info */}
            <div className={SHELL_TOKENS.header.avatarCluster}>
              {user ? (
                <>
                  <Link to="/profile" className="hidden text-right md:block hover:opacity-80 transition-opacity">
                    <p className="text-sm font-medium text-primary leading-none">{user.name}</p>
                  </Link>
                  <Link to="/profile" className="hover:opacity-80 transition-opacity">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-9 w-9 rounded-full bg-slate-100 object-cover ring-2 ring-white dark:ring-slate-800"
                    />
                  </Link>
                </>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 bg-brand-primary text-white text-sm font-bold rounded-full hover:bg-brand-secondary transition-colors"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
    {ReactDOM.createPortal(
      <NotificationsInbox user={user} isOpen={isInboxOpen} onClose={() => setIsInboxOpen(false)} />,
      document.body
    )}
  </>
  );
};

export default Header;
