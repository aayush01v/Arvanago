import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, MoveLeft } from 'lucide-react';

const NotFoundPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[120px] animate-pulse" />
            </div>

            <div className="relative z-10 text-center space-y-8 max-w-2xl mx-auto backdrop-blur-sm p-8 rounded-3xl border border-white/5">
                <div className="relative">
                    <h1 className="text-[150px] font-black leading-none bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent opacity-80 select-none animate-bounce">
                        404
                    </h1>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 blur-[80px] -z-10 opacity-30" />
                </div>

                <div className="space-y-4">
                    <h2 className="text-3xl font-bold text-white">Lost in the Void?</h2>
                    <p className="text-gray-400 text-lg max-w-md mx-auto">
                        The page you're looking for seems to have drifted into a black hole. Let's get you back to safety.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center px-6 py-3 rounded-xl bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-all duration-300 group"
                    >
                        <MoveLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Go Back
                    </button>

                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all duration-300 group"
                    >
                        <Home className="w-5 h-5 mr-2" />
                        Return Home
                    </button>
                </div>
            </div>

            {/* Grid Pattern overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
        </div>
    );
};

export default NotFoundPage;
