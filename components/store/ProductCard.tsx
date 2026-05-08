import React, { useState, memo, useEffect } from 'react';
import { Product } from '@/types';
import Icon from '@/components/common/Icon';
import { motion, AnimatePresence } from 'framer-motion';

// ── Glassmorphic animated love / wishlist button ──────────────────────────────
const WishlistButton: React.FC<{
  inWishlist: boolean;
  onToggle: (e: React.MouseEvent) => void;
}> = ({ inWishlist, onToggle }) => {
  const [burst, setBurst] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    setBurst(true);
    setTimeout(() => setBurst(false), 600);
    onToggle(e);
  };

  return (
    <div className="absolute top-3 left-3 z-10">
      {/* Burst ring */}
      <AnimatePresence>
        {burst && (
          <motion.span
            key="ring"
            initial={{ scale: 0.6, opacity: 0.8 }}
            animate={{ scale: 2.4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="absolute inset-0 rounded-full bg-rose-400 pointer-events-none"
          />
        )}
      </AnimatePresence>

      <motion.button
        onClick={handleClick}
        whileTap={{ scale: 0.82 }}
        aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        title={inWishlist ? 'Loved ♥' : 'Add to wishlist'}
        style={{
          background: inWishlist
            ? 'linear-gradient(135deg, rgba(255,80,90,0.65), rgba(220,38,38,0.55))'
            : 'rgba(255,255,255,0.72)',
          boxShadow: inWishlist
            ? '0 4px 20px -4px rgba(239,68,68,0.55), inset 0 1px 0 rgba(255,255,255,0.35)'
            : '0 2px 14px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.6)',
        }}
        className="relative flex items-center justify-center w-9 h-9 rounded-2xl backdrop-blur-md border border-white/40 transition-colors duration-300"
      >
        {/* Animated heart icon */}
        <motion.span
          key={inWishlist ? 'filled' : 'outline'}
          initial={{ scale: 0.4, rotate: -20, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 18 }}
          className="flex items-center justify-center"
        >
          <Icon
            name={inWishlist ? 'heart-filled' : 'heart'}
            className={`w-[18px] h-[18px] drop-shadow-sm ${
              inWishlist ? 'text-white fill-white' : 'text-slate-500'
            }`}
          />
        </motion.span>
      </motion.button>
    </div>
  );
};
// ──────────────────────────────────────────────────────────────────────────────


const buildResponsiveImage = (url: string, width: number) => {
  if (!url) return url;

  if (url.includes('res.cloudinary.com')) {
    return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width},c_fill/`);
  }

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}w=${width}&auto=format`;
};

interface ProductCardProps {
  product: Product;
  onClick: (product: Product) => void;
  onQuickView?: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onWishlistToggle: (productId: string) => void;
  inWishlist: boolean;
  inCartQuantity: number;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onClick,
  onQuickView,
  onAddToCart,
  onWishlistToggle,
  inWishlist,
  inCartQuantity,
}) => {
  const isOutOfStock = product.stock <= 0;
  const reachedMaxCombo = inCartQuantity >= product.stock;
  const [cartBurst, setCartBurst] = useState(false);

  useEffect(() => {
    if (!cartBurst) return;
    const timer = window.setTimeout(() => setCartBurst(false), 700);
    return () => window.clearTimeout(timer);
  }, [cartBurst]);

  const discount = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  return (
    <motion.div 
      whileHover={{ y: -8, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="group relative flex flex-col overflow-hidden rounded-[24px] bg-white dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-lg cursor-pointer hover:border-brand-primary/30 transition-colors h-full"
      onClick={() => onClick(product)}
    >
      {/* Image area — fills tile */}
      <div className="relative aspect-square overflow-hidden">
        {product.images?.[0] ? (
          <img 
            src={buildResponsiveImage(product.images[0], 560)}
            srcSet={`${buildResponsiveImage(product.images[0], 320)} 320w, ${buildResponsiveImage(product.images[0], 560)} 560w, ${buildResponsiveImage(product.images[0], 800)} 800w`}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px" 
            alt={product.name} 
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
          />
        ) : (
          <img 
            src="https://i.imgur.com/Q3YiHXt.jpeg" 
            alt="Placeholder" 
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
          />
        )}

        {/* Sold Out overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center">
            <span className="bg-white text-slate-900 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-2xl shadow-black/50">
              Sold Out
            </span>
          </div>
        )}

        {/* Discount badge */}
        {discount && !isOutOfStock && (
          <span className="absolute top-3 right-3 bg-gradient-to-r from-emerald-400 to-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-xl shadow-lg shadow-emerald-500/30 border border-emerald-400/50">
            -{discount}%
          </span>
        )}

        {/* Wishlist / Love button — glassmorphic */}
        <WishlistButton
          inWishlist={inWishlist}
          onToggle={(e) => {
            e.stopPropagation();
            onWishlistToggle(product.id);
          }}
        />
      </div>
      
      {/* Content */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="text-sm font-black text-slate-900 dark:text-white line-clamp-2 leading-snug mb-1.5 group-hover:text-brand-primary transition-colors">
          {product.name}
        </h3>

        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 flex-1 mb-4 leading-relaxed font-medium">
          {product.description}
        </p>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-4 bg-slate-50 dark:bg-slate-800/50 w-fit px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-800">
          <Icon name="star" className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {product.ratingAvg ? product.ratingAvg.toFixed(1) : 'New'}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">({product.reviewCount || 0})</span>
        </div>

        {/* Price row + CTA */}
        <div className="flex items-center justify-between gap-2 mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/50">
          <div className="min-w-0 flex-1">
            <div className="flex flex-col">
              {product.originalPrice && product.originalPrice > product.price ? (
                <span className="text-[10px] text-slate-400 line-through font-bold mb-0.5">
                  ₹{product.originalPrice.toLocaleString()}
                </span>
              ) : <span className="h-[15px]" />}
              <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white whitespace-nowrap leading-none group-hover:text-brand-primary transition-colors">
                ₹{product.price.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onQuickView) {
                  onQuickView(product);
                  return;
                }
                onClick(product);
              }}
              className="p-1.5 text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10 dark:hover:bg-brand-primary/20 rounded-lg transition-all"
              aria-label="Quick view"
              title="Quick view"
            >
              <Icon name="eye" className="w-4 h-4" />
            </button>
          </div>
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              setCartBurst(true);
              onAddToCart(product);
            }}
            whileTap={{ scale: 0.9 }}
            disabled={isOutOfStock || reachedMaxCombo}
            aria-label={`Add ${product.name} to cart`}
            className="relative overflow-hidden shrink-0 flex items-center justify-center gap-1 rounded-[14px] bg-slate-100 dark:bg-slate-800 w-11 h-11 text-slate-900 dark:text-white transition-all group-hover:bg-brand-primary group-hover:text-white group-hover:shadow-[0_8px_20px_-6px_rgba(43,131,198,0.6)] disabled:pointer-events-none disabled:opacity-40"
          >
            <AnimatePresence>
              {cartBurst && (
                <>
                  <motion.span
                    initial={{ scale: 0.2, opacity: 0.5 }}
                    animate={{ scale: 1.9, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.55, ease: 'easeOut' }}
                    className="absolute inset-0 rounded-[14px] bg-brand-primary/40"
                  />
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={`dot-${i}`}
                      initial={{ opacity: 0, scale: 0.4, x: 0, y: 0 }}
                      animate={{
                        opacity: [0, 1, 0],
                        scale: [0.5, 1, 0.7],
                        x: i === 0 ? -12 : i === 1 ? 0 : 12,
                        y: -14,
                      }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.04 }}
                      className="absolute w-1.5 h-1.5 rounded-full bg-white/90"
                    />
                  ))}
                </>
              )}
            </AnimatePresence>
            {inCartQuantity > 0 ? (
              <>
                <Icon name="check" className="w-4 h-4 text-emerald-500 shrink-0 group-hover:text-white" aria-hidden="true" />
                <span className="text-xs font-black leading-none text-emerald-600 group-hover:text-white">{inCartQuantity}</span>
              </>
            ) : (
              <Icon name="shopping-cart" className="w-4.5 h-4.5 shrink-0" aria-hidden="true" />
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default memo(ProductCard);
