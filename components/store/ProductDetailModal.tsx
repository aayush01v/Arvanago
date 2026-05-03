import React, { useEffect, useState } from 'react';
import { Product, ProductReview } from '@/types';
import { db } from '@/services/firebase';
import Icon from '@/components/common/Icon';
import { useStoreCart } from '@/hooks/useStoreCart';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose }) => {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const { addToCart, cart } = useStoreCart();

  const inCartQuantity = cart.find(item => item.product.id === product.id)?.quantity || 0;
  const isOutOfStock = product.stock <= 0;
  const reachedMaxCombo = inCartQuantity >= product.stock;

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const snap = await db.collection('products').doc(product.id).collection('reviews').orderBy('timestamp', 'desc').get();
        setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() } as ProductReview)));
      } catch (e) {
        console.error("Failed to load reviews", e);
      } finally {
        setLoadingReviews(false);
      }
    };
    fetchReviews();
  }, [product.id]);

  return (
    <AnimatePresence>
      <div 
         className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md"
         onClick={onClose}
      >
        <motion.div 
           initial={{ opacity: 0, scale: 0.95, y: 20 }}
           animate={{ opacity: 1, scale: 1, y: 0 }}
           exit={{ opacity: 0, scale: 0.95, y: 20 }}
           onClick={(e) => e.stopPropagation()}
           className="relative w-full max-w-5xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden border border-slate-200 dark:border-slate-800"
        >
          {/* Main Image Section */}
          <div className="w-full md:w-1/2 bg-slate-100 dark:bg-slate-800 relative">
             {product.images?.[0] ? (
                 <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
             ) : (
                 <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                    <Icon name="image" className="w-24 h-24" />
                 </div>
             )}
             
             <button onClick={onClose} className="absolute top-4 left-4 p-2 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md transition-colors text-slate-900 md:hidden">
                <Icon name="x" className="w-6 h-6" />
             </button>
          </div>

          {/* Details & Reviews Section */}
          <div className="w-full md:w-1/2 flex flex-col max-h-[50vh] md:max-h-none overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900">
             <div className="p-6 md:p-8 flex-1">
                 <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                           <span className="text-xs font-bold uppercase tracking-wider text-brand-primary bg-brand-primary/10 px-2 py-1 rounded">
                             {product.type}
                           </span>
                           {product.category && (
                               <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                 {product.category}
                               </span>
                           )}
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-tight">
                           {product.name}
                        </h2>
                    </div>
                    <button onClick={onClose} className="hidden md:flex p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500">
                        <Icon name="x" className="w-6 h-6" />
                    </button>
                 </div>

                 <div className="mt-4 flex items-end gap-3 border-b border-slate-100 dark:border-slate-800 pb-6">
                     <span className="text-4xl font-black text-brand-primary">₹{product.price}</span>
                     {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-lg text-slate-400 line-through mb-1">₹{product.originalPrice}</span>
                     )}
                     
                     <div className="ml-auto flex flex-col items-end">
                       <div className="flex items-center gap-1">
                          <Icon name="star" className="w-5 h-5 text-amber-400 fill-amber-400" />
                          <span className="font-bold text-slate-700 dark:text-white text-lg">
                            {product.ratingAvg ? product.ratingAvg.toFixed(1) : '5.0'}
                          </span>
                       </div>
                       <span className="text-sm text-slate-500">{product.reviewCount || 0} reviews</span>
                     </div>
                 </div>

                 <div className="mt-6">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-2">About this product</h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                      {product.description}
                    </p>
                 </div>

                 <div className="mt-10">
                    <h3 className="font-bold text-xl text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                       <Icon name="message-square" className="w-5 h-5 text-brand-primary" />
                       Customer Reviews
                    </h3>
                    
                    {/* Rating Distribution Bars */}
                    {product.ratingDistribution && (
                        <div className="mb-8 p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                            <div className="flex flex-col sm:flex-row items-center gap-6">
                                <div className="text-center sm:w-1/3">
                                    <div className="text-5xl font-black text-slate-900 dark:text-white">
                                        {product.ratingAvg ? product.ratingAvg.toFixed(1) : '5.0'}
                                    </div>
                                    <div className="flex justify-center my-2 text-amber-400">
                                        {[1,2,3,4,5].map(star => (
                                            <Icon key={star} name="star" className={`w-5 h-5 ${star <= Math.round(product.ratingAvg || 5) ? 'fill-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                                        ))}
                                    </div>
                                    <div className="text-sm font-medium text-slate-500">{product.reviewCount || 0} Ratings</div>
                                </div>
                                <div className="flex-1 w-full space-y-2.5">
                                    {[5,4,3,2,1].map(stars => {
                                        const count = product.ratingDistribution![stars as keyof typeof product.ratingDistribution] || 0;
                                        // Some override distributions might be out of sync with total count, but we use the distribution itself for relative bars
                                        const total = Object.values(product.ratingDistribution!).reduce((a,b) => a+b, 0);
                                        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                                        return (
                                            <div key={stars} className="flex items-center gap-3 text-sm">
                                                <span className="w-14 items-center gap-1 font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap flex">
                                                    {stars} <Icon name="star" className="w-3.5 h-3.5 fill-slate-400 text-slate-400"/>
                                                </span>
                                                <div className="flex-1 h-3 bg-slate-200 dark:bg-slate-700/50 rounded-full overflow-hidden shadow-inner">
                                                    <div className="h-full bg-amber-400 rounded-full transition-all duration-1000 ease-out" style={{ width: `${percentage}%` }} />
                                                </div>
                                                <span className="w-9 text-right font-semibold text-slate-500 text-xs">{percentage}%</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {loadingReviews ? (
                         <div className="animate-pulse space-y-4">
                            {[1,2].map(n => <div key={n} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl" />)}
                         </div>
                    ) : reviews.length === 0 ? (
                         <div className="text-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                             <p className="text-slate-500 italic">No reviews yet. Be the first to grab this item!</p>
                         </div>
                    ) : (
                         <div className="space-y-4">
                             {reviews.map(review => (
                                 <div key={review.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                     <div className="flex justify-between items-start mb-2">
                                         <div>
                                            <span className="font-bold text-slate-900 dark:text-white block">{review.authorName}</span>
                                            {review.isVerifiedPurchase && <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider">Verified Purchase</span>}
                                         </div>
                                         <div className="flex">
                                             {[1,2,3,4,5].map(star => (
                                                 <Icon key={star} name="star" className={`w-4 h-4 ${star <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                                             ))}
                                         </div>
                                     </div>
                                     <p className="text-slate-600 dark:text-slate-300 text-sm mt-2">{review.comment}</p>
                                 </div>
                             ))}
                         </div>
                    )}
                 </div>
                 
                 {/* Bottom spacing for fixed button on mobile */}
                 <div className="h-24 md:h-8" />
             </div>

             {/* Action Bar */}
             <div className="sticky bottom-0 md:relative w-full p-4 md:p-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 mt-auto shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center gap-4">
                      {/* Quantity display / stock warning */}
                      <div className="hidden sm:block">
                         {isOutOfStock ? (
                             <span className="text-red-500 font-bold bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg border border-red-100 dark:border-red-900/50">Out of Stock</span>
                         ) : (
                             <span className="text-sm text-slate-500 font-medium">Only {product.stock} left</span>
                         )}
                      </div>

                      <button
                         onClick={() => addToCart(product)}
                         disabled={isOutOfStock || reachedMaxCombo}
                         className="flex-1 py-4 px-6 rounded-2xl font-black text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20 disabled:opacity-50 disabled:pointer-events-none"
                      >
                         {inCartQuantity > 0 ? (
                           <>
                             <Icon name="check-circle" className="w-5 h-5" /> 
                             {inCartQuantity} in Cart - Add More
                           </>
                         ) : (
                           <>
                             <Icon name="shopping-cart" className="w-5 h-5" /> 
                             {isOutOfStock ? 'Sold Out' : 'Add to Cart'}
                           </>
                         )}
                      </button>
                  </div>
             </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ProductDetailModal;
