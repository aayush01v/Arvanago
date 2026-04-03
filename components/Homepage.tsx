
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from './common/Icon.tsx';
import { useScrollAnimation } from '../hooks/useScrollAnimation.ts';
import { Course } from '../types.ts';
import { LOGO_URL } from '../constants.ts';
import InfoModal from './InfoModal.tsx';
import PretextHeroHeadline from './PretextHeroHeadline.tsx';

interface HomepageProps {
    onNavigateToLogin: () => void;
    onCourseSelect: (course: Course) => void;
    courses: Course[];
    isLoadingCourses?: boolean;
}

const BentoCard: React.FC<{
    title: string;
    subtitle?: string;
    icon?: string;
    className?: string;
    children?: React.ReactNode;
    delay?: string;
}> = ({ title, subtitle, icon, className = "", children, delay = "0s" }) => {
    const ref = useScrollAnimation();
    return (
        <div
            ref={ref}
            className={`group relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 ${className}`}
            style={{ animationDelay: delay }}
        >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-500 transform group-hover:scale-110 origin-top-right">
                {icon && <Icon name={icon} className="w-32 h-32" />}
            </div>
            <div className="relative z-10 flex flex-col h-full">
                <div className="mb-4">
                    {icon && <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center mb-4 text-slate-900 dark:text-white"><Icon name={icon} className="w-5 h-5" /></div>}
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{title}</h3>
                    {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
                </div>
                <div className="mt-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

const Homepage: React.FC<HomepageProps> = ({ onNavigateToLogin }) => {
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const scrollRef = useScrollAnimation();

    return (
        <div className="bg-slate-50 dark:bg-[#0B1120] text-slate-800 dark:text-white font-sans overflow-x-hidden relative min-h-screen">

            {/* 1. Cinematic Ambient Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full opacity-30 dark:opacity-10 animate-blob pointer-events-none mix-blend-screen" style={{ background: 'radial-gradient(circle, rgba(56, 189, 248, 0.4) 0%, transparent 60%)', filter: 'blur(60px)' }} />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full opacity-30 dark:opacity-10 animate-blob pointer-events-none mix-blend-screen" style={{ animationDelay: '5s', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 60%)', filter: 'blur(60px)' }} />
            </div>

            {/* Header */}
            <header className="absolute top-0 left-0 right-0 z-50 pt-6 px-6">
                <div className="container mx-auto flex justify-between items-center backdrop-blur-sm bg-white/30 dark:bg-black/20 rounded-full px-6 py-3 border border-white/40 dark:border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="absolute inset-0 bg-brand-primary blur-md opacity-50"></div>
                            <img src={LOGO_URL} alt="Logo" className="relative h-8 w-8" />
                        </div>
                        <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Edusimulate</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsInfoModalOpen(true)} className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-primary transition-colors">
                            <Icon name="mail" className="w-4 h-4" /> Contact
                        </button>
                        <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 hidden md:block"></div>
                        <button
                            onClick={onNavigateToLogin}
                            className="group relative min-w-[170px] px-6 py-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-sm tracking-tight shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-brand-primary to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <span className="relative z-10 whitespace-nowrap leading-none group-hover:text-white transition-colors">Start Learning</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="relative z-10 pt-32 pb-20 px-6">

                {/* 2. Hero Section - Detailed & Immersive */}
                <section className="container mx-auto max-w-7xl mb-32 text-center relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-brand-primary/20 blur-[120px] rounded-full pointer-events-none opacity-50 dark:opacity-20 animate-pulse-slow"></div>

                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary font-bold text-xs uppercase tracking-widest mb-8 animate-fade-in-down">
                        <span className="w-2 h-2 rounded-full bg-brand-primary animate-ping"></span>
                        EduSimulate Platform Live
                    </div>

                    <PretextHeroHeadline text="The Future of Digital Learning" />

                    <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed animate-fade-in-up font-light" style={{ animationDelay: '0.1s' }}>
                        A unified ecosystem combining <b className="text-slate-900 dark:text-white font-semibold">AI Education</b>, <b className="text-slate-900 dark:text-white font-semibold">Physics Simulation</b>, and <b className="text-slate-900 dark:text-white font-semibold">Game Publishing</b>.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        <button
                            onClick={onNavigateToLogin}
                            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-lg shadow-lg hover:shadow-brand-primary/25 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3"
                        >
                            <Icon name="rocket" className="w-5 h-5" /> Get Started Free
                        </button>
                        <button
                            onClick={() => setIsInfoModalOpen(true)}
                            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/50 dark:bg-white/5 backdrop-blur-md text-slate-900 dark:text-white font-bold text-lg border border-slate-200 dark:border-white/10 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 hover:border-transparent transition-all duration-300 shadow-lg hover:shadow-xl"
                        >
                            Explore Ecosystem
                        </button>
                    </div>



                    {/* Scroll Cue */}
                    <div className="absolute bottom-[-60px] left-1/2 -translate-x-1/2 animate-bounce opacity-70">
                        <Icon name="arrowDown" className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                    </div>

                    {/* Social Proof Strip */}
                    <div className="mt-20 pt-10 border-t border-slate-200/50 dark:border-white/5 flex flex-wrap justify-center gap-8 md:gap-16 opacity-0 animate-fade-in" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
                        {[
                            { label: "Active Learners", val: "50k+" },
                            { label: "Simulations Ran", val: "1.2M+" },
                            { label: "Countries", val: "25+" },
                            { label: "Uptime", val: "99.9%" }
                        ].map((stat, i) => (
                            <div key={i} className="text-center">
                                <div className="text-3xl font-black text-slate-900 dark:text-white">{stat.val}</div>
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 3. Bento Grid Showcase */}
                <section className="container mx-auto max-w-7xl mb-32">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-12 px-4">
                        <div>
                            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">The Ecosystem</h2>
                            <p className="text-slate-500 text-lg">Everything you need to master the digital world.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-4 gap-4 md:h-[800px]">

                        {/* Main Product: EduSimulate */}
                        <BentoCard
                            title="EduSimulate LMS"
                            subtitle="Artificial Intelligence Learning"
                            icon="brain-circuit"
                            className="md:col-span-2 md:row-span-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900"
                            delay="0s"
                        >
                            <div className="space-y-6 mt-8">
                                <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Your Progress</span>
                                        <span className="text-xs font-bold text-brand-primary">84%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-white/10 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-brand-primary h-full rounded-full transition-all duration-[2000ms] ease-out"
                                            style={{ width: '84%', transform: 'translateX(-100%)', animation: 'slideIn 2s forwards' }}
                                        />
                                        <style>{`
                                            @keyframes slideIn {
                                                to { transform: translateX(0); }
                                            }
                                        `}</style>
                                    </div>
                                </div>
                                <p className="text-slate-600 dark:text-slate-400">
                                    Experience a curriculum that adapts to your learning pace. Real-time doubt solving, personalized quizzes, and certification.
                                </p>
                                <div className="grid grid-cols-2 gap-4 mt-8">
                                    <div className="flex items-center gap-2 text-sm text-slate-500 font-medium"><Icon name="check-circle" className="w-4 h-4 text-green-500" /> NEET / JEE</div>
                                    <div className="flex items-center gap-2 text-sm text-slate-500 font-medium"><Icon name="check-circle" className="w-4 h-4 text-green-500" /> UPSC</div>
                                    <div className="flex items-center gap-2 text-sm text-slate-500 font-medium"><Icon name="check-circle" className="w-4 h-4 text-green-500" /> Coding</div>
                                    <div className="flex items-center gap-2 text-sm text-slate-500 font-medium"><Icon name="check-circle" className="w-4 h-4 text-green-500" /> K-12</div>
                                </div>
                            </div>
                        </BentoCard>

                        {/* Product: CarX */}
                        <BentoCard
                            title="CarX Engine"
                            subtitle="Physics Simulation"
                            icon="cpu"
                            className="md:col-span-2 md:row-span-2 bg-gradient-to-br from-orange-50 to-red-50 dark:from-slate-800 dark:to-slate-900"
                            delay="0.1s"
                        >
                            <div className="mt-4 flex items-center justify-between">
                                <p className="text-slate-600 dark:text-slate-400 max-w-xs">
                                    High-fidelity vehicle dynamics powered by C++20.
                                </p>
                                <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center animate-spin-slow">
                                    <Icon name="settings" className="w-8 h-8 text-orange-500" />
                                </div>
                            </div>
                        </BentoCard>

                        {/* Product: RGSGT */}
                        <BentoCard
                            title="RGSGT Publishing"
                            subtitle="Game Distribution"
                            icon="gamepad"
                            className="md:col-span-1 md:row-span-2 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-800 dark:to-slate-900"
                            delay="0.2s"
                        >
                            <div className="mt-4">
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Launch your games to millions.</p>
                                <div className="flex -space-x-2">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-800" />
                                    ))}
                                </div>
                            </div>
                        </BentoCard>

                        {/* Stat Card */}
                        <BentoCard
                            title="Global Scale"
                            subtitle="Infrastructure"
                            icon="globe"
                            className="md:col-span-1 md:row-span-2 bg-slate-900 text-white"
                            delay="0.3s"
                        >
                            <div className="mt-4">
                                <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">99.9%</div>
                                <div className="text-xs text-slate-400 uppercase mt-1">Uptime SLA</div>
                            </div>
                        </BentoCard>

                    </div>
                </section>

                {/* 4. Final CTA - Premium Glass Card */}
                {/* 4. Final CTA - Premium Glass Card (Compact & Sleek) */}
                <section className="container mx-auto px-6 mb-20">
                    <div className="relative rounded-3xl overflow-hidden p-8 md:p-12 text-center group hover:scale-[1.01] transition-transform duration-500">
                        {/* Background Video/Image Placeholders */}
                        <div className="absolute inset-0 bg-slate-900 border border-white/10 dark:border-white/5 shadow-2xl">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
                            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-purple-500/30 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/30 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />
                        </div>

                        <div className="relative z-10 max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="text-left md:flex-1">
                                <h2 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight">Ready to start?</h2>
                                <p className="text-lg text-slate-300 leading-relaxed max-w-xl">
                                    Join student, developer, and educator on the platform redefining education.
                                </p>
                                <div className="flex items-center gap-4 mt-4 text-sm text-slate-400 font-medium">
                                    <span className="flex items-center gap-1.5"><Icon name="check-circle" className="w-4 h-4 text-green-400" /> Cancel anytime</span>
                                    <span className="flex items-center gap-1.5"><Icon name="check-circle" className="w-4 h-4 text-green-400" /> No credit card</span>
                                </div>
                            </div>

                            <div className="flex-shrink-0 w-full md:w-auto">
                                <button
                                    onClick={onNavigateToLogin}
                                    className="w-full md:w-auto px-8 py-4 rounded-xl bg-white text-slate-900 font-bold text-lg shadow-xl shadow-brand-primary/20 hover:bg-brand-light transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
                                >
                                    Sign Up Now <Icon name="arrowRight" className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

            </main>

            {/* Footer */}
            <footer className="border-t border-slate-200 dark:border-white/5 py-12 bg-white dark:bg-[#0B1120]">
                <div className="container mx-auto px-6 text-center">
                    <div className="flex items-center justify-center gap-2 mb-8 opacity-70">
                        <img src={LOGO_URL} alt="Logo" className="h-8 w-8 grayscale" />
                        <span className="font-semibold text-lg text-slate-900 dark:text-white">Edusimulate</span>
                    </div>
                    <div className="flex justify-center gap-8 mb-8 text-sm text-slate-500 dark:text-slate-400">
                        <Link to="/about" className="hover:text-brand-primary transition-colors">About Us</Link>
                        <Link to="/blog" className="hover:text-brand-primary transition-colors">Blog</Link>
                        <button onClick={() => setIsInfoModalOpen(true)} className="hover:text-brand-primary transition-colors">Privacy Policy</button>
                        <button onClick={() => setIsInfoModalOpen(true)} className="hover:text-brand-primary transition-colors">Terms of Service</button>
                    </div>
                    <p className="text-xs text-slate-400">© 2025 Edusimulate Ecosystem. All rights reserved.</p>
                </div>
            </footer>

            <InfoModal
                isOpen={isInfoModalOpen}
                onClose={() => setIsInfoModalOpen(false)}
            />
        </div >
    );
};

export default Homepage;
