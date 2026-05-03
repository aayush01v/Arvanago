import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '@/components/common/Icon';

interface OrderSuccessModalProps {
  orderId: string;
  paymentId: string;
  totalAmount: number;
  itemCount: number;
  onClose: () => void;
}

const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  orderId,
  paymentId,
  totalAmount,
  itemCount,
  onClose,
}) => {
  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-md pointer-events-auto"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="relative z-10 w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden pointer-events-auto"
        >
          {/* Gradient top strip */}
          <div className="h-2 bg-gradient-to-r from-emerald-400 via-teal-500 to-brand-primary" />

          <div className="p-8 text-center">
            {/* Animated checkmark */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
              className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-5"
            >
              <Icon name="check-circle" className="w-10 h-10 text-emerald-500" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">
                Order Placed!
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                Your order is being processed. You'll receive updates soon.
              </p>

              {/* Order details card */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 text-left space-y-3 mb-6 border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Order ID</span>
                  <span className="font-mono text-xs font-bold text-brand-primary bg-brand-primary/10 px-2 py-1 rounded-lg">
                    {orderId.slice(0, 14)}…
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment ID</span>
                  <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
                    {paymentId.slice(0, 16)}…
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Items</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-700 pt-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Paid</span>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400">₹{totalAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Status badge */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  Processing your order
                </span>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-brand-primary to-blue-600 hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-brand-primary/25"
              >
                Continue Shopping
              </button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default OrderSuccessModal;
