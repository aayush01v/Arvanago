import React, { useEffect, useState } from 'react';
import { Product } from '@/types';
import Icon from '@/components/common/Icon';
import { useStoreCart } from '@/hooks/useStoreCart';
import { motion } from 'framer-motion';

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onViewDetails: () => void;
}

const QuickViewModal: React.FC<QuickViewModalProps> = ({ 
  product, 
  isOpen, 
  onClose, 
  onViewDetails 
}) => {
  if (!product) return null;

  const [avgRating] = useState(product.ratingAvg || 0);
  const [reviewCount] = useState(product.reviewCount || 0);
  const { addToCart, cart, isInWishlist, toggleWishlist } = useStoreCart();
  
  const inCartQuantity = cart.find(item => item.product.id === product.id)?.quantity || 0;
  const isOutOfStock = product.stock <= 0;
  const inWishlist = isInWishlist(product.id);

  const discount = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quickview-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-md max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200/50 dark:border-slate-800/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image Gallery */}
        <div className="relative h-64 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 overflow-hidden">
          {product.images?.[0] ? (
            <img 
              src={product.images[0]} 
              alt={product.name}
              className="w-full h-full object-contain p-6"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <Icon name="image" className="w-16 h-16" />
            </div>
          )}
          
          {/* Actions overlay */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={handleWishlistToggle}
              className="p-2.5 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 rounded-2xl backdrop-blur-sm shadow-lg transition-all border border-slate-200/50 dark:border-slate-700/50 hover:scale-110 active:scale-95"
              aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Icon 
                name={inWishlist ? 'heart' : 'heart-outline'} 
                className={`w-5 h-5 ${inWishlist ? 'text-red-500 fill-red-500' : 'text-slate-500'}`} 
              />
            </button>
            <button
              onClick={onClose}
              className="p-2.5 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 rounded-2xl backdrop-blur-sm shadow-lg transition-all border border-slate-200/50 dark:border-slate-700/50 hover:scale-110 active:scale-95"
              aria-label="Close quick view"
            >
              <Icon name="x" className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Stock badge */}
          {isOutOfStock && (
            <div className="absolute bottom-4 left-4 bg-red-500/90 text-white px-3 py-1.5 rounded-full text-xs font-black backdrop-blur-sm shadow-2xl">
              Sold Out
            </div>
          )}
          {discount && (
            <div className="absolute bottom-4 right-4 bg-emerald-500/90 text-white px-3 py-1.5 rounded-full text-xs font-black backdrop-blur-sm shadow-2xl">
              -{discount}%
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <h2 id="quickview-title" className="text-xl font-black text-slate-900 dark:text-white leading-tight">
              {product.name}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">
              {product.category} • {product.type === 'digital' ? 'Instant Access' : 'Ships in 2-3 days'}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-sm text-slate-400 line-through">₹{product.originalPrice.toLocaleString()}</span>
              )}
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                ₹{product.price.toLocaleString()}
              </div>
              {!isOutOfStock && (
                <span className="text-xs text-emerald-600 font-medium">Only {product.stock} left in stock</span>
              )}
            </div>
            
            <div className="flex items-center gap-1 text-amber-400">
              {[1,2,3,4,5].map((star) => (
                <Icon 
                  key={star} 
                  name="star" 
                  className={`w-4 h-4 ${star <= Math.round(avgRating) ? 'fill-current' : ''}`} 
                />
              ))}
              <span className="text-sm font-bold text-slate-900 dark:text-white ml-1">
                {avgRating.toFixed(1)}
              </span>
              <span className="text-xs text-slate-500">({reviewCount})</span>
            </div>
          </div>

          <div className="max-h-24 overflow-y-auto">
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="flex-1 py-3.5 px-6 rounded-2xl font-black text-white bg-gradient-to-r from-brand-primary to-blue-600 hover:from-brand-primary/90 hover:to-blue-600/90 shadow-xl shadow-brand-primary/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              {inCartQuantity > 0 ? (
                <>
                  <Icon name="check-circle" className="w-4 h-4" />
                  {inCartQuantity} in cart
                </>
              ) : isOutOfStock ? (
                'Sold Out'
              ) : (
                <>
                  <Icon name="shopping-cart" className="w-4 h-4" />
                  Add to Cart
                </>
              )}
            </button>
            <button
              onClick={onViewDetails}
              className="flex-1 py-3.5 px-4 rounded-2xl font-semibold border-2 border-slate-200 dark:border-slate-700 hover:border-brand-primary hover:text-brand-primary hover:bg-brand-primary/5 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all text-sm flex items-center justify-center gap-2"
            >
              <Icon name="zoom-in" className="w-4 h-4" />
              View Details
            </button>
          </div>

          {/* Key Features */}
          {product.features && (
            <div className="grid grid-cols-2 gap-2 pt-2">
              {product.features.slice(0, 4).map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs">
                  <Icon name="check-circle" className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-600 dark:text-slate-300">{feature}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default QuickViewModal;

