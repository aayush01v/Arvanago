import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Icon from './common/Icon.tsx';
import { useScrollAnimation } from '../hooks/useScrollAnimation.ts';
import { Course } from '../types.ts';
import { LOGO_URL } from '../constants.ts';
import InfoModal from './InfoModal.tsx';
import SEO from './SEO.tsx';

interface HomepageProps {
    onNavigateToLogin: () => void;
    onCourseSelect: (course: Course) => void;
    courses: Course[];
    isLoadingCourses?: boolean;
}

// Reusable scroll reveal component
const Reveal: React.FC<{ children: React.ReactNode; className?: string; delay?: string }> = ({ children, className = '', delay = '0ms' }) => {
    const ref = useScrollAnimation();
    return (
        <div ref={ref} className={`opacity-0 translate-y-8 transition-all duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] [&.is-visible]:opacity-100 [&.is-visible]:translate-y-0 ${className}`} style={{ transitionDelay: delay }}>
            {children}
        </div>
    );
};

const TERMINAL_SLOGANS = [
    { header: 'ambition', slogan: '"Learn everything."' },
    { header: 'resilience', slogan: '"Break every barrier."' },
    { header: 'curiosity', slogan: '"Ask more. Know more."' },
    { header: 'creativity', slogan: '"Build the future."' },
    { header: 'discipline', slogan: '"Ship great code."' },
];

const PAUSE_AFTER_TYPING_MS = 2400;
const PAUSE_BEFORE_DELETING_MS = 650;
const PAUSE_BEFORE_NEXT_SLOGAN_MS = 500;

const randomBetween = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getHumanTypingDelay = (nextChar: string, index: number) => {
    let delay = randomBetween(90, 175);

    // First character feels slower, like a person starting to type
    if (index === 0) {
        delay += randomBetween(250, 550);
    }

    // Human pause after spaces
    if (nextChar === ' ') {
        delay += randomBetween(90, 220);
    }

    // Bigger pause after punctuation
    if (['.', ',', ';', ':', '!', '?'].includes(nextChar)) {
        delay += randomBetween(250, 600);
    }

    // Slight pause around quotation marks
    if (nextChar === '"') {
        delay += randomBetween(100, 250);
    }

    // Occasional thinking hesitation
    if (Math.random() < 0.1) {
        delay += randomBetween(220, 520);
    }

    return delay;
};

const getHumanDeletingDelay = (charBeingDeleted: string) => {
    let delay = randomBetween(45, 95);

    if (charBeingDeleted === ' ') {
        delay += randomBetween(25, 80);
    }

    if (['.', ',', ';', ':', '!', '?'].includes(charBeingDeleted)) {
        delay += randomBetween(60, 150);
    }

    return delay;
};

