import React, { useEffect, useRef, useState } from 'react';
import { Product } from '@/types';
import { useStoreCart } from '@/hooks/useStoreCart';
import Icon from '@/components/common/Icon';
import { motion, AnimatePresence } from 'framer-motion';

interface StoreBannerProps {
  products: Product[];
  onViewProduct: (product: Product) => void;
}

const buildResponsiveImage = (url: string, width: number) => {
  if (!url) return url;

  if (url.includes('res.cloudinary.com')) {
    return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width},c_fill/`);
  }

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}w=${width}&auto=format`;
};

const StoreBanner: React.FC<StoreBannerProps> = ({ products, onViewProduct }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { addToCart, cart } = useStoreCart();

  // Pick top 4 rated products as trending
  const trendingProducts = products
    .filter(p => p.isPublished)
    .sort((a, b) => (b.ratingAvg || 0) - (a.ratingAvg || 0) || (b.reviewCount || 0) - (a.reviewCount || 0))
    .slice(0, 4);

  const startTimer = () => {
    intervalRef.current = setInterval(() => {
      if (!isPaused) {
        setCurrentIndex(prev => (prev + 1) % (trendingProducts.length || 1));
      }
    }, 4000);
  };

  useEffect(() => {
    if (trendingProducts.length < 2) return;
    startTimer();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [trendingProducts.length, isPaused]);

  const goTo = (index: number) => {
    setCurrentIndex(index);
    if (intervalRef.current) clearInterval(intervalRef.current);
    startTimer();
  };

  if (trendingProducts.length === 0) return null;

  const current = trendingProducts[currentIndex];
  const inCart = cart.find(item => item.product.id === current.id);

  const gradients = [
    'from-violet-900/80 via-purple-900/70 to-indigo-900/80',
    'from-blue-900/80 via-cyan-900/70 to-teal-900/80',
    'from-rose-900/80 via-pink-900/70 to-orange-900/80',
    'from-emerald-900/80 via-green-900/70 to-cyan-900/80',
  ];

  return (
    <div
      className="relative w-full h-72 md:h-80 lg:h-96 rounded-3xl overflow-hidden select-none mb-10 shadow-2xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <AnimatePresence mode="sync">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -80 }}
          transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute inset-0"
        >
          {/* Background image with blur overlay */}
          {current.images?.[0] ? (
              <img
              src={buildResponsiveImage(current.images[0], 1280)}
              srcSet={`${buildResponsiveImage(current.images[0], 768)} 768w, ${buildResponsiveImage(current.images[0], 1280)} 1280w, ${buildResponsiveImage(current.images[0], 1920)} 1920w`}
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1280px"
              alt={current.name}
              fetchPriority="high"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
          )}

          {/* Gradient overlay */}
          <div className={`absolute inset-0 bg-gradient-to-r ${gradients[currentIndex % gradients.length]} backdrop-blur-[2px]`} />

          {/* Noise texture for depth */}
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

          {/* Content */}
          <div className="relative z-10 h-full flex items-center px-8 md:px-14">
            <div className="max-w-2xl">
              {/* Badge */}
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                  Trending
                </span>
                <span className="inline-flex items-center gap-1 bg-white/10 backdrop-blur-md border border-white/20 text-white/80 text-xs px-3 py-1.5 rounded-full capitalize">
                  {current.type === 'physical' ? '📦 Physical' : '⚡ Digital'}
                </span>
              </div>

              {/* Title */}
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight mb-3 drop-shadow-xl line-clamp-2 md:line-clamp-3">
                {current.name}
              </h2>

              {/* Description */}
              <p className="text-white/75 text-sm md:text-base mb-6 line-clamp-2 max-w-lg leading-relaxed">
                {current.description}
              </p>

              {/* Price + CTA */}
              <div className="flex items-center gap-4 flex-wrap">
                <div>
                  <span className="text-3xl font-black text-white">₹{current.price.toLocaleString()}</span>
                  {current.originalPrice && current.originalPrice > current.price && (
                    <span className="ml-2 text-base text-white/50 line-through">₹{current.originalPrice.toLocaleString()}</span>
                  )}
                </div>

                <button
                  onClick={() => addToCart(current)}
                  disabled={current.stock <= 0 || (inCart?.quantity || 0) >= current.stock}
                  className="flex items-center gap-2 bg-white text-slate-900 font-bold px-6 py-3 rounded-2xl hover:bg-white/90 active:scale-95 transition-all shadow-xl shadow-black/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {inCart ? (
                    <><Icon name="check" className="w-4 h-4 text-emerald-600" /> In Cart</>
                  ) : (
                    <><Icon name="shopping-cart" className="w-4 h-4" /> Add to Cart</>
                  )}
                </button>

                <button
                  onClick={() => onViewProduct(current)}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-semibold px-6 py-3 rounded-2xl transition-all"
                >
                  Details <Icon name="arrow-right" className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Floating product image card (desktop) */}
          {current.images?.[0] && (
            <div className="hidden lg:flex absolute right-12 top-1/2 -translate-y-1/2 items-center justify-center">
              <div className="w-52 h-52 rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl backdrop-blur-md ring-4 ring-white/10 rotate-3 hover:rotate-0 transition-transform duration-500">
                <img src={buildResponsiveImage(current.images[0], 420)} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Dot navigation */}
      {trendingProducts.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {trendingProducts.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all duration-300 ${
                i === currentIndex
                  ? 'w-6 h-2 bg-white'
                  : 'w-2 h-2 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}

      {/* Prev / Next arrows */}
      {trendingProducts.length > 1 && (
        <>
          <button
            onClick={() => goTo((currentIndex - 1 + trendingProducts.length) % trendingProducts.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/10 text-white transition-all"
          >
            <Icon name="chevronLeft" className="w-5 h-5" />
          </button>
          <button
            onClick={() => goTo((currentIndex + 1) % trendingProducts.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/10 text-white transition-all"
          >
            <Icon name="chevronRight" className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Progress bar */}
      {!isPaused && trendingProducts.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10 z-20 overflow-hidden">
          <motion.div
            key={`${currentIndex}-progress`}
            className="h-full bg-white/60"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 4, ease: 'linear' }}
          />
        </div>
      )}
    </div>
  );
};

export default StoreBanner;
