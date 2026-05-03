import React, { useState, useEffect } from 'react';
import Icon from './common/Icon';
import { motion, AnimatePresence } from 'framer-motion';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'contact' | 'terms'>('contact');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setActiveTab('contact');
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="relative w-full max-w-2xl bg-[#050505] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Ambient Top Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[100px] bg-white/5 blur-[50px] rounded-full pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between px-6 py-5 border-b border-white/5">
              <h2 className="text-xl font-bold text-white tracking-wide">Information</h2>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 text-slate-400 transition-all hover:bg-white/10 hover:text-white"
                aria-label="Close modal"
              >
                <Icon name="x" className="h-4 w-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="px-6 py-4 border-b border-white/5">
              <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10">
                <button
                  onClick={() => setActiveTab('contact')}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all ${
                    activeTab === 'contact'
                      ? 'bg-white/10 text-white shadow-lg border border-white/10'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon name="mail" className="h-4 w-4" />
                  Contact Us
                </button>
                <button
                  onClick={() => setActiveTab('terms')}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all ${
                    activeTab === 'terms'
                      ? 'bg-white/10 text-white shadow-lg border border-white/10'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon name="file-text" className="h-4 w-4" />
                  Terms & Conditions
                </button>
              </div>
            </div>

            {/* Content Scroll Area */}
            <div className="overflow-y-auto px-6 py-8 relative z-10 custom-scrollbar">
              <AnimatePresence mode="wait">
                {activeTab === 'contact' ? (
                  <motion.div
                    key="contact"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-8"
                  >
                    <div className="text-center">
                      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10 shadow-inner">
                        <Icon name="mail" className="h-8 w-8 text-white drop-shadow-md" />
                      </div>
                      <h3 className="text-2xl font-bold text-white tracking-tight">Get in Touch</h3>
                      <p className="mt-2 text-slate-400 max-w-sm mx-auto leading-relaxed">
                        We'd love to hear from you. Reach out to us for any questions, support, or partnership inquiries.
                      </p>
                    </div>

                    <div className="grid gap-4">
                      {/* Email Card */}
                      <div className="group flex items-start gap-5 p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all hover:bg-white/[0.07]">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-white border border-white/10 group-hover:scale-110 transition-transform">
                          <Icon name="mail" className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white tracking-wide">Email</h4>
                          <a
                            href="mailto:edusimulate@duck.com"
                            className="text-slate-400 hover:text-white transition-colors mt-1 block"
                          >
                            edusimulate@duck.com
                          </a>
                        </div>
                      </div>

                      {/* Support Card */}
                      <div className="group flex items-start gap-5 p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all hover:bg-white/[0.07]">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-white border border-white/10 group-hover:scale-110 transition-transform">
                          <Icon name="smartphone" className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white tracking-wide">Support</h4>
                          <p className="text-slate-400 mt-1">Available 24/7 for your queries</p>
                        </div>
                      </div>

                      {/* Response Card */}
                      <div className="group flex items-start gap-5 p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all hover:bg-white/[0.07]">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-white border border-white/10 group-hover:scale-110 transition-transform">
                          <Icon name="live" className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white tracking-wide">Response Time</h4>
                          <p className="text-slate-400 mt-1">We typically respond within 24 hours</p>
                        </div>
                      </div>
                    </div>

                    <div className="text-center pt-4">
                      <a
                        href="mailto:edusimulate@duck.com"
                        className="inline-flex items-center gap-2 rounded-2xl bg-white text-[#050505] px-8 py-3.5 font-bold shadow-xl shadow-white/10 transition-all hover:bg-slate-200 active:scale-95"
                      >
                        <Icon name="mail" className="h-5 w-5" />
                        Send us an Email
                      </a>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="terms"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-8"
                  >
                    <div className="text-center">
                      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10 shadow-inner">
                        <Icon name="file-text" className="h-8 w-8 text-white drop-shadow-md" />
                      </div>
                      <h3 className="text-2xl font-bold text-white tracking-tight">
                        Terms & Conditions
                      </h3>
                      <p className="mt-2 text-slate-400">
                        Please read our terms and privacy policy carefully
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white/5 border border-white/10 p-6 md:p-8">
                      <div className="prose prose-invert max-w-none prose-p:text-slate-400 prose-headings:text-white prose-headings:tracking-wide">
                        <p className="text-sm font-medium opacity-60 mb-6">
                          Last updated: {new Date().toLocaleDateString()}
                        </p>

                        <h4 className="text-lg font-bold mt-8 mb-3">1. Acceptance of Terms</h4>
                        <p>
                          By accessing and using EduSimulate, you accept and agree to be bound by the
                          terms and provision of this agreement.
                        </p>

                        <h4 className="text-lg font-bold mt-8 mb-3">2. Use License</h4>
                        <p>
                          Permission is granted to temporarily access the materials on EduSimulate for
                          personal, non-commercial transitory viewing only.
                        </p>

                        <h4 className="text-lg font-bold mt-8 mb-3">3. Privacy Policy</h4>
                        <p>
                          Your privacy is important to us. We collect and use your personal information
                          in accordance with our Privacy Policy.
                        </p>

                        <h4 className="text-lg font-bold mt-8 mb-3">4. User Responsibilities</h4>
                        <p>
                          You are responsible for maintaining the confidentiality of your account and
                          password and for restricting access to your computer.
                        </p>
                      </div>
                    </div>

                    <div className="text-center pt-4">
                      <a
                        href="https://www.freeprivacypolicy.com/live/6e77247b-f87d-45f6-8c8d-88e77554b487"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-2xl bg-white/10 border border-white/20 text-white px-8 py-3.5 font-bold shadow-lg transition-all hover:bg-white/20 active:scale-95"
                      >
                        <Icon name="file-text" className="h-5 w-5" />
                        View Full Policy
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default InfoModal;
