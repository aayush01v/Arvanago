import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/common/Icon';

const StoreFooter: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 mb-12">
          {/* Company Info */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-primary to-blue-600 flex items-center justify-center shadow">
                <Icon name="shopping-bag" className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-black text-slate-900 dark:text-white">Edusimulate</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Premium Tech for Students, Creators & Gamers. We provide top-tier hardware to fuel your learning and productivity.
            </p>
            <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
              <p className="font-semibold">EduSimulate Tech Pvt Ltd</p>
              <p>Model Town Extension, Phase 2</p>
              <p>Ludhiana, Punjab 141002</p>
              <p className="text-xs text-slate-400 mt-1 font-mono font-semibold">GSTIN: 03AADCE1234F1Z5</p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Quick Links</h3>
            <ul className="space-y-2.5 text-sm text-slate-500 dark:text-slate-400">
              <li><Link to="/about" className="hover:text-brand-primary transition-colors">About Us</Link></li>
              <li><Link to="/store" className="hover:text-brand-primary transition-colors">Store Catalog</Link></li>
              <li><Link to="/blog" className="hover:text-brand-primary transition-colors">Learning Hub (Blog)</Link></li>
              <li><Link to="/login" className="hover:text-brand-primary transition-colors">My Account</Link></li>
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Policies</h3>
            <ul className="space-y-2.5 text-sm text-slate-500 dark:text-slate-400">
              <li><Link to="#" className="hover:text-brand-primary transition-colors">Shipping Policy</Link></li>
              <li><Link to="#" className="hover:text-brand-primary transition-colors">Returns & Refunds</Link></li>
              <li><Link to="#" className="hover:text-brand-primary transition-colors">Privacy Policy</Link></li>
              <li><Link to="#" className="hover:text-brand-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Need Help?</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Icon name="phone" className="w-5 h-5 text-brand-primary shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Call Us</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">+91 1800-123-4567</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Icon name="message-circle" className="w-5 h-5 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">WhatsApp Support</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">+91 98765-43210</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Icon name="mail" className="w-5 h-5 text-brand-primary shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">support@edusimulate.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center md:text-left">
            &copy; 2026 EduSimulate. All Rights Reserved.
          </p>
          <div className="flex items-center gap-6 text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800"><Icon name="shield" className="w-4 h-4 text-emerald-500" /> 100% Secure Checkout</span>
            <span className="flex items-center gap-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800"><Icon name="check-circle" className="w-4 h-4 text-blue-500" /> SSL Encrypted</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default StoreFooter;
