import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product, ProductReview } from '@/types';
import { db } from '@/services/firebase';
import { useStoreCart } from '@/hooks/useStoreCart';
import Icon from '@/components/common/Icon';
import CartDrawer from '@/components/store/CartDrawer';
import ProductCard from '@/components/store/ProductCard';
import SEO from '@/components/common/SEO';
import StoreFooter from '@/components/store/StoreFooter';
import { slugify } from '@/utils/slugify';
import WhatsAppButton from '@/components/store/WhatsAppButton';
import { motion, AnimatePresence } from 'framer-motion';

// ── Helpers ───────────────────────────────────────────────────────────────
const StarRow = ({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' }) => {
  const cls = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Icon key={s} name="star" className={`${cls} ${s <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
      ))}
    </div>
  );
};

// ── Component ─────────────────────────────────────────────────────────────
const ProductPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { addToCart, cart, cartItemCount, setCartOpen, toggleWishlist, isInWishlist } = useStoreCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [otherProducts, setOtherProducts] = useState<Product[]>([]);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<{ label: string; price: number } | undefined>(undefined);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [reviewImgModal, setReviewImgModal] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'description' | 'features' | 'specs' | 'reviews'>('description');

  const detailsRef = useRef<HTMLDivElement>(null);
  const tabsSectionRef = useRef<HTMLDivElement>(null);

  // Scroll to top when this page mounts or productId changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [productId]);

  const effectivePrice = selectedVariant ? selectedVariant.price : (product?.price ?? 0);
  const inCartQuantity = cart.find(item =>
    item.product.id === productId && item.selectedVariant?.label === selectedVariant?.label
  )?.quantity || 0;
  const isOutOfStock = (product?.stock ?? 0) <= 0;
  const reachedMax = product ? inCartQuantity >= product.stock : false;
  const mustPickVariant = product?.variants && product.variants.length > 0 && !selectedVariant;
  const cartQuantities = useMemo(() => {
    const quantities = new Map<string, number>();
    cart.forEach((item) => {
      quantities.set(item.product.id, (quantities.get(item.product.id) ?? 0) + item.quantity);
    });
    return quantities;
  }, [cart]);

  // ── Data loading ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    setProduct(null);
    setOtherProducts([]);
    setActiveImg(0);
    setSelectedVariant(undefined);

    const load = async () => {
      try {
        const [docSnap, reviewSnap] = await Promise.all([
          db.collection('products').doc(productId).get(),
          db.collection('products').doc(productId).collection('reviews').orderBy('timestamp', 'desc').get()
        ]);
        if (!docSnap.exists) { navigate('/store'); return; }
        const p = { id: docSnap.id, ...docSnap.data() } as Product;
        setProduct(p);
        setReviews(reviewSnap.docs.map(d => ({ id: d.id, ...d.data() } as ProductReview)));

        if (p.variants && p.variants.length > 0) setSelectedVariant(p.variants[0]);

        // ── Load "other products" ────────────────────────────────────
        // 1st pass: same category (max 6)
        let others: Product[] = [];
        if (p.category) {
          const catSnap = await db.collection('products')
            .where('category', '==', p.category)
            .where('isPublished', '==', true)
            .limit(8)
            .get();
          others = catSnap.docs
            .map(d => ({ id: d.id, ...d.data() } as Product))
            .filter(rp => rp.id !== productId)
            .slice(0, 6);
        }

        // 2nd pass: backfill from whole store if < 4 from same category
        if (others.length < 4) {
          const allSnap = await db.collection('products')
            .where('isPublished', '==', true)
            .limit(12)
            .get();
          const extraIds = new Set([productId, ...others.map(o => o.id)]);
          const extras = allSnap.docs
            .map(d => ({ id: d.id, ...d.data() } as Product))
            .filter(rp => !extraIds.has(rp.id))
            .slice(0, 6 - others.length);
          others = [...others, ...extras];
        }
        setOtherProducts(others);

        // 3rd pass: Load "Suggestions" band (broad matching offset from 'others')
        const suggSnap = await db.collection('products')
          .where('isPublished', '==', true)
          .limit(16)
          .get();
        const suggExcludeIds = new Set([productId, ...others.map(o => o.id)]);
        const suggs = suggSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as Product))
          .filter(rp => !suggExcludeIds.has(rp.id))
          .slice(0, 8);
        setSuggestions(suggs);
      } catch (e) {
        console.error('Failed to load product', e);
        navigate('/store');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [productId]);

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleAddToCart = () => {
    if (!product || mustPickVariant) return;
    addToCart(product, 1, selectedVariant);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  };

  const handleProductCardClick = (p: Product) => navigate(`/store/${slugify(p.name)}/${p.id}`);

  const discount = product?.originalPrice && product.originalPrice > effectivePrice
    ? Math.round(((product.originalPrice - effectivePrice) / product.originalPrice) * 100)
    : null;

  const avgRating = product?.ratingAvg || 0;

  const ratingDist = [5, 4, 3, 2, 1].map(star => {
    let count = 0;
    if (product?.ratingDistribution) {
      count = product.ratingDistribution[star as keyof typeof product.ratingDistribution] || 0;
    } else {
      count = reviews.filter(r => Math.round(r.rating) === star).length;
    }
    return { star, count };
  });
  const maxDist = Math.max(...ratingDist.map(r => r.count), 1);

  // ── Loading skeleton ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-10 h-10 border-4 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) return null;

  const images = product.images?.filter(Boolean).length ? product.images : [];

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 md:pb-0">
      <SEO 
        title={`${product.name} | Edusimulate`}
        description={product.description ? (product.description.length > 155 ? product.description.substring(0, 155) + '...' : product.description) : undefined}
        image={images[0]}
        type="product"
      />
      
      {/* ── Review image modal ── */}
      <AnimatePresence>
        {reviewImgModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setReviewImgModal(null)}
          >
            <motion.img
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              src={reviewImgModal}
              className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
              onClick={e => e.stopPropagation()}
            />
            <button
              onClick={() => setReviewImgModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition"
            >
              <Icon name="x" className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>



      {/* ── Main content ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">

        {/* ── Product grid: image + details ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_1.1fr] gap-6 lg:gap-14">

          {/* ── Left: Image Gallery ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="space-y-3"
          >
            {/* Main image with swipe */}
            <div
              className="relative -mx-4 md:mx-0 rounded-none md:rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border-y border-x-0 md:border md:border-solid border-slate-200 dark:border-slate-800 shadow-none md:shadow-md flex items-center justify-center p-0 md:p-10 aspect-square max-h-[100vw] md:max-h-[60vw] min-h-[220px]"
              onTouchStart={e => setTouchStartX(e.touches[0].clientX)}
              onTouchEnd={e => {
                if (touchStartX === null || images.length <= 1) return;
                const delta = e.changedTouches[0].clientX - touchStartX;
                if (Math.abs(delta) > 40) {
                  setActiveImg(i => delta < 0 ? (i + 1) % images.length : (i - 1 + images.length) % images.length);
                }
                setTouchStartX(null);
              }}
            >
              <AnimatePresence>{addedFeedback && <motion.span initial={{ scale: 0.4, opacity: 0.5 }} animate={{ scale: 1.8, opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.55, ease: "easeOut" }} className="absolute inset-0 bg-white/30 rounded-2xl" />}</AnimatePresence>
                <AnimatePresence>{addedFeedback && <motion.span initial={{ scale: 0.4, opacity: 0.5 }} animate={{ scale: 1.8, opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.55, ease: "easeOut" }} className="absolute inset-0 bg-white/30 rounded-2xl" />}</AnimatePresence>
          <AnimatePresence mode="wait">
                {images.length > 0 ? (
                  <motion.img
                    key={activeImg}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    src={images[activeImg]}
                    alt={product.name}
                    className="max-h-full max-w-full object-contain drop-shadow-xl"
                  />
                ) : (
                  <img 
                    src="https://i.imgur.com/Q3YiHXt.jpeg" 
                    alt="Placeholder" 
                    className="max-h-full max-w-full object-contain" 
                  />
                )}
              </AnimatePresence>

              {discount && (
                <div className="absolute top-3 left-3 bg-rose-500 text-white text-sm font-black px-2.5 py-1 rounded-xl shadow-lg">
                  -{discount}% OFF
                </div>
              )}
              {isOutOfStock && (
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                  <span className="bg-white text-slate-900 font-black text-lg px-6 py-2 rounded-2xl uppercase tracking-widest shadow-xl">Sold Out</span>
                </div>
              )}

              {/* Arrows (desktop only) */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImg(i => (i - 1 + images.length) % images.length)}
                    className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 dark:bg-slate-800/80 shadow backdrop-blur items-center justify-center hover:bg-white dark:hover:bg-slate-700 transition"
                    aria-label="Previous image"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                  </button>
                  <button
                    onClick={() => setActiveImg(i => (i + 1) % images.length)}
                    className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 dark:bg-slate-800/80 shadow backdrop-blur items-center justify-center hover:bg-white dark:hover:bg-slate-700 transition"
                    aria-label="Next image"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail strip — horizontal scroll on mobile */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    aria-label={`Image ${i + 1}`}
                    className={`shrink-0 snap-start w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 transition-all duration-150 ${
                      i === activeImg
                        ? 'border-brand-primary ring-2 ring-brand-primary/30 scale-105'
                        : 'border-slate-200 dark:border-slate-700 hover:border-brand-primary/50'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain p-1 bg-white dark:bg-slate-800" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* ── Right: Details ── */}
          <motion.div
            ref={detailsRef}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.08 }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {product.category && (
                <span className="text-xs font-bold uppercase tracking-widest text-brand-primary">{product.category}</span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white leading-tight">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-2 flex-wrap">
              <StarRow rating={avgRating} />
              <span className="font-bold text-slate-800 dark:text-white text-sm">{avgRating ? avgRating.toFixed(1) : '—'}</span>
              <span className="text-sm text-slate-500 dark:text-slate-400">({product.reviewCount || 0} reviews)</span>
              {product.stock > 0 && (
                <span className="text-xs text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-100 dark:bg-emerald-900/40 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ml-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> In Stock – Ships in 24 hours
                </span>
              )}
            </div>

            {/* Price */}
            <div className="flex flex-col py-3 border-y border-slate-200 dark:border-slate-800">
              <div className="flex items-end gap-3">
                <span className="text-3xl sm:text-4xl font-black text-brand-primary">₹{effectivePrice.toLocaleString()}</span>
                {product.originalPrice && product.originalPrice > effectivePrice && (
                  <>
                    <span className="text-lg text-slate-400 line-through mb-0.5">₹{product.originalPrice.toLocaleString()}</span>
                    <span className="mb-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-lg">
                      Save ₹{(product.originalPrice - effectivePrice).toLocaleString()}
                    </span>
                  </>
                )}
              </div>
              {effectivePrice >= 10000 && (
                <div className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/50 w-fit px-2.5 py-1 rounded">
                  <Icon name="credit-card" className="w-3.5 h-3.5 text-slate-500" />
                  EMI starts at <span className="font-bold text-slate-800 dark:text-slate-200">₹{Math.round(effectivePrice / 6).toLocaleString()}/mo.</span>
                </div>
              )}
            </div>

            {/* Variant Picker */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Select Option:
                  {selectedVariant && <span className="text-brand-primary ml-1.5 font-black">{selectedVariant.label}</span>}
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedVariant(v)}
                      className={`px-3 py-1.5 rounded-xl border-2 text-sm font-bold transition-all duration-150 ${
                        selectedVariant?.label === v.label
                          ? 'border-brand-primary bg-brand-primary text-white shadow-md shadow-brand-primary/25 scale-105'
                          : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-brand-primary dark:hover:border-brand-primary bg-white dark:bg-slate-800'
                      }`}
                    >
                      {v.label}
                      <span className={`ml-1.5 font-medium text-xs ${selectedVariant?.label === v.label ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>
                        ₹{v.price.toLocaleString()}
                      </span>
                    </button>
                  ))}
                </div>
                {mustPickVariant && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Icon name="alert-circle" className="w-3 h-3" /> Please select an option before adding to cart
                  </p>
                )}
              </div>
            )}

            {/* Description Preview (Full description moved to tabs) */}
            <div className="mb-2">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-sm line-clamp-4">
                {product.description}
              </p>
              <button
                onClick={() => {
                  setActiveTab('description');
                  tabsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="text-xs font-bold text-brand-primary hover:underline mt-1"
              >
                Read more
              </button>
            </div>

            {/* CTA — visible on md+ (mobile version is sticky footer below) */}
            <div className="hidden md:flex flex-col sm:flex-row gap-3 mt-auto pt-2">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock || reachedMax || !!mustPickVariant}
                className="relative overflow-hidden flex-1 py-3.5 px-6 rounded-2xl font-black text-white bg-gradient-to-r from-brand-primary to-blue-600 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl shadow-brand-primary/25 disabled:opacity-50 disabled:pointer-events-none"
              >
                <AnimatePresence mode="wait">
                  {addedFeedback ? (
                    <motion.span key="added" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="flex items-center gap-2">
                      <Icon name="check-circle" className="w-5 h-5" /> Added!
                    </motion.span>
                  ) : (
                    <motion.span key="normal" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="flex items-center gap-2">
                      <Icon name="shopping-cart" className="w-5 h-5" />
                      {isOutOfStock ? 'Sold Out' : inCartQuantity > 0 ? `${inCartQuantity} in Cart — Add More` : 'Add to Cart'}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
              {inCartQuantity > 0 && (
                <button
                  onClick={() => setCartOpen(true)}
                  className="py-3.5 px-5 rounded-2xl font-bold border-2 border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <Icon name="shopping-bag" className="w-5 h-5" /> View Cart
                </button>
              )}
            </div>

            {/* Trust badges */}
            <div className="hidden md:flex flex-wrap gap-3 pt-1">
              {[
                { icon: 'shield', label: '100% Secure Checkout' },
                { icon: 'refresh-cw', label: '30-Day Return' },
                { icon: 'shield-check', label: '1-Year Warranty' },
              ].map(b => (
                <span key={b.label} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <Icon name={b.icon} className="w-3.5 h-3.5 text-emerald-500" /> {b.label}
                </span>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── Why Students Love It Section ── */}
        {/* ── Product Tabs Section ── */}
        <div ref={tabsSectionRef} className="mt-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Tab Headers */}
          <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-800 scrollbar-hide">
            {[
              { id: 'description', label: 'Description' },
              ...(product.features?.length ? [{ id: 'features', label: 'Features' }] : []),
              ...(product.specs?.length ? [{ id: 'specs', label: 'Specifications' }] : []),
              { id: 'reviews', label: `Reviews (${product.reviewCount || 0})` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`whitespace-nowrap px-6 py-4 text-sm font-bold border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-brand-primary text-brand-primary'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6 sm:p-8">
            {activeTab === 'description' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">About this product</h3>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-sm md:text-base">
                  {product.description}
                </p>
              </motion.div>
            )}

            {activeTab === 'features' && product.features && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">Key Features & Highlights</h3>
                <ul className="space-y-3">
                  {product.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon name="check" className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="leading-relaxed">{f}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {activeTab === 'specs' && product.specs && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">Technical Specifications</h3>
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden max-w-4xl">
                  {product.specs.map((spec, i) => (
                    <div key={i} className={`flex flex-col sm:flex-row px-4 sm:px-6 py-3 text-sm gap-1 sm:gap-4 ${i % 2 === 0 ? 'bg-slate-50 dark:bg-slate-800/50' : 'bg-white dark:bg-slate-900'}`}>
                      <span className="sm:w-1/3 font-bold text-slate-500 dark:text-slate-400">{spec.label}</span>
                      <span className="flex-1 text-slate-800 dark:text-slate-200 font-medium">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'reviews' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {reviews.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
                    {/* Rating summary */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 h-fit border border-slate-100 dark:border-slate-800">
                      <div className="text-6xl font-black text-slate-900 dark:text-white">{avgRating.toFixed(1)}</div>
                      <StarRow rating={avgRating} />
                      <p className="text-sm font-medium text-slate-500">Based on {product.reviewCount || 0} reviews</p>
                      <div className="w-full space-y-2 mt-2">
                        {ratingDist.map(({ star, count }) => (
                          <div key={star} className="flex items-center gap-2 text-xs">
                            <span className="w-3 text-slate-600 dark:text-slate-400 font-bold shrink-0">{star}</span>
                            <Icon name="star" className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                            <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                              <div className="bg-amber-400 h-full rounded-full transition-all duration-500" style={{ width: `${(count / maxDist) * 100}%` }} />
                            </div>
                            <span className="w-6 text-slate-500 text-right font-medium shrink-0">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Review cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {reviews.map(review => (
                        <div
                          key={review.id}
                          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col gap-3"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">{review.authorName}</p>
                              {review.isVerifiedPurchase && (
                                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500 flex items-center gap-1 mt-1 bg-emerald-50 dark:bg-emerald-900/20 w-fit px-1.5 py-0.5 rounded">
                                  <Icon name="check-circle" className="w-3 h-3" /> Verified Buyer
                                </span>
                              )}
                            </div>
                            <StarRow rating={review.rating} size="sm" />
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{review.comment}</p>
                          {review.images && review.images.length > 0 && (
                            <div className="flex gap-2 flex-wrap mt-auto pt-2">
                              {review.images.map((imgUrl, imgIdx) => (
                                <button
                                  key={imgIdx}
                                  onClick={() => setReviewImgModal(imgUrl)}
                                  className="w-16 h-16 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 hover:border-brand-primary transition-all shrink-0 bg-slate-100 dark:bg-slate-800"
                                >
                                  <img src={imgUrl} alt={`Review image ${imgIdx + 1}`} className="w-full h-full object-cover" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                    <Icon name="star" className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">No reviews yet</h3>
                    <p className="text-slate-500 text-sm">Be the first to share your thoughts on this product!</p>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* ── Suggestions ── */}
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-14"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">Suggestions</h2>
            </div>
            {/* Scrollable list visibly overflowing the track */}
            <div className="flex gap-4 overflow-x-auto pb-6 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory rounded-xl">
              {suggestions.map(rp => (
                <div key={rp.id} className="shrink-0 w-[160px] sm:w-[200px] lg:w-[220px] snap-start">
                  <ProductCard
                    product={rp}
                    onClick={handleProductCardClick}
                    onQuickView={handleProductCardClick}
                    onAddToCart={addToCart}
                    onWishlistToggle={toggleWishlist}
                    inWishlist={isInWishlist(rp.id)}
                    inCartQuantity={cartQuantities.get(rp.id) ?? 0}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── You May Also Like ── */}
        {otherProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-14"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">You May Also Like</h2>
              <button
                onClick={() => navigate('/store')}
                className="text-xs font-semibold text-brand-primary hover:underline flex items-center gap-1"
              >
                View all <Icon name="arrow-right" className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Vertically scrollable 3-column grid container */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 max-h-[600px] overflow-y-auto pr-1 pb-2">
              {otherProducts.map(rp => (
                <ProductCard
                  key={rp.id}
                  product={rp}
                  onClick={handleProductCardClick}
                  onQuickView={handleProductCardClick}
                  onAddToCart={addToCart}
                  onWishlistToggle={toggleWishlist}
                  inWishlist={isInWishlist(rp.id)}
                  inCartQuantity={cartQuantities.get(rp.id) ?? 0}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Mobile sticky CTA bar ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 px-4 py-3 flex gap-3 shadow-2xl">
        {/* Price */}
        <div className="flex flex-col justify-center min-w-0">
          <span className="text-lg font-black text-brand-primary leading-tight">₹{effectivePrice.toLocaleString()}</span>
          {product.originalPrice && product.originalPrice > effectivePrice && (
            <span className="text-xs text-slate-400 line-through leading-tight">₹{product.originalPrice.toLocaleString()}</span>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock || reachedMax || !!mustPickVariant}
          className="relative overflow-hidden flex-1 py-3 rounded-2xl font-black text-white bg-gradient-to-r from-brand-primary to-blue-600 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/30 disabled:opacity-50 disabled:pointer-events-none text-sm"
        >
          <AnimatePresence mode="wait">
            {addedFeedback ? (
              <motion.span key="added" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="flex items-center gap-2">
                <Icon name="check-circle" className="w-4 h-4" /> Added!
              </motion.span>
            ) : (
              <motion.span key="normal" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="flex items-center gap-2">
                <Icon name="shopping-cart" className="w-4 h-4" />
                {isOutOfStock ? 'Sold Out' : inCartQuantity > 0 ? `Add More (${inCartQuantity})` : 'Add to Cart'}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {inCartQuantity > 0 && (
          <button
            onClick={() => setCartOpen(true)}
            className="py-3 px-4 rounded-2xl font-bold border-2 border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white transition-all flex items-center justify-center gap-1.5 text-sm shrink-0"
          >
            <Icon name="shopping-bag" className="w-4 h-4" />
          </button>
        )}
      </div>

      <StoreFooter />
      <WhatsAppButton />
    </div>
  );
};

export default ProductPage;
