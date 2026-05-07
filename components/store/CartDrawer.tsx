import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useStoreCart } from '@/hooks/useStoreCart';
import Icon from '@/components/common/Icon';
import { auth } from '@/services/firebase';
import OrderSuccessModal from './OrderSuccessModal';

// ─── Types ───────────────────────────────────────────────────────────
interface CouponInfo {
  valid: boolean;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  productId: string | null; // null = entire cart
  appliesTo: string[];
  label: string;
}

interface SuccessInfo {
  orderId: string;
  paymentId: string;
  totalAmount: number;
  itemCount: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────
function calcLineDiscount(
  coupon: CouponInfo,
  productId: string,
  lineTotal: number
): number {
  if (!coupon.appliesTo.includes(productId)) return 0;
  if (coupon.discountType === 'percentage') {
    return lineTotal * (Math.min(coupon.discountValue, 100) / 100);
  }
  // For fixed on whole-cart coupons, we'll show it in the footer
  return coupon.productId ? Math.min(coupon.discountValue, lineTotal) : 0;
}

// ─── Component ───────────────────────────────────────────────────────
const CartDrawer: React.FC = () => {
  const { cart, removeFromCart, updateQuantity, isCartOpen, setCartOpen, cartTotal, clearCart } = useStoreCart();
  const navigate = useNavigate();

  const [address, setAddress] = useState({ flat: '', street: '', pin: '' });
  const [contact, setContact] = useState({ name: '', email: '', phone: '' });

  const [pinData, setPinData] = useState<{ city: string; state: string } | null>(null);
  const [isFetchingPin, setIsFetchingPin] = useState(false);

  useEffect(() => {
    if (address.pin.trim().length === 6) {
      setIsFetchingPin(true);
      fetch(`https://api.postalpincode.in/pincode/${address.pin.trim()}`)
        .then(res => res.json())
        .then(data => {
          if (data && data[0] && data[0].Status === 'Success') {
            const postOffice = data[0].PostOffice[0];
            setPinData({ city: postOffice.District, state: postOffice.State });
          } else {
            setPinData(null);
          }
        })
        .catch(() => setPinData(null))
        .finally(() => setIsFetchingPin(false));
    } else {
      setPinData(null);
    }
  }, [address.pin]);

  // Pre-fill user data when drawer opens
  useEffect(() => {
    if (isCartOpen && auth.currentUser) {
      setContact(prev => ({
        ...prev,
        name: prev.name || auth.currentUser?.displayName || '',
        email: prev.email || auth.currentUser?.email || '',
      }));
    }
  }, [isCartOpen]);

  const [couponCode, setCouponCode] = useState('');
  const [couponInfo, setCouponInfo] = useState<CouponInfo | null>(null);
  const [couponError, setCouponError] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [successInfo, setSuccessInfo] = useState<SuccessInfo | null>(null);

  const hasPhysicalItems = cart.some(item => item.product.type === 'physical');

  // ─── Coupon apply ─────────────────────────────────────────────────
  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsApplyingCoupon(true);
    setCouponError('');
    setCouponInfo(null);
    try {
      const res = await fetch('/api/store/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          couponCode: couponCode.trim().toUpperCase(),
          items: cart.map(i => ({ productId: i.product.id, variantLabel: i.selectedVariant?.label }))
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid coupon');
      setCouponInfo(data);
    } catch (e: any) {
      setCouponError(e.message);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const clearCoupon = () => {
    setCouponCode('');
    setCouponInfo(null);
    setCouponError('');
  };

  // ─── Computed totals ──────────────────────────────────────────────
  const discountBreakdown = couponInfo
    ? cart.reduce((acc, item) => {
        // Use variant-aware price — must match cartTotal calculation
        const basePrice = item.selectedVariant ? item.selectedVariant.price : item.product.price;
        const line = basePrice * item.quantity;
        return acc + calcLineDiscount(couponInfo, item.product.id, line);
      }, 0)
    : 0;

  // For whole-cart fixed discount, we apply it at footer level
  const cartFixedDiscount =
    couponInfo && couponInfo.discountType === 'fixed' && !couponInfo.productId
      ? couponInfo.discountValue
      : 0;

  const totalDiscount = discountBreakdown + cartFixedDiscount;
  const finalTotal = Math.max(0, cartTotal - totalDiscount);

  // ─── Geolocation ─────────────────────────────────────────────────
  // Helper: fill address from a Nominatim reverse-geocode response
  const fillFromNominatim = async (lat: number, lon: number) => {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`
    );
    const data = await res.json();
    const adr = data.address || {};
    const streetParts = [adr.road, adr.suburb, adr.city, adr.state, adr.country]
      .filter(Boolean).join(', ');
    setAddress(prev => ({
      ...prev,
      street: streetParts || data.display_name || '',
      pin: adr.postcode || ''
    }));
  };

  // Helper: IP-based fallback (works on HTTP / mobile without GPS permission)
  const fillFromIP = async () => {
    // Using ipwho.is as it provides generous free tiers without Auth and avoids aggressive NAT blocking
    const res = await fetch('https://ipwho.is/');
    if (!res.ok) throw new Error('IP lookup failed network');
    const d = await res.json();
    if (!d.success) throw new Error(d.message || 'IP lookup returned error');
    const streetParts = [d.city, d.region, d.country].filter(Boolean).join(', ');
    setAddress(prev => ({
      ...prev,
      street: streetParts,
      pin: d.postal || ''
    }));
  };

  const detectLocation = () => {
    setIsProcessing(true);
    setError(null);

    // Mobile browsers block GPS on non-HTTPS (isSecureContext = false).
    // Fall back to IP geolocation in that case — coarser but always works.
    const useGPS = typeof window !== 'undefined' && window.isSecureContext && !!navigator.geolocation;

    if (useGPS) {
      navigator.geolocation.getCurrentPosition(
        async ({ coords }) => {
          try {
            await fillFromNominatim(coords.latitude, coords.longitude);
          } catch (e) {
            console.error('Nominatim failed:', e);
            // GPS worked but reverse-geocode failed — try IP as last resort
            try { await fillFromIP(); }
            catch (ipErr) { 
                console.error('IP fallback failed:', ipErr);
                setError('Could not detemine your address via GPS or IP. Please enter it manually.'); 
            }
          } finally { setIsProcessing(false); }
        },
        async (err) => {
          console.warn('GPS denied or timeout:', err);
          // User denied GPS or timed out — try IP fallback silently
          if (err.code === GeolocationPositionError.PERMISSION_DENIED) {
            try { await fillFromIP(); }
            catch { setError('Location permission denied and IP lookup failed. Enter manually.'); }
          } else {
            try { await fillFromIP(); }
            catch { setError('Could not detect exact location and IP fallback failed. Enter manually.'); }
          }
          setIsProcessing(false);
        },
        { timeout: 8000, maximumAge: 60000, enableHighAccuracy: false }
      );
    } else {
      console.warn('Non-secure context, bypassing GPS directly to IP lookup');
      // Non-secure context (HTTP on mobile) — go straight to IP geolocation
      fillFromIP()
        .catch((e) => {
            console.error('IP Lookup directly failed:', e);
            setError('Could not detect location remotely (HTTP context). Please enter manually.');
        })
        .finally(() => setIsProcessing(false));
    }
  };

  // ─── Razorpay loader ─────────────────────────────────────────────
  const loadRazorpay = (): Promise<void> =>
    new Promise((resolve, reject) => {
      if ((window as any).Razorpay) { resolve(); return; }
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Failed to load Razorpay SDK.'));
      document.body.appendChild(s);
    });

  // ─── Checkout ────────────────────────────────────────────────────
  const handleCheckout = async () => {
    const user = auth.currentUser;
    if (!user) {
      setCartOpen(false);
      navigate('/login');
      return;
    }
    if (hasPhysicalItems && (!address.street.trim() || !address.pin.trim())) {
      setError('Home address and PIN code are required.');
      return;
    }
    if (!contact.name.trim() || !contact.email.trim() || !contact.phone.trim()) {
      setError('Name, email, and phone number are required for checkout.');
      return;
    }

    const formattedAddress = `${contact.name} (${contact.phone}) - ${address.flat ? address.flat + ', ' : ''}${address.street}, PIN: ${address.pin}`;

    setIsProcessing(true);
    setError(null);

    try {
      await loadRazorpay();

      const res = await fetch('/api/store/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(i => ({ productId: i.product.id, quantity: i.quantity, variantLabel: i.selectedVariant?.label })),
          shippingAddress: hasPhysicalItems ? formattedAddress : undefined,
          couponCode: couponInfo ? couponCode.trim().toUpperCase() : undefined,
          userId: user.uid
        })
      });
      const orderData = await res.json();
      if (!res.ok) throw new Error(orderData.error || 'Failed to create order');

      // Free order (100% coupon)
      if (orderData.free) {
        clearCart();
        clearCoupon();
        setCartOpen(false);
        setSuccessInfo({
          orderId: `free_${Date.now()}`,
          paymentId: 'COUPON_APPLIED',
          totalAmount: 0,
          itemCount: cart.length,
        });
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Edusimulate Store',
        description: `${cart.length} item${cart.length !== 1 ? 's' : ''}`,
        order_id: orderData.id,
        handler: async (payment: any) => {
          try {
            const vRes = await fetch('/api/store/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: payment.razorpay_order_id,
                razorpay_payment_id: payment.razorpay_payment_id,
                razorpay_signature: payment.razorpay_signature,
                userId: user.uid,
                items: orderData.calculatedItems,
                totalAmount: orderData.totalAmount,
                shippingAddress: hasPhysicalItems ? formattedAddress : undefined,
                couponId: orderData.appliedCouponId || undefined,
              })
            });
            const vData = await vRes.json();
            if (vRes.ok && vData.success) {
              const count = cart.length;
              clearCart();
              clearCoupon();
              setCartOpen(false);
              setSuccessInfo({
                orderId: payment.razorpay_order_id,
                paymentId: payment.razorpay_payment_id,
                totalAmount: orderData.totalAmount,
                itemCount: count,
              });
            } else {
              setError(vData.error || 'Verification failed.');
            }
          } catch { setError('Payment verification failed. Contact support.'); }
        },
        prefill: { name: contact.name, email: contact.email, contact: contact.phone },
        theme: { color: '#0ea5e9' },
        modal: { ondismiss: () => setIsProcessing(false) },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (r: any) => { setError(r.error.description); setIsProcessing(false); });
      rzp.open();
    } catch (e: any) {
      setError(e.message);
      setIsProcessing(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────
  if (!isCartOpen && !successInfo) return null;

  return (
    <>
      {/* ── Success Modal ── */}
      {successInfo && (
        <OrderSuccessModal
          {...successInfo}
          onClose={() => setSuccessInfo(null)}
        />
      )}

      {/* ── Cart Drawer ── */}
      {isCartOpen && createPortal(
        <div className="relative z-[9999]">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setCartOpen(false)}
            aria-hidden="true"
          />

          <div className="fixed right-0 top-0 w-screen md:w-full md:max-w-sm bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden" style={{ height: '100dvh', maxHeight: '100dvh' }}>

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shrink-0">
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Icon name="shopping-bag" className="w-4 h-4 text-brand-primary" />
                Cart
                <span className="text-xs font-semibold text-slate-400">({cart.length})</span>
              </h2>
              <button
                onClick={() => setCartOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
              >
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>

            {/* ── Cart items (natural height, max 45vh, scrolls) ── */}
            <div className="overflow-y-auto p-3 space-y-2" style={{ flex: '1 1 0', minHeight: '3rem' }}>
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                  <Icon name="shopping-cart" className="w-10 h-10 mb-3 opacity-40" />
                  <p className="text-sm">Your cart is empty.</p>
                </div>
              ) : (
                cart.map(item => {
                  const basePrice = item.selectedVariant ? item.selectedVariant.price : item.product.price;
                  const lineTotal = basePrice * item.quantity;
                  const lineDiscount = couponInfo ? calcLineDiscount(couponInfo, item.product.id, lineTotal) : 0;
                  const isDiscounted = lineDiscount > 0;
                  const affectedByFullCartCoupon =
                    couponInfo && !couponInfo.productId && couponInfo.appliesTo.includes(item.product.id);

                  return (
                    <div
                      key={`${item.product.id}-${item.selectedVariant?.label || 'base'}`}
                      className={`flex gap-3 p-2.5 rounded-xl border bg-white dark:bg-slate-800/50 relative group transition-all ${
                        isDiscounted || affectedByFullCartCoupon
                          ? 'border-emerald-300 dark:border-emerald-700 ring-1 ring-emerald-200 dark:ring-emerald-800'
                          : 'border-slate-100 dark:border-slate-800'
                      }`}
                    >
                      <div className="w-14 h-14 shrink-0 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden p-1">
                        <img src={item.product.images?.[0] || ''} alt={item.product.name} className="max-w-full max-h-full object-contain" />
                      </div>

                      <div className="flex-1 min-w-0 pr-6">
                        <h3 className="font-semibold text-xs text-slate-800 dark:text-slate-200 line-clamp-1 leading-tight">
                          {item.product.name} {item.selectedVariant && <span className="text-brand-primary/80">({item.selectedVariant.label})</span>}
                        </h3>

                        <div className="flex items-center gap-2 mt-0.5">
                          <p className={`font-bold text-xs ${isDiscounted ? 'line-through text-slate-400' : 'text-brand-primary'}`}>
                            ₹{basePrice.toLocaleString()}
                          </p>
                          {isDiscounted && (
                            <p className="font-bold text-xs text-emerald-600">
                              ₹{(basePrice - lineDiscount / item.quantity).toLocaleString()}
                            </p>
                          )}
                        </div>

                        {/* Coupon applied badge */}
                        {(isDiscounted || affectedByFullCartCoupon) && couponInfo && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded mt-0.5">
                            🏷 {couponCode} applied
                          </span>
                        )}

                        <div className="flex items-center gap-1.5 mt-1.5">
                          <button onClick={() => updateQuantity(item.product.id, item.selectedVariant?.label, item.quantity - 1)} disabled={item.quantity <= 1} className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs hover:bg-slate-200 disabled:opacity-40 font-bold">−</button>
                          <span className="text-xs font-bold w-4 text-center dark:text-white">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.product.id, item.selectedVariant?.label, item.quantity + 1)} disabled={item.quantity >= item.product.stock} className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs hover:bg-slate-200 disabled:opacity-40 font-bold">+</button>
                          <span className="text-xs text-slate-400 ml-auto font-medium">
                            {isDiscounted
                              ? <><s className="text-slate-400">₹{lineTotal.toLocaleString()}</s> <span className="text-emerald-600">₹{(lineTotal - lineDiscount).toLocaleString()}</span></>
                              : `₹${lineTotal.toLocaleString()}`
                            }
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product.id, item.selectedVariant?.label)}
                        className="absolute top-2 right-2 p-1 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Icon name="trash-2" className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* No spacer — the items list is flex-1 so it naturally fills space */}

            {/* ── Footer ── */}
            {cart.length > 0 && (
              <div className="shrink-0 px-3 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5 overflow-y-auto" style={{ maxHeight: '75dvh' }}>

                {/* Contact details */}
                <div className="mb-4">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Contact Details *</label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={contact.name}
                      onChange={e => setContact(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Full Name *"
                      className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 focus:ring-2 focus:ring-brand-primary/50 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={contact.email}
                        onChange={e => setContact(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Email *"
                        className="flex-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 focus:ring-2 focus:ring-brand-primary/50 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      />
                      <input
                        type="tel"
                        value={contact.phone}
                        onChange={e => setContact(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Phone No *"
                        className="w-1/2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 focus:ring-2 focus:ring-brand-primary/50 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Shipping address */}
                {hasPhysicalItems && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Shipping Address *</label>
                      <button onClick={detectLocation} disabled={isProcessing} className="text-[10px] text-brand-primary flex items-center gap-1 hover:underline">
                        <Icon name="zap" className="w-3 h-3" /> Auto-Locate
                      </button>
                    </div>
                    {address.pin.trim().length === 6 && (
                      <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded mb-2">
                        {isFetchingPin ? (
                          <span className="w-3 h-3 border-2 border-emerald-400 border-t-emerald-600 rounded-full animate-spin inline-block" />
                        ) : pinData ? (
                          <>
                            <Icon name="truck" className="w-3 h-3" /> Delivery to {pinData.city}, {pinData.state} in 3-5 days.
                          </>
                        ) : (
                          <>
                            <Icon name="truck" className="w-3 h-3" /> Delivery to {address.pin} in 3-5 days.
                          </>
                        )}
                      </div>
                    )}
                    <div className="space-y-2 mt-2">
                      <input
                        type="text"
                        value={address.flat}
                        onChange={e => setAddress(prev => ({ ...prev, flat: e.target.value }))}
                        placeholder="Flat, Floor no., Building (Optional)"
                        className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 focus:ring-2 focus:ring-brand-primary/50 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      />
                      <textarea
                        value={address.street}
                        onChange={e => setAddress(prev => ({ ...prev, street: e.target.value }))}
                        placeholder="Street, Locality, City, State *"
                        className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 focus:ring-2 focus:ring-brand-primary/50 text-slate-900 dark:text-white resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        rows={2}
                      />
                      <input
                        type="text"
                        value={address.pin}
                        onChange={e => setAddress(prev => ({ ...prev, pin: e.target.value }))}
                        placeholder="PIN Code *"
                        className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 focus:ring-2 focus:ring-brand-primary/50 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <p className="text-[10px] text-red-500 bg-red-50 dark:bg-red-900/20 p-1.5 rounded border border-red-100 dark:border-red-900/50">{error}</p>
                )}

                {/* ── Coupon input + Apply ── */}
                {!couponInfo ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                      onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                      placeholder="Coupon code"
                      className="flex-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-2 focus:ring-2 focus:ring-brand-primary/50 text-slate-900 dark:text-white font-mono uppercase tracking-wider"
                    />
                    <button
                      onClick={applyCoupon}
                      disabled={!couponCode.trim() || isApplyingCoupon}
                      className="px-3 py-2 text-xs font-bold rounded-lg bg-slate-900 dark:bg-white/10 text-white hover:bg-brand-primary transition-colors disabled:opacity-40 shrink-0"
                    >
                      {isApplyingCoupon ? <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" /> : 'Apply'}
                    </button>
                  </div>
                ) : (
                  /* Coupon applied pill */
                  <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Icon name="check-circle" className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{couponCode}</p>
                        <p className="text-[9px] text-emerald-600/70">{couponInfo.label}</p>
                      </div>
                    </div>
                    <button onClick={clearCoupon} className="text-emerald-600 hover:text-red-500 p-1 rounded transition-colors">
                      <Icon name="x" className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {couponError && (
                  <p className="text-[10px] text-red-500">{couponError}</p>
                )}

                {/* ── Total + Checkout ── */}
                {totalDiscount > 0 && (
                  <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-xl px-3 py-2 flex items-center justify-between shadow-sm">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">You save ₹{totalDiscount.toLocaleString()} on this order!</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      {totalDiscount > 0 ? 'Total (after discount)' : 'Subtotal'}
                    </span>
                    <div className="flex items-center gap-2">
                      {totalDiscount > 0 && (
                        <span className="text-xs text-slate-400 line-through">₹{cartTotal.toLocaleString()}</span>
                      )}
                      <span className="text-base font-black text-slate-900 dark:text-white">₹{finalTotal.toLocaleString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleCheckout}
                    disabled={isProcessing}
                    className="py-2.5 px-5 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-brand-primary to-blue-600 hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-70 shadow-lg shadow-brand-primary/20"
                  >
                    {isProcessing
                      ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : !auth.currentUser
                        ? <>Login to Checkout <Icon name="arrow-right" className="w-3.5 h-3.5" /></>
                        : <>Checkout <Icon name="arrow-right" className="w-3.5 h-3.5" /></>
                    }
                  </button>
                </div>
                
                {/* ── Trust & Payment Info ── */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center gap-3">
                  <p className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    <Icon name="shield-check" className="w-3.5 h-3.5" /> 256-bit SSL Secured | Your data is protected
                  </p>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    {['UPI', 'Cards', 'Net Banking', 'COD'].map(method => (
                      <span key={method} className="px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                        {method}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default CartDrawer;