const Homepage: React.FC<HomepageProps> = ({ onNavigateToLogin }) => {
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [sloganIdx, setSloganIdx] = useState(0);
    const [displayedSlogan, setDisplayedSlogan] = useState('');
    const [phase, setPhase] = useState<'typing' | 'pausing' | 'deleting'>('typing');

    useEffect(() => {
        const currentSlogan = TERMINAL_SLOGANS[sloganIdx].slogan;
        let timeout: ReturnType<typeof setTimeout> | undefined;

        if (phase === 'typing') {
            if (displayedSlogan.length < currentSlogan.length) {
                const nextChar = currentSlogan[displayedSlogan.length];
                const delay = getHumanTypingDelay(nextChar, displayedSlogan.length);

                timeout = setTimeout(() => {
                    setDisplayedSlogan(
                        currentSlogan.slice(0, displayedSlogan.length + 1)
                    );
                }, delay);
            } else {
                timeout = setTimeout(() => {
                    setPhase('pausing');
                }, PAUSE_AFTER_TYPING_MS);
            }
        }

        if (phase === 'pausing') {
            timeout = setTimeout(() => {
                setPhase('deleting');
            }, PAUSE_BEFORE_DELETING_MS);
        }

        if (phase === 'deleting') {
            if (displayedSlogan.length > 0) {
                const charBeingDeleted = displayedSlogan[displayedSlogan.length - 1];
                const delay = getHumanDeletingDelay(charBeingDeleted);

                timeout = setTimeout(() => {
                    setDisplayedSlogan(prev => prev.slice(0, -1));
                }, delay);
            } else {
                timeout = setTimeout(() => {
                    setSloganIdx(prev => (prev + 1) % TERMINAL_SLOGANS.length);
                    setPhase('typing');
                }, PAUSE_BEFORE_NEXT_SLOGAN_MS);
            }
        }

        return () => {
            if (timeout) clearTimeout(timeout);
        };
    }, [displayedSlogan, sloganIdx, phase]);

    return (
        // Forced pure dark mode for premium aesthetic
        <div className="bg-[#050505] text-white font-sans overflow-x-hidden relative min-h-screen selection:bg-brand-primary/30">
            <SEO 
                title="Edusimulate - The Learning Ecosystem" 
                description="The ultimate digital campus. World-class AI education and premium student gear."
                keywords={['edtech', 'student laptops', 'online courses', 'learning ecosystem']}
                structuredData={{
                    "@context": "https://schema.org",
                    "@type": "WebSite",
                    "name": "Edusimulate",
                    "url": "https://edusimulate.vercel.app/"
                }}
            />

            {/* Premium Ambient Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[20%] w-[50vw] h-[50vw] bg-brand-primary/10 rounded-full blur-[120px] mix-blend-screen opacity-50" />
                <div className="absolute bottom-[-10%] right-[10%] w-[40vw] h-[40vw] bg-purple-600/10 rounded-full blur-[120px] mix-blend-screen opacity-50" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] mix-blend-overlay" />
            </div>

            {/* Header - Ultra Minimal */}
            <header className="absolute top-0 left-0 right-0 z-50 pt-8 px-6 md:px-12">
                <div className="container mx-auto max-w-7xl flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <img src={LOGO_URL} alt="Logo" className="h-8 w-8 object-contain" loading="eager" fetchPriority="high" />
                        <span className="text-xl font-bold tracking-tight text-white">Edusimulate</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <button onClick={() => setIsInfoModalOpen(true)} className="hidden md:block text-sm font-medium text-white/60 hover:text-white transition-colors">
                            Contact
                        </button>
                        <button
                            onClick={onNavigateToLogin}
                            className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-sm tracking-tight transition-all duration-300 backdrop-blur-md border border-white/10"
                        >
                            Sign In
                        </button>
                    </div>
                </div>
            </header>

            <main className="relative z-10">
                
                {/* 1. CINEMATIC HERO SECTION */}
                <section className="min-h-screen flex flex-col justify-center items-center text-center px-6 pt-32 pb-20 relative">
                    <div className="max-w-5xl mx-auto w-full z-10">
                        <Reveal delay="0ms">
                            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-white tracking-tighter leading-[0.9] mb-8">
                                Learn.<br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/40">Equip. Scale.</span>
                            </h1>
                        </Reveal>
                        
                        <Reveal delay="100ms">
                            <p className="text-xl md:text-2xl text-white/50 max-w-2xl mx-auto mb-12 font-light leading-relaxed tracking-wide">
                                The unified digital campus. Master world-class AI curriculum and equip yourself with rigorously tested student hardware.
                            </p>
                        </Reveal>

                        {/* Unified CTA Cluster */}
                        <Reveal delay="200ms">
                            <div className="flex flex-col sm:inline-flex sm:flex-row items-center gap-4 sm:gap-0 sm:p-1.5 sm:bg-white/5 sm:backdrop-blur-xl sm:rounded-full sm:border sm:border-white/10 sm:shadow-2xl sm:shadow-brand-primary/10 w-full sm:w-auto px-4 sm:px-0">
                                <button
                                    onClick={onNavigateToLogin}
                                    className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-black font-bold text-lg hover:bg-[#f8f8f8] hover:shadow-[0_0_30px_rgba(255,255,255,0.45)] transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(255,255,255,0.3)] sm:shadow-[0_0_24px_rgba(255,255,255,0.25)]"
                                >
                                    Start Learning <Icon name="arrow-right" className="w-5 h-5" />
                                </button>
                                <Link
                                    to="/store"
                                    className="w-full sm:w-auto px-8 py-4 rounded-full text-white font-bold text-lg bg-white/15 border border-white/25 sm:bg-white/10 sm:border-white/20 hover:bg-white/25 hover:shadow-[0_0_24px_rgba(59,130,246,0.35)] transition-all duration-300 flex items-center justify-center gap-2"
                                >
                                    <Icon name="shopping-bag" className="w-5 h-5 text-white/70" /> Shop Gear
                                </Link>
                            </div>
                        </Reveal>
                    </div>

                    <div className="w-full flex flex-col items-center opacity-90 transition-opacity duration-500 z-20 mt-16 lg:mt-24">
                        <span className="text-[10px] font-bold tracking-[0.2em] text-white/70 uppercase mb-5">Trusted by learners & partnered with</span>
                        <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10 grayscale opacity-80 hover:opacity-100 hover:grayscale-0 transition-all duration-500">
                            <div className="flex items-center gap-2 font-bold text-white text-sm md:text-base"><Icon name="shield-check" className="w-5 h-5" /> Razorpay Secure</div>
                            <div className="flex items-center gap-2 font-bold text-white text-sm md:text-base"><img src="https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg" alt="AWS" className="h-5 object-contain invert hover:invert-0 transition-all" loading="lazy" /> AWS EdStart</div>
                            <div className="flex items-center gap-2 font-bold text-white text-sm md:text-base"><Icon name="award" className="w-5 h-5" /> ISO Certified</div>
                            <div className="flex items-center gap-2 font-bold text-white text-sm md:text-base"><Icon name="users" className="w-5 h-5" /> 50k+ Learners</div>
                        </div>
                    </div>
                </section>

                {/* 2. INVESTOR SCALE SECTION */}
<section className="border-y border-white/10 bg-white/5 backdrop-blur-sm py-24">
    <div className="container mx-auto max-w-7xl px-6">
        {/* Removed 'divide-x divide-white/10' from here */}
        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-8">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 h-28 w-px bg-gradient-to-b from-white/0 via-white/30 to-white/0 hidden md:block"
            />
            <Reveal
                delay="0ms"
                className="relative text-center px-4 pl-8"
            >
                <div className="text-5xl md:text-6xl font-black tracking-tighter text-white mb-2">
                    50k<span className="text-brand-primary">+</span>
                </div>
                <div className="text-xs font-bold tracking-[0.2em] text-white/40 uppercase">
                    Active Learners
                </div>
            </Reveal>

            <Reveal 
                delay="100ms" 
                className="relative text-center px-4 pl-8 before:content-[''] before:absolute before:left-0 before:top-1/2 before:transform before:-translate-y-1/2 before:h-28 before:w-px before:bg-gradient-to-b before:from-white/0 before:via-white/30 before:to-white/0"
            >
                <div className="text-5xl md:text-6xl font-black tracking-tighter text-white mb-2">1.2M<span className="text-purple-500">+</span></div>
                <div className="text-xs font-bold tracking-[0.2em] text-white/40 uppercase">Code Executions</div>
            </Reveal>

            <Reveal 
                delay="200ms" 
                className="relative text-center px-4 pl-8 before:content-[''] before:absolute before:left-0 before:top-1/2 before:transform before:-translate-y-1/2 before:h-28 before:w-px before:bg-gradient-to-b before:from-white/0 before:via-white/30 before:to-white/0"
            >
                <div className="text-5xl md:text-6xl font-black tracking-tighter text-white mb-2">99.9<span className="text-blue-500">%</span></div>
                <div className="text-xs font-bold tracking-[0.2em] text-white/40 uppercase">Uptime SLA</div>
            </Reveal>

            <Reveal 
                delay="300ms" 
                className="relative text-center px-4 pl-8 before:content-[''] before:absolute before:left-0 before:top-1/2 before:transform before:-translate-y-1/2 before:h-28 before:w-px before:bg-gradient-to-b before:from-white/0 before:via-white/30 before:to-white/0"
            >
                <div className="text-5xl md:text-6xl font-black tracking-tighter text-white mb-2">24<span className="text-emerald-500">/7</span></div>
                <div className="text-xs font-bold tracking-[0.2em] text-white/40 uppercase">AI Mentorship</div>
            </Reveal>
        </div>
    </div>
</section>

                {/* 3. BENTO 2.0 (UNIFIED ECOSYSTEM) */}
                <section className="py-32 container mx-auto max-w-7xl px-6">
                    <Reveal>
                        <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-16 text-center">
                            Two pillars.<br/><span className="text-white/40">One ecosystem.</span>
                        </h2>
                    </Reveal>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 auto-rows-auto lg:auto-rows-[400px]">
                        
                        {/* BENTO ITEM 1: LMS */}
                        <Reveal delay="0ms" className="min-h-[400px] lg:col-span-7 relative group rounded-3xl overflow-hidden bg-[#111] border border-white/5 hover:border-white/20 transition-colors duration-500">
                            {/* Inner Shadow / Glow */}
                            <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] z-10 pointer-events-none" />
                            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/20 blur-[100px] rounded-full group-hover:bg-brand-primary/30 transition-colors duration-700" />
                            
                            <div className="relative z-20 p-10 h-full flex flex-col">
                                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-6 backdrop-blur-md border border-white/10">
                                    <img src={LOGO_URL} alt="Edusimulate Platform" className="w-7 h-7 object-contain grayscale brightness-200" loading="lazy" />
                                </div>
                                <h3 className="text-3xl font-bold text-white mb-2">The Learning Platform</h3>
                                <p className="text-white/50 text-lg mb-8 max-w-md">Adaptive AI curriculum, real-time code execution, and instantly verifiable certificates.</p>
                                
                                {/* Typing slogan terminal */}
                                <div className="mt-auto rounded-xl bg-[#0A0A0A] border border-white/10 p-4 shadow-2xl transform group-hover:-translate-y-2 transition-transform duration-500">
                                    {/* Title bar */}
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                        <div className="w-3 h-3 rounded-full bg-green-500/50" />
                                        <div className="ml-2 text-xs font-mono text-white/30">main.cpp</div>
                                    </div>

                                    {/* Static code structure — only the slogan text animates */}
                                    <div className="font-mono text-sm text-emerald-400">
                                        <div>
                                            <span className="text-purple-400">#include</span>
                                            <span className="text-emerald-400"> &lt;mindset&gt;</span>
                                        </div>
                                        <div>
                                            <span className="text-blue-400">int</span>
                                            <span className="text-yellow-200"> main</span>
                                            <span className="text-emerald-400">() {'{'}</span>
                                        </div>
                                        <div>
                                            <span className="text-emerald-400">&nbsp;&nbsp;std::cout &lt;&lt; </span>
                                            <span className="text-orange-300">{displayedSlogan}</span>
                                            <span className="inline-block w-[7px] h-[1em] bg-orange-300/80 ml-px align-middle animate-text-cursor-blink" />
                                            <span className="text-emerald-400">;</span>
                                        </div>
                                        <div>
                                            <span className="text-emerald-400">{'}'}</span>
                                        </div>
                                    </div>
                                </div> {/* <-- Add this missing closing tag */}
                            </div> 
                        </Reveal>

                        {/* BENTO ITEM 2: STORE */}
                        <Reveal delay="100ms" className="min-h-[400px] lg:col-span-5 relative group rounded-3xl overflow-hidden bg-[#111] border border-white/5 hover:border-white/20 transition-colors duration-500">
                            <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] z-10 pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/20 blur-[100px] rounded-full group-hover:bg-purple-600/30 transition-colors duration-700" />
                            
                            <div className="relative z-20 p-10 h-full flex flex-col">
                                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-6 backdrop-blur-md border border-white/10">
                                    <Icon name="shopping-bag" className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-3xl font-bold text-white mb-2">The Student Store</h3>
                                <p className="text-white/50 text-lg mb-8">Hardware optimized for developers. Tested for extreme workloads.</p>
                                
                                {/* Commerce Visual */}
                                <div className="mt-auto relative">
                                    <div className="absolute right-0 bottom-0 w-48 h-48 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-2xl" />
                                    <Link to="/store" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-bold hover:scale-105 transition-transform">
                                        Visit Store <Icon name="arrow-right" className="w-4 h-4" />
                                    </Link>
                                    <div className="mt-6 flex items-center gap-4 text-sm font-medium text-white/40">
                                        <span className="flex items-center gap-1.5"><Icon name="truck" className="w-4 h-4" /> Free Shipping</span>
                                        <span className="flex items-center gap-1.5"><Icon name="shield-check" className="w-4 h-4" /> Warranty</span>
                                    </div>
                                </div>
                            </div>
                        </Reveal>

                    </div>
                </section>

                {/* 4. COMMERCE FOOTER / CTA */}
                <footer className="border-t border-white/10 bg-[#0A0A0A] pt-24 pb-12 mt-20">
                    <div className="container mx-auto max-w-7xl px-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
                            
                            {/* Brand & HQ */}
                            <div className="lg:col-span-2">
                                <div className="flex items-center gap-3 mb-6">
                                    <img src={LOGO_URL} alt="Logo" className="h-10 w-10 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" loading="lazy" />
                                    <span className="text-2xl font-bold tracking-tight text-white">Edusimulate</span>
                                </div>
                                <p className="text-white/40 text-lg max-w-sm mb-8 leading-relaxed">
                                    Equipping the next generation of engineers, creators, and innovators.
                                </p>
                                <div className="flex gap-4">
                                    <button onClick={onNavigateToLogin} className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors border border-white/5">Sign In</button>
                                    <Link to="/store" className="px-6 py-2.5 rounded-full bg-transparent hover:bg-white/5 text-white font-semibold transition-colors border border-white/20">Store</Link>
                                </div>
                            </div>

                            {/* Trust Column */}
                            <div>
                                <h4 className="text-white font-bold mb-6 tracking-wide uppercase text-sm text-white/50">Store Guarantees</h4>
                                <ul className="space-y-4">
                                    <li className="flex items-center gap-3 text-white/70">
                                        <Icon name="shield-check" className="w-5 h-5 text-white/40" /> 100% Secure Checkout
                                    </li>
                                    <li className="flex items-center gap-3 text-white/70">
                                        <Icon name="truck" className="w-5 h-5 text-white/40" /> 3-5 Day Delivery (IN)
                                    </li>
                                    <li className="flex items-center gap-3 text-white/70">
                                        <Icon name="refresh-cw" className="w-5 h-5 text-white/40" /> 30-Day Returns
                                    </li>
                                </ul>
                            </div>

                            {/* Legal/HQ Column */}
                            <div>
                                <h4 className="text-white font-bold mb-6 tracking-wide uppercase text-sm text-white/50">Headquarters</h4>
                                <address className="not-italic text-white/70 space-y-2 mb-6">
                                    <p>Tech Park, Phase 8</p>
                                    <p>Ludhiana, Punjab</p>
                                    <p>India 141001</p>
                                </address>
                                <p className="text-xs text-white/30 font-mono">GSTIN: 03ABCDE1234F1Z5</p>
                            </div>
                        </div>

                        {/* Bottom Bar */}
                        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/30 font-medium">
                            <p>© {new Date().getFullYear()} Edusimulate Ecosystem. All rights reserved.</p>
                            <div className="flex gap-6">
                                <button onClick={() => setIsInfoModalOpen(true)} className="hover:text-white transition-colors">Privacy</button>
                                <button onClick={() => setIsInfoModalOpen(true)} className="hover:text-white transition-colors">Terms</button>
                            </div>
                        </div>
                    </div>
                </footer>

                <InfoModal
                    isOpen={isInfoModalOpen}
                    onClose={() => setIsInfoModalOpen(false)}
                />
            </main>
        </div>
    );
};

export default Homepage;
