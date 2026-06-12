import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './common/Icon.tsx';
import { signInWithGoogle, signInWithEmail, signUpWithEmail, sendVerificationEmail, signOutUser, auth } from '../services/authService.ts';
import { LOGO_URL } from '../constants.ts';

interface LoginPageProps {
    onNavigateHome: () => void;
}

type AuthTab = 'signin' | 'signup';

const strengthConfig = {
    0: { width: '0%', color: 'bg-transparent', label: '' },
    1: { width: '33%', color: 'bg-rose-500', label: 'Weak' },
    2: { width: '66%', color: 'bg-amber-400', label: 'Medium' },
    3: { width: '100%', color: 'bg-emerald-500', label: 'Strong' },
};

const LoginPage: React.FC<LoginPageProps> = ({ onNavigateHome }) => {
    const [activeTab, setActiveTab] = useState<AuthTab>('signin');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);

    const currentStrength = strengthConfig[passwordStrength as keyof typeof strengthConfig];

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
        if (activeTab === 'signup') {
            let score = 0;
            if (newPassword.length >= 8) score++;
            if (/[A-Z]/.test(newPassword)) score++;
            if (/[0-9]/.test(newPassword)) score++;
            if (/[^A-Za-z0-9]/.test(newPassword)) score++;
            setPasswordStrength(score === 0 ? 0 : score <= 2 ? 1 : score <= 3 ? 2 : 3);
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!email.trim()) return setError("Please enter your email.");
        if (activeTab === 'signup' && !name.trim()) return setError("Please enter your name.");

        // Enforce minimum password requirements for signup
        if (activeTab === 'signup') {
            if (password.length < 8) {
                return setError("Password must be at least 8 characters long.");
            }
            if (!/[A-Z]/.test(password)) {
                return setError("Password must contain at least one uppercase letter.");
            }
            if (!/[0-9]/.test(password)) {
                return setError("Password must contain at least one number.");
            }
            if (!/[^A-Za-z0-9]/.test(password)) {
                return setError("Password must contain at least one special character.");
            }
        }

        setLoading(true);
        try {
            if (activeTab === 'signup') {
                await signUpWithEmail(name, email, password);
                setError("verification link send to email verify and login...");
                // Optionally switch to signin tab
                setTimeout(() => setActiveTab('signin'), 3000);
            } else {
                await signInWithEmail(email, password);
                const user = auth.currentUser;
                if (user && !user.emailVerified) {
                    await signOutUser();
                    throw new Error("Email not verified. Please check your inbox.");
                }
            }
        } catch (err: any) {
            setError(err.message.replace('Firebase: ', '') || "An error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const handleResendVerification = async () => {
        setLoading(true);
        try {
            // User needs to be signed in to send verification, but we signed them out.
            // We temporarily sign them in to send the email, then sign out again, 
            // OR we assume the previous signInWithEmail succeeded (before we signed out) context is lost.
            // Actually, we can't send verification email if not signed in (security rule usually).
            // Strategy: Re-attempt sign in to get the user object, send email, then sign out.

            await signInWithEmail(email, password);
            await sendVerificationEmail();
            await signOutUser();
            setError("Verification email resent! Please check your inbox.");
        } catch (err: any) {
            setError("Could not resend email. Ensure credentials are correct: " + (err.message || ""));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);
        setError('');
        try {
            await signInWithGoogle();
            // Do not setLoading(false) here because App.tsx will navigate away and unmount us
        } catch (err: any) {
            setError(err.message || "Google Sign In failed.");
            setLoading(false);
        }
    };

    const switchTab = (tab: AuthTab) => {
        setActiveTab(tab);
        setError('');
        setPassword('');
        setPasswordStrength(0);
    };

    return (
        <div className="min-h-screen w-full flex bg-[#050505] text-white overflow-hidden relative font-sans selection:bg-brand-primary/30">

            {/* Premium Ambient Background (Matches Homepage) */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[20%] w-[50vw] h-[50vw] bg-brand-primary/10 rounded-full blur-[120px] mix-blend-screen opacity-50" />
                <div className="absolute bottom-[-10%] right-[10%] w-[40vw] h-[40vw] bg-purple-600/10 rounded-full blur-[120px] mix-blend-screen opacity-50" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] mix-blend-overlay" />
            </div>

            {/* Left Panel (Brand Hero) - Hidden on Mobile */}
            <div className="hidden lg:flex w-1/2 relative z-10 flex-col justify-between p-16">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="flex items-center gap-3"
                >
                    <div className="relative">
                        <img src={LOGO_URL} alt="Logo" className="h-10 w-auto object-contain relative z-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight text-white">Edusimulate</span>
                </motion.div>

                <div className="space-y-8 max-w-lg">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                    >
                        <h1 className="text-5xl lg:text-7xl font-black leading-[1.1] tracking-tighter mb-6 text-white">
                            Master your <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/40">Future.</span>
                        </h1>
                        <p className="text-lg text-white/50 leading-relaxed font-light">
                            Join thousands of learners mastering new skills with our interactive, mentorship-driven platform.
                        </p>
                    </motion.div>

                    <div className="flex gap-4">
                        {[
                            { icon: "live", label: "Live Mentorship" },
                            { icon: "cube", label: "3D Labs" },
                            { icon: "doubt", label: "24/7 Support" }
                        ].map((item, i) => (
                            <motion.div
                                key={item.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 + (i * 0.1) }}
                                whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md transition-colors cursor-default"
                            >
                                <Icon name={item.icon} className="w-4 h-4 text-brand-primary" />
                                <span className="text-sm font-medium text-white/80">{item.label}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <p className="text-sm font-medium text-white/30">
                    &copy; 2026 Edusimulate Ecosystem.
                </p>
            </div>

            {/* Right Panel (Form) */}
            <div className="w-full lg:w-1/2 relative z-10 flex items-center justify-center p-4 sm:p-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="w-full max-w-md"
                >
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex justify-center items-center gap-3 mb-10">
                        <img src={LOGO_URL} alt="Logo" className="h-10 w-auto object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
                        <span className="text-2xl font-bold text-white tracking-tight">Edusimulate</span>
                    </div>

                    <div className="bg-[#111] backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden group">
                        
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 blur-[80px] rounded-full pointer-events-none" />

                        {/* Tabs */}
                        <div className="flex p-1 bg-white/5 rounded-2xl mb-8 relative border border-white/5">
                            {(['signin', 'signup'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => switchTab(tab)}
                                    className={`relative z-10 flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === tab
                                        ? 'text-white'
                                        : 'text-white/40 hover:text-white/70'
                                        }`}
                                >
                                    {tab === 'signin' ? 'Sign In' : 'Sign Up'}
                                    {activeTab === tab && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-0 bg-white/10 rounded-xl border border-white/10"
                                            style={{ zIndex: -1 }}
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="text-center mb-8 space-y-2 relative z-10">
                            <h2 className="text-3xl font-bold tracking-tighter text-white">
                                {activeTab === 'signin' ? 'Welcome Back' : 'Create Account'}
                            </h2>
                            <p className="text-white/50 text-sm font-medium">
                                {activeTab === 'signin'
                                    ? 'Enter your details to access your account'
                                    : 'Start your learning journey today'}
                            </p>
                        </div>

                        <form onSubmit={handleFormSubmit} className="space-y-5 relative z-10">
                            <AnimatePresence mode="wait">
                                {activeTab === 'signup' && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="relative group/input">
                                            <Icon name="user" className="absolute left-4 top-3.5 w-5 h-5 text-white/30 group-focus-within/input:text-brand-primary transition-colors" />
                                            <input
                                                type="text"
                                                placeholder="Full Name"
                                                value={name}
                                                onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z\s]/g, '').slice(0, 20))}
                                                className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-white/30 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all font-medium hover:border-white/20"
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="relative group/input">
                                <Icon name="mail" className="absolute left-4 top-3.5 w-5 h-5 text-white/30 group-focus-within/input:text-brand-primary transition-colors" />
                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-white/30 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all font-medium hover:border-white/20"
                                />
                            </div>

                            <div className="relative group/input">
                                <Icon name="lock" className="absolute left-4 top-3.5 w-5 h-5 text-white/30 group-focus-within/input:text-brand-primary transition-colors" />
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={handlePasswordChange}
                                    className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-white/30 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all font-medium hover:border-white/20"
                                />
                            </div>

                            <AnimatePresence>
                                {activeTab === 'signup' && password.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-2 pt-1"
                                    >
                                        <div className="flex gap-1.5 h-1.5">
                                            {[1, 2, 3].map((level) => (
                                                <div
                                                    key={level}
                                                    className={`flex-1 rounded-full transition-all duration-500 ${passwordStrength >= level ? currentStrength.color : 'bg-white/10'}`}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-xs text-right text-white/40 pr-1">{currentStrength.label}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-3 rounded-xl border text-sm text-center font-bold ${error.includes("Account created") || error.includes("resent") ? "bg-emerald-900/30 border-emerald-500/30 text-emerald-400" : "bg-red-900/30 border-red-500/30 text-red-400"}`}
                                >
                                    {error}
                                    {error.includes("Email not verified") && (
                                        <button
                                            type="button"
                                            onClick={handleResendVerification}
                                            className="block mx-auto mt-2 text-xs underline hover:text-white"
                                        >
                                            Resend Verification Email
                                        </button>
                                    )}
                                </motion.div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-white text-black font-bold py-4 rounded-xl transition-transform hover:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                            >
                                {loading && <Icon name="spinner" className="w-5 h-5 animate-spin" />}
                                {activeTab === 'signin' ? 'Sign In' : 'Create Account'}
                            </button>
                        </form>

                        <div className="relative my-8 z-10">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                            <div className="relative flex justify-center text-xs uppercase tracking-widest"><span className="px-4 bg-[#111] text-white/40 font-bold">Or continue with</span></div>
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                            className={`relative z-10 w-full bg-white/5 text-white border border-white/10 hover:bg-white/10 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? <Icon name="spinner" className="w-5 h-5 animate-spin" /> : <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />}
                            <span>Google</span>
                        </button>
                    </div>

                    <div className="mt-10 text-center relative z-10">
                        <button onClick={onNavigateHome} className="text-white/40 hover:text-white transition-colors text-sm font-bold flex items-center gap-2 mx-auto group">
                            <span className="group-hover:-translate-x-1 transition-transform">←</span> Return to Home
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default LoginPage;
