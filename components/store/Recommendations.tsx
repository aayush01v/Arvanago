import React, { useState, useEffect } from 'react';
import { Product } from '@/types';
import { db } from '@/services/firebase';
import ProductCard from './ProductCard';
import Icon from '@/components/common/Icon';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { slugify } from '@/utils/slugify';

interface RecommendationsProps {
  excludeProductId?: string;
  className?: string;
}

const Recommendations: React.FC<RecommendationsProps> = ({ 
  excludeProductId, 
  className = '' 
}) => {
  const navigate = useNavigate();
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopProducts = async () => {
      try {
        const snap = await db.collection('products')
          .where('isPublished', '==', true)
          .orderBy('ratingAvg', 'desc')
          .orderBy('reviewCount', 'desc')
          .limit(10)
          .get();
        
        const products = snap.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Product)).filter(p => p.id !== excludeProductId);
        
        setTopProducts(products.slice(0, 8)); // Max 8 for carousel
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopProducts();
  }, [excludeProductId]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const visibleProducts = 4 + Math.min(window.innerWidth >= 1024 ? 1 : 0, 1); // Responsive: 4-5 items visible
  const maxIndex = Math.max(0, topProducts.length - visibleProducts);

  const goToPrev = () => setCurrentIndex((prev) => Math.max(0, prev - 1));
  const goToNext = () => setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));

  // Auto-advance
  useEffect(() => {
    if (topProducts.length <= visibleProducts) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
    }, 4000);
    return () => clearInterval(interval);
  }, [topProducts.length, visibleProducts, maxIndex]);

  if (loading) {
    return (
      <div className={`animate-pulse bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-8 ${className}`}>
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl mb-6" />
        <div className="flex gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="w-32 h-40 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (topProducts.length === 0) return null;

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`bg-gradient-to-r from-slate-50/50 to-blue-50/50 dark:from-slate-900/50 dark:to-slate-800/50 rounded-3xl p-6 md:p-8 border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-sm ${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-brand-primary to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Icon name="zap" className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
              Top Picks This Week
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Student favorites • Limited stock
            </p>
          </div>
        </div>
        
        {topProducts.length > visibleProducts && (
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrev}
              className="w-10 h-10 rounded-2xl bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 backdrop-blur-sm shadow-lg border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              aria-label="Previous recommendations"
            >
              <Icon name="chevron-left" className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
            <button
              onClick={goToNext}
              className="w-10 h-10 rounded-2xl bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 backdrop-blur-sm shadow-lg border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              aria-label="Next recommendations"
            >
              <Icon name="chevron-right" className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
          </div>
        )}
      </div>

      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="flex gap-4"
            style={{ width: '100%' }}
          >
            {topProducts.slice(currentIndex, currentIndex + visibleProducts).map((product, idx) => (
              <motion.div
                key={product.id}
                whileHover={{ y: -8 }}
                className="flex-1 min-w-0"
              >
                <ProductCard
                  product={product}
                  onClick={() => navigate(`/store/${slugify(product.name)}/${product.id}`)}
                />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Progress dots */}
        {topProducts.length > visibleProducts && (
          <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
            {Array.from({ length: Math.ceil(topProducts.length / visibleProducts) }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx * visibleProducts)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  Math.floor(currentIndex / visibleProducts) === idx
                    ? 'bg-brand-primary scale-125 shadow-md'
                    : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-4">
        {topProducts.length} top rated products • Updated live from reviews
      </p>
    </motion.section>
  );
};

export default Recommendations;

