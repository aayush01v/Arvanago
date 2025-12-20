import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './common/Icon.tsx';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../services/authService.ts';
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

        setLoading(true);
        try {
            if (activeTab === 'signup') {
                await signUpWithEmail(name, email, password);
            } else {
                await signInWithEmail(email, password);
            }
        } catch (err: any) {
            setError(err.message.replace('Firebase: ', '') || "An error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        try {
            await signInWithGoogle();
        } catch (err: any) {
            setError(err.message || "Google Sign In failed.");
        }
    };

    const switchTab = (tab: AuthTab) => {
        setActiveTab(tab);
        setError('');
        setPassword('');
        setPasswordStrength(0);
    };

    return (
        <div className="min-h-screen w-full flex bg-slate-50 text-slate-900 overflow-hidden relative font-sans selection:bg-brand-primary/20">

            {/* Cinematic Ambient Background (Matches Homepage) */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full opacity-40 animate-blob mix-blend-multiply filter blur-[80px]" style={{ background: 'radial-gradient(circle, rgba(56, 189, 248, 0.8) 0%, transparent 60%)' }} />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full opacity-40 animate-blob mix-blend-multiply filter blur-[80px]" style={{ animationDelay: '5s', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.8) 0%, transparent 60%)' }} />
            </div>

            {/* Mesh Texture Overlay (Subtle) */}
            <div className="absolute inset-0 z-0 opacity-[0.4] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-soft-light pointer-events-none"></div>

            {/* Left Panel (Brand Hero) - Hidden on Mobile */}
            <div className="hidden lg:flex w-1/2 relative z-10 flex-col justify-between p-16">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="flex items-center gap-3"
                >
                    <div className="relative">
                        <div className="absolute inset-0 bg-brand-primary/20 blur-lg rounded-full"></div>
                        <img src={LOGO_URL} alt="Logo" className="h-10 w-auto object-contain relative z-10" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight text-slate-900">Edusimulate</span>
                </motion.div>

                <div className="space-y-8 max-w-lg">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                    >
                        <h1 className="text-5xl lg:text-7xl font-black leading-tight tracking-tight mb-6 text-slate-900">
                            Master your <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-purple-600 to-blue-600 animate-shimmer bg-[length:200%_auto]">Future.</span>
                        </h1>
                        <p className="text-lg text-slate-600 leading-relaxed font-medium">
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
                                whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.8)" }}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/40 border border-white/60 backdrop-blur-md shadow-sm transition-colors cursor-default"
                            >
                                <Icon name={item.icon} className="w-4 h-4 text-brand-primary" />
                                <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div className="text-sm text-slate-500 font-medium">
                    © 2024 Edusimulate Inc.
                </div>
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
                        <div className="relative">
                            <div className="absolute inset-0 bg-brand-primary/20 blur-lg rounded-full"></div>
                            <img src={LOGO_URL} alt="Logo" className="h-10 w-auto object-contain relative z-10" />
                        </div>
                        <span className="text-2xl font-bold text-slate-900">Edusimulate</span>
                    </div>

                    <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-[2rem] p-8 shadow-2xl shadow-brand-primary/5 relative overflow-hidden group">

                        {/* Tabs */}
                        <div className="flex p-1 bg-slate-100/80 rounded-2xl mb-8 relative">
                            {(['signin', 'signup'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => switchTab(tab)}
                                    className={`relative z-10 flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === tab
                                            ? 'text-brand-primary'
                                            : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    {tab === 'signin' ? 'Sign In' : 'Sign Up'}
                                    {activeTab === tab && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-0 bg-white rounded-xl shadow-md border border-slate-100"
                                            style={{ zIndex: -1 }}
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="text-center mb-8 space-y-2">
                            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                                {activeTab === 'signin' ? 'Welcome Back' : 'Create Account'}
                            </h2>
                            <p className="text-slate-500 text-sm font-medium">
                                {activeTab === 'signin'
                                    ? 'Enter your details to access your account'
                                    : 'Start your learning journey today'}
                            </p>
                        </div>

                        <form onSubmit={handleFormSubmit} className="space-y-5">
                            <AnimatePresence mode="wait">
                                {activeTab === 'signup' && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="relative group/input">
                                            <Icon name="user" className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within/input:text-brand-primary transition-colors" />
                                            <input
                                                type="text"
                                                placeholder="Full Name"
                                                value={name}
                                                onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z\s]/g, '').slice(0, 20))}
                                                className="w-full bg-white border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all font-medium"
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="relative group/input">
                                <Icon name="mail" className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within/input:text-brand-primary transition-colors" />
                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all font-medium"
                                />
                            </div>

                            <div className="relative group/input">
                                <Icon name="lock" className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within/input:text-brand-primary transition-colors" />
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={handlePasswordChange}
                                    className="w-full bg-white border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all font-medium"
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
                                                    className={`flex-1 rounded-full transition-all duration-500 ${passwordStrength >= level ? currentStrength.color : 'bg-slate-200'}`}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-xs text-right text-slate-500 pr-1">{currentStrength.label}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm text-center font-bold"
                                >
                                    {error}
                                </motion.div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                            >
                                {loading && <Icon name="spinner" className="w-5 h-5 animate-spin" />}
                                {activeTab === 'signin' ? 'Sign In' : 'Create Account'}
                            </button>
                        </form>

                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                            <div className="relative flex justify-center text-xs uppercase tracking-widest"><span className="px-4 bg-white/50 backdrop-blur-sm text-slate-400 font-bold">Or continue with</span></div>
                        </div>

                        <button
                            onClick={handleGoogleSignIn}
                            className="w-full bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                        >
                            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                            <span>Google</span>
                        </button>
                    </div>

                    <div className="mt-10 text-center">
                        <button onClick={onNavigateHome} className="text-slate-500 hover:text-slate-800 transition-colors text-sm font-bold flex items-center gap-2 mx-auto group">
                            <span className="group-hover:-translate-x-1 transition-transform">←</span> Return to Home
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default LoginPage;
