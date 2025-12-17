import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ExternalLink, BookOpen, Cpu, Gamepad2, ArrowRight, Users, Trophy, Globe, Sparkles } from 'lucide-react';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2
        }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 100
        }
    }
};

interface ServiceCardProps {
    title: string;
    description: string;
    icon: React.ElementType;
    url: string;
    color: string;
    features: string[];
}

const TiltCard: React.FC<ServiceCardProps> = ({ title, description, icon: Icon, url, color, features }) => {
    const ref = useRef<HTMLDivElement>(null);

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["17.5deg", "-17.5deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-17.5deg", "17.5deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (!ref.current) return;

        const rect = ref.current.getBoundingClientRect();

        const width = rect.width;
        const height = rect.height;

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;

        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                rotateY,
                rotateX,
                transformStyle: "preserve-3d",
            }}
            variants={itemVariants}
            className="relative h-full"
        >
            <div
                style={{
                    transform: "translateZ(75px)",
                    transformStyle: "preserve-3d",
                }}
                className="relative h-full group rounded-3xl overflow-hidden bg-white/10 dark:bg-slate-800/40 border border-white/10 backdrop-blur-xl shadow-xl hover:shadow-2xl hover:shadow-brand-primary/20 transition-all duration-500"
            >
                {/* Dynamic Gradient Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

                {/* Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/5 to-transparent blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10" />

                <div className="p-8 relative z-10 flex flex-col h-full">
                    <div
                        style={{ transform: "translateZ(50px)" }}
                        className={`w-16 h-16 rounded-2xl ${color.replace('from-', 'bg-').split(' ')[0]}/10 flex items-center justify-center mb-6 text-${color.replace('from-', 'text-').split(' ')[1]}-500 shadow-lg`}
                    >
                        <Icon className="w-8 h-8" />
                    </div>

                    <h3
                        style={{ transform: "translateZ(40px)" }}
                        className="text-3xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight"
                    >
                        {title}
                    </h3>

                    <p
                        style={{ transform: "translateZ(30px)" }}
                        className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed flex-grow"
                    >
                        {description}
                    </p>

                    <ul className="space-y-4 mb-8">
                        {features.map((feature, idx) => (
                            <li
                                key={idx}
                                style={{ transform: "translateZ(20px)" }}
                                className="flex items-center text-sm font-medium text-slate-500 dark:text-slate-400"
                            >
                                <div className={`w-2 h-2 rounded-full mr-3 ${color.replace('from-', 'bg-').split(' ')[0]}`} />
                                {feature}
                            </li>
                        ))}
                    </ul>

                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ transform: "translateZ(40px)" }}
                        className="inline-flex items-center justify-between w-full px-6 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-900 dark:text-white font-semibold transition-all group/link"
                    >
                        Explore Platform
                        <ArrowRight className="w-5 h-5 transition-transform group-hover/link:translate-x-1" />
                    </a>
                </div>
            </div>
        </motion.div>
    );
};

// Simple CountUp Component
const CountUp: React.FC<{ end: number; duration?: number; suffix?: string }> = ({ end, duration = 2, suffix = '' }) => {
    const [count, setCount] = useState(0);
    const countRef = useRef(0);

    useEffect(() => {
        let startTime: number;
        let animationFrame: number;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / (duration * 1000), 1);

            // Ease out quart
            const ease = 1 - Math.pow(1 - percentage, 4);

            setCount(Math.floor(end * ease));

            if (percentage < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrame);
    }, [end, duration]);

    return <span>{count}{suffix}</span>;
}

const AboutPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-white font-sans overflow-x-hidden transition-colors duration-300">

            {/* Premium Background Ambience */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[150px] animate-blob" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/20 rounded-full blur-[150px] animate-blob" style={{ animationDelay: '5s' }} />
                <div className="absolute top-[40%] left-[40%] w-[40%] h-[40%] bg-cyan-600/10 rounded-full blur-[150px] animate-blob" style={{ animationDelay: '10s' }} />
            </div>

            <div className="relative z-10 pt-24 pb-20">
                {/* Hero Section */}
                <div className="container mx-auto px-4 lg:px-8 mb-32">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="text-center max-w-5xl mx-auto"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-medium text-sm mb-8 animate-fade-in-down">
                            <Sparkles className="w-4 h-4" />
                            <span>Revolutionizing Education & Simulation</span>
                        </div>

                        <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight mb-8">
                            Future Ready
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-shimmer bg-[length:200%_auto]">
                                Ecosystem
                            </span>
                        </h1>

                        <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl mx-auto mb-12">
                            EduSimulate isn't just a platform. It's a convergence of <span className="text-slate-900 dark:text-white font-semibold">AI Education</span>, <span className="text-slate-900 dark:text-white font-semibold">Hyper-Realistic Physics</span>, and <span className="text-slate-900 dark:text-white font-semibold">Game Publishing</span>.
                        </p>
                    </motion.div>
                </div>

                {/* Stats Section */}
                <div className="border-y border-slate-200/50 dark:border-white/5 bg-white/50 dark:bg-white/5 backdrop-blur-sm mb-32">
                    <div className="container mx-auto px-4 lg:px-8 py-16">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                            {[
                                { label: "Active Learners", value: 50000, suffix: "+", icon: Users },
                                { label: "Simulations Ran", value: 120000, suffix: "+", icon: Cpu },
                                { label: "Games Published", value: 500, suffix: "+", icon: Gamepad2 },
                                { label: "Countries Reach", value: 25, suffix: "+", icon: Globe },
                            ].map((stat, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="text-center"
                                >
                                    <div className="inline-flex p-3 rounded-2xl bg-brand-primary/10 text-brand-primary mb-4">
                                        <stat.icon className="w-6 h-6" />
                                    </div>
                                    <div className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-2">
                                        <CountUp end={stat.value} suffix={stat.suffix} />
                                    </div>
                                    <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        {stat.label}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Services Section */}
                <div className="container mx-auto px-4 lg:px-8 mb-32">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">Our Core Pillars</h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                            Three distinct platforms, one unified mission. Explore the technologies driving the next generation of digital experiences.
                        </p>
                    </div>

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 max-w-7xl mx-auto [perspective:1000px]"
                    >
                        <TiltCard
                            title="EduSimulate"
                            description="The brain of the operation. An advanced AI-LMS that adapts to every student's learning pace, offering personalized curricula and real-time feedback."
                            icon={BookOpen}
                            url="https://edusimulate.in"
                            color="from-blue-500 to-indigo-600"
                            features={[
                                "Adaptive AI Learning Paths",
                                "Smart Analytics Dashboard",
                                "Collaborative Study Groups",
                                "Live Expert Sessions"
                            ]}
                        />

                        <TiltCard
                            title="CarX Engine"
                            description="The heart of our physics tech. A C++20 powered simulation engine featuring Pacejka Magic Formula tire models for industrial-grade vehicle dynamics."
                            icon={Cpu}
                            url="https://carxsimulator.edusimulate.in"
                            color="from-orange-500 to-red-600"
                            features={[
                                "High-Fidelity C++20 Core",
                                "Pacejka Tire Physics",
                                "WebGL & WASM Support",
                                "Real-time Telemetry Data"
                            ]}
                        />

                        <TiltCard
                            title="RGSGT Publishing"
                            description="The soul of creativity. A publishing powerhouse empowering indie developers to distribute, monetize, and showcase their games to a global audience."
                            icon={Gamepad2}
                            url="https://rgsgt.edusimulate.in"
                            color="from-purple-500 to-fuchsia-600"
                            features={[
                                "Global Game Distribution",
                                "Developer Monetization",
                                "Community Game Jams",
                                "Cross-Platform Support"
                            ]}
                        />
                    </motion.div>
                </div>

                {/* Bottom CTA */}
                <div className="container mx-auto px-4 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative rounded-[2.5rem] overflow-hidden bg-slate-900 text-white text-center py-20 px-8"
                    >
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />

                        <div className="relative z-10 max-w-3xl mx-auto">
                            <h2 className="text-4xl md:text-5xl font-bold mb-8">Ready to Shape the Future?</h2>
                            <p className="text-xl text-slate-300 mb-10">
                                Whether you're a learner, a developer, or an institution, EduSimulate has the tools you need to succeed in the digital age.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <a
                                    href="/login"
                                    className="px-8 py-4 rounded-full bg-white text-slate-900 font-bold text-lg hover:bg-blue-50 transition-colors shadow-lg shadow-white/10"
                                >
                                    Get Started Now
                                </a>
                                <a
                                    href="#"
                                    className="px-8 py-4 rounded-full bg-white/10 text-white font-bold text-lg hover:bg-white/20 transition-colors backdrop-blur-md border border-white/20"
                                >
                                    Contact Sales
                                </a>
                            </div>
                        </div>
                    </motion.div>

                    <footer className="mt-20 text-center text-slate-500 dark:text-slate-500 text-sm pb-8">
                        <p>© 2025 EduSimulate Ecosystem. Innovating Education, Simulation, and Gaming.</p>
                    </footer>
                </div>
            </div>
        </div>
    );
};

export default AboutPage;
