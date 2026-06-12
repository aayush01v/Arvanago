import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '@/components/common/SEO';
import { Product } from '@/types';
import { db } from '@/services/firebase';
import { useStoreCart } from '@/hooks/useStoreCart';
import Icon from '@/components/common/Icon';
import CartDrawer from '@/components/store/CartDrawer';
import MyOrdersModal from '@/components/store/MyOrdersModal';
import ProductCard from '@/components/store/ProductCard';
import StoreFilters from '@/components/store/StoreFilters';
import StoreFooter from '@/components/store/StoreFooter';
import QuickViewModal from '@/components/store/QuickViewModal';
import Recommendations from '@/components/store/Recommendations';
import { slugify } from '@/utils/slugify';
import WhatsAppButton from '@/components/store/WhatsAppButton';
import { motion } from 'framer-motion';

const StorePage: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'rating'>('default');
  const [maxPrice, setMaxPrice] = useState(Infinity);

  const { setCartOpen, cartItemCount, cart, wishlist, addToCart, toggleWishlist } = useStoreCart();
  const [showOrders, setShowOrders] = useState(false);
  const [showPicksBanner, setShowPicksBanner] = useState(true);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [showQuickView, setShowQuickView] = useState(false);

  const productCartQuantities = useMemo(() => {
    const quantities = new Map<string, number>();
    cart.forEach((item) => {
      quantities.set(item.product.id, (quantities.get(item.product.id) ?? 0) + item.quantity);
    });
    return quantities;
  }, [cart]);

  const wishlistSet = useMemo(() => new Set(wishlist), [wishlist]);

  const handleAddToCart = useCallback((product: Product) => {
    addToCart(product);
  }, [addToCart]);

  const handleWishlistToggle = useCallback((productId: string) => {
    toggleWishlist(productId);
  }, [toggleWishlist]);


  // Listen for My Orders button click from the global header
  useEffect(() => {
    const handler = () => setShowOrders(true);
    window.addEventListener('store:openOrders', handler);
    return () => window.removeEventListener('store:openOrders', handler);
  }, []);

  // Pagination states
  const [displayedCount, setDisplayedCount] = useState(20);
  const loadingRef = useRef<HTMLDivElement>(null);
  const picksScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the "Students Top Summer Picks" row
  useEffect(() => {
    const el = picksScrollRef.current;
    if (!el) return;
    let scrollAmount = 0;
    const speed = 0.6; // px per frame
    let rafId: number;
    let paused = false;

    const step = () => {
      if (!paused && el) {
        scrollAmount += speed;
        if (scrollAmount >= el.scrollWidth - el.clientWidth) {
          scrollAmount = 0; // loop back to start
        }
        el.scrollLeft = scrollAmount;
      }
      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    const pause = () => { paused = true; };
    const resume = () => { paused = false; };
    el.addEventListener('mouseenter', pause);
    el.addEventListener('mouseleave', resume);
    el.addEventListener('touchstart', pause, { passive: true });
    el.addEventListener('touchend', resume);

    return () => {
      cancelAnimationFrame(rafId);
      el.removeEventListener('mouseenter', pause);
      el.removeEventListener('mouseleave', resume);
      el.removeEventListener('touchstart', pause);
      el.removeEventListener('touchend', resume);
    };
  }, []);

  // Reset count on filter change
  useEffect(() => {
    setDisplayedCount(20);
  }, [debouncedSearchQuery, selectedCategory, maxPrice, sortBy]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const snap = await db.collection('products').where('isPublished', '==', true).get();
        const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setProducts(items);
        // Set initial max price to the highest product price
        const maxP = Math.max(...items.map(p => p.price), 1000);
        setMaxPrice(maxP);
      } catch (e: any) {
        console.error('Error fetching products', e);
        setError('Failed to load store catalog. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (debouncedSearchQuery.trim()) {
      const q = debouncedSearchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== 'All') {
      result = result.filter(p => p.category === selectedCategory);
    }

    if (maxPrice !== Infinity) {
      result = result.filter(p => p.price <= maxPrice);
    }

    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => (b.ratingAvg || 0) - (a.ratingAvg || 0));
        break;
    }

    return result;
  }, [products, debouncedSearchQuery, selectedCategory, maxPrice, sortBy]);

  // Observer
  useEffect(() => {
    if (!loadingRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setDisplayedCount(prev => prev + 20);
      }
    }, { rootMargin: '200px' });
    
    observer.observe(loadingRef.current);
    return () => observer.disconnect();
  }, [filteredProducts.length, displayedCount]);

  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, displayedCount);
  }, [filteredProducts, displayedCount]);

  const handleProductOpen = useCallback((product: Product) => {
    navigate(`/store/${slugify(product.name)}/${product.id}`);
  }, [navigate]);

  const handleQuickView = useCallback((product: Product) => {
    setQuickViewProduct(product);
    setShowQuickView(true);
  }, []);

  const absoluteMax = useMemo(() =>
    products.length ? Math.max(...products.map(p => p.price), 1000) : 100000,
    [products]
  );

  const SkeletonCard = () => (
    <div className="rounded-2xl bg-slate-200 dark:bg-slate-800 h-80 w-full animate-pulse" />
  );

  return (
    <div className="min-h-screen pb-24 md:pb-0 bg-slate-50 dark:bg-slate-950">
<SEO 
        title="EduSimulate Store | Premium Tech for Future Doctors & Engineers" 
        description="Discover our curated EduSimulate Store featuring learning tools, smart devices, and premium tech for NEET/JEE aspirants."
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Store",
        "name": "EduSimulate Store",
        "description": "Premium tech for NEET/JEE aspirants",
        "url": "https://edusimulate.com/store",
        "potentialAction": {
          "@type": "ViewAction",
          "url": "https://edusimulate.com/store",
          "name": "Browse Store"
        },
        "offers": products.slice(0, 10).map(p => ({
          "@type": "Offer",
          "itemOffered": {
            "@type": "Product",
            "name": p.name,
            "image": p.images?.[0],
            "description": p.description,
            "offers": {
              "@type": "Offer",
              "price": p.price,
              "priceCurrency": "INR",
              "availability": p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
            }
          }
        }))
      }) }} />
      {/* Premium Trust Bar */}
      <div className="bg-gradient-to-r from-brand-primary via-blue-600 to-indigo-600 text-white text-[10px] sm:text-xs font-semibold text-center py-2.5 px-4 flex items-center justify-center gap-4 sm:gap-8 tracking-wide shadow-md overflow-hidden">
        <span className="flex items-center gap-1.5 shrink-0">
          <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 1l2.39 4.84 5.34.78-3.86 3.76.91 5.32L10 13.27l-4.78 2.51.91-5.32-3.86-3.76 5.34-.78z" clipRule="evenodd"/></svg>
          Trusted by 50,000+ aspirants
        </span>
        <span className="hidden sm:flex items-center gap-1.5 shrink-0">
          <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
          100% Genuine Products
        </span>
        <span className="flex items-center gap-1.5 shrink-0">
          <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12"/></svg>
          Free Shipping above ₹999
        </span>
        <span className="hidden md:flex items-center gap-1.5 shrink-0">
          <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          30-Day Returns
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6 pb-12">
        {/* Auto-sliding trending banner */}
        {!loading && products.length > 0 && (
          <>
            <section className="mb-8 rounded-[2rem] border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.45)] overflow-hidden">
              <div className="grid gap-4 md:gap-6 lg:grid-cols-[1.25fr_0.75fr] p-5 md:p-8 bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.16),_transparent_35%),linear-gradient(135deg,_rgba(255,255,255,0.92),_rgba(248,250,252,0.96))] dark:bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.18),_transparent_35%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(15,23,42,0.92))]">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-brand-primary">
                    Curated store
                  </div>
                  <h1 className="mt-3 md:mt-4 text-[clamp(2rem,5vw,2.8rem)] md:text-5xl font-black leading-[1.1] md:leading-tight text-slate-900 dark:text-white max-w-2xl">
                    Study smarter. Carry better.
                  </h1>
                  <div className="mt-4 md:mt-6 grid grid-cols-2 gap-3 md:gap-5 max-w-2xl">
                    {[
                      { icon: 'shield-check', title: '100% Genuine', desc: 'Brand Authorized' },
                      { icon: 'zap', title: 'High Performance', desc: 'Curated for Creators' },
                      { icon: 'truck', title: 'Fast Delivery', desc: 'Pan-India Shipping' },
                      { icon: 'headphones', title: 'Priority Support', desc: 'Always here to help' },
                    ].map((feature) => (
                      <div key={feature.title} className="rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/75 dark:bg-slate-800/70 p-[14px] md:px-3.5 md:py-3 flex items-start gap-2 md:gap-3 shadow-sm min-w-0">
                        <div className="w-10 h-10 md:w-9 md:h-9 rounded-xl bg-brand-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Icon name={feature.icon} className="w-3.5 h-3.5 text-brand-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[clamp(1.2rem,2.8vw,1.5rem)] md:text-xl font-bold text-slate-900 dark:text-white leading-[1.1] break-words">{feature.title}</p>
                          <p className="mt-0.5 md:mt-1 text-[0.75rem] md:text-lg text-slate-600 dark:text-slate-300 leading-[1.2] break-words">{feature.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Student Picks Section */}
            {showPicksBanner && (
              <div className="mb-10 relative">
                {/* ── Students Top Summer Picks Banner — 1920×600 responsive ── */}
                <div
                  className="relative w-full aspect-[1024/318] rounded-2xl md:rounded-3xl overflow-hidden mb-6 shadow-xl cursor-pointer group bg-slate-100 dark:bg-slate-900"
                  onClick={() => navigate('/store/ipad-10th-gen-apple-pencil-usb-c-combo/ipad_10th_gen_combo')}
                >
                  <img
                    src="https://i.imgur.com/Q3YiHXt.jpeg"
                    alt="Students Top Summer Picks"
                    className="absolute inset-0 w-full h-full object-contain object-center md:group-hover:scale-105 transition-transform duration-700"
                  />
                  
                  {/* Subtle hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />

                  {/* Close button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPicksBanner(false);
                    }}
                    aria-label="Close banner"
                    className="absolute top-3 right-3 md:top-4 md:right-4 z-20 group flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/20 hover:border-white/50 text-white/70 hover:text-white transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110 active:scale-95"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

          </>
        )}

        {/* Filter skeleton */}
        {loading ? (
          <div className="space-y-4 mb-8">
            <div className="h-12 w-full bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="h-8 w-20 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
              ))}
            </div>
          </div>
        ) : (
          <>
            <StoreFilters
              products={products}
              searchQuery={searchQuery}
              selectedCategory={selectedCategory}
              maxPrice={maxPrice === Infinity ? absoluteMax : maxPrice}
              sortBy={sortBy}
              onSearchChange={setSearchQuery}
              onCategoryChange={setSelectedCategory}
              onMaxPriceChange={(p) => setMaxPrice(p >= absoluteMax ? Infinity : p)}
              onSortByChange={setSortBy}
            />
            <Recommendations excludeProductId={quickViewProduct?.id} className="mt-12" />
          </>
        )}

        {/* Product Grid */}
        {error ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24 bg-red-50/50 dark:bg-red-900/10 rounded-3xl border border-red-200 dark:border-red-900/50 shadow-sm"
          >
            <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon name="alert-triangle" className="h-12 w-12 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Store Temporarily Unavailable</h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {error}
            </p>
            <button 
                onClick={() => window.location.reload()} 
                className="mt-6 px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition"
            >
                Retry Connection
            </button>
          </motion.div>
        ) : loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <SkeletonCard key={n} />)}
          </div>
        ) : filteredProducts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <div className="w-24 h-24 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon name="search" className="h-12 w-12 text-brand-primary/60" />
            </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">No products found</h2>
              <div className="max-w-md mx-auto text-center space-y-4">
                <p className="text-slate-500 dark:text-slate-400">
                  {products.length === 0
                    ? "We're packing the shelves with high-quality gear. Check back soon!"
                    : "Try adjusting your search, category, or price filters."}
                </p>
                {products.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 pt-6">
                    <Recommendations className="col-span-2" />
                  </div>
                )}
              </div>
          </motion.div>
        ) : (
          <>
            {/* Result count label */}
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="mt-3 mb-4">
              <ol className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
                <li>
                  <a href="/" className="hover:text-brand-primary transition-colors">Home</a>
                </li>
                <li>
                  <span className="px-2">/</span>
                </li>
                <li aria-current="page" className="font-semibold text-slate-900 dark:text-white">
                  Store
                </li>
              </ol>
            </nav>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6"
            >
              {displayedProducts.map(product => (
                <div key={product.id}>
                  <ProductCard
                    product={product}
                    onClick={handleProductOpen}
                    onQuickView={handleQuickView}
                    onAddToCart={handleAddToCart}
                    onWishlistToggle={handleWishlistToggle}
                    inWishlist={wishlistSet.has(product.id)}
                    inCartQuantity={productCartQuantities.get(product.id) ?? 0}
                  />
                </div>
              ))}
            </motion.div>
            
            {/* Infinite Scroll Trigger */}
            {displayedCount < filteredProducts.length && (
              <div ref={loadingRef} className="py-8 flex justify-center">
                <div className="w-8 h-8 rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-brand-primary animate-spin" />
              </div>
            )}
          </>
        )}
      </div>

      <StoreFooter />
      <WhatsAppButton />
      {showOrders && <MyOrdersModal onClose={() => setShowOrders(false)} />}
      <QuickViewModal
        product={quickViewProduct!}
        isOpen={showQuickView}
        onClose={() => setShowQuickView(false)}
        onViewDetails={() => {
          if (quickViewProduct) {
            navigate(`/store/${slugify(quickViewProduct.name)}/${quickViewProduct.id}`);
          }
          setShowQuickView(false);
        }}
      />
    </div>
  );
};

export default StorePage;
