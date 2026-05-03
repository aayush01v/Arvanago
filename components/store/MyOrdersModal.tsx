import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '@/services/firebase';
import Icon from '@/components/common/Icon';

interface StoreOrder {
  id: string;
  items: { productId: string; quantity: number; priceAtPurchase: number; name?: string }[];
  totalAmount: number;
  status: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  shippingAddress?: string;
  createdAt: any;
}

interface MyOrdersModalProps {
  onClose: () => void;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  paid:      { label: 'Paid',      color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  processing:{ label: 'Processing',color: 'text-amber-600',   bg: 'bg-amber-100 dark:bg-amber-900/30' },
  shipped:   { label: 'Shipped',   color: 'text-blue-600',    bg: 'bg-blue-100 dark:bg-blue-900/30' },
  delivered: { label: 'Delivered', color: 'text-teal-600',    bg: 'bg-teal-100 dark:bg-teal-900/30' },
  cancelled: { label: 'Cancelled', color: 'text-red-600',     bg: 'bg-red-100 dark:bg-red-900/30' },
};

const MyOrdersModal: React.FC<MyOrdersModalProps> = ({ onClose }) => {
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) { setLoading(false); return; }

    db.collection('store_orders')
      .where('userId', '==', user.uid)
      .get()
      .then(snap => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as StoreOrder));
        // Sort by createdAt descending in JS — avoids composite index requirement
        docs.sort((a, b) => {
          const ta = a.createdAt?.toMillis?.() ?? 0;
          const tb = b.createdAt?.toMillis?.() ?? 0;
          return tb - ta;
        });
        setOrders(docs);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm pointer-events-auto"
          onClick={onClose}
        />

        {/* Sheet */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative z-10 w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[85vh] flex flex-col pointer-events-auto"
        >
          {/* Drag handle (mobile) */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Icon name="package" className="w-5 h-5 text-brand-primary" />
              My Orders
              {orders.length > 0 && (
                <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                  {orders.length}
                </span>
              )}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            >
              <Icon name="x" className="w-4 h-4" />
            </button>
          </div>

          {/* Orders list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Icon name="package" className="w-14 h-14 mb-4 opacity-30" />
                <p className="font-semibold">No orders yet</p>
                <p className="text-sm mt-1">Your purchased items will appear here</p>
              </div>
            ) : (
              orders.map(order => {
                const status = statusConfig[order.status] || statusConfig['paid'];
                const date = order.createdAt?.toDate?.() ?? new Date();
                const isOpen = expanded === order.id;

                return (
                  <motion.div
                    key={order.id}
                    layout
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 overflow-hidden"
                  >
                    {/* Order summary row */}
                    <button
                      className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      onClick={() => setExpanded(isOpen ? null : order.id)}
                    >
                      <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center shrink-0">
                        <Icon name="package" className="w-5 h-5 text-brand-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-xs text-slate-500 dark:text-slate-400 truncate">
                          {order.razorpayOrderId || order.id}
                        </p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''} · ₹{order.totalAmount?.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg ${status.color} ${status.bg}`}>
                          {status.label}
                        </span>
                        <Icon name={isOpen ? 'chevronUp' : 'chevronDown'} className="w-4 h-4 text-slate-400" />
                      </div>
                    </button>

                    {/* Expanded detail */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-700 pt-3 space-y-3">
                            {/* Items breakdown */}
                            <div className="space-y-1.5">
                              {order.items.map((item, i) => (
                                <div key={i} className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                                  <span className="truncate max-w-[180px]">{item.name || item.productId} × {item.quantity}</span>
                                  <span className="font-semibold">₹{(item.priceAtPurchase * item.quantity).toLocaleString()}</span>
                                </div>
                              ))}
                            </div>

                            {/* Payment ID */}
                            {order.razorpayPaymentId && (
                              <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3 space-y-1.5 flex flex-col sm:flex-row sm:justify-between sm:items-center">
                                <span className="text-slate-400 text-xs">Payment ID</span>
                                <span className="font-mono text-slate-600 dark:text-slate-300 text-[10px] break-all">{order.razorpayPaymentId}</span>
                              </div>
                            )}

                            {/* Shipping address if any */}
                            {order.shippingAddress && (
                              <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl">
                                <p className="font-semibold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
                                  <Icon name="map-pin" className="w-3 h-3 shrink-0" /> Shipping to
                                </p>
                                <p className="leading-relaxed break-words whitespace-pre-wrap">{order.shippingAddress}</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default MyOrdersModal;
