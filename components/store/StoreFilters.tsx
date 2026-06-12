import React, { useMemo, useState, useEffect } from 'react';
import { Product } from '@/types';
import Icon from '@/components/common/Icon';

interface StoreFiltersProps {
  products: Product[];
  searchQuery: string;
  selectedCategory: string;
  maxPrice: number;
  sortBy: 'default' | 'price-asc' | 'price-desc' | 'rating';
  onSearchChange: (q: string) => void;
  onCategoryChange: (c: string) => void;
  onMaxPriceChange: (p: number) => void;
  onSortByChange: (s: 'default' | 'price-asc' | 'price-desc' | 'rating') => void;
}

const StoreFilters: React.FC<StoreFiltersProps> = ({
  products,
  searchQuery,
  selectedCategory,
  maxPrice,
  sortBy,
  onSearchChange,
  onCategoryChange,
  onMaxPriceChange,
  onSortByChange,
}) => {
  const categories = useMemo(() => {
    const cats = products.map(p => p.category).filter(Boolean);
    return ['All', ...Array.from(new Set(cats))];
  }, [products]);

  const absoluteMax = useMemo(() => {
    if (products.length === 0) return 100000;
    return Math.max(...products.map(p => p.price), 1000);
  }, [products]);

  const absoluteMin = useMemo(() => {
    if (products.length === 0) return 0;
    return Math.min(...products.map(p => p.price));
  }, [products]);

  const isFiltered = searchQuery || selectedCategory !== 'All' || maxPrice < absoluteMax || sortBy !== 'default';

  const clearAll = () => {
    onSearchChange('');
    onCategoryChange('All');
    onMaxPriceChange(absoluteMax);
    onSortByChange('default');
  };

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDropdownOpen) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDropdownOpen]);

  return (
    <div className="mb-3 space-y-3">
      {/* Search bar row */}
      <div className="flex items-center gap-2.5 mb-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search tablets, laptops, headphones..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary text-sm transition shadow-sm"
          />
          {searchQuery && (
            <button onClick={() => onSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <Icon name="x" className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Enhanced Sort & Price Dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-between min-w-[150px] sm:min-w-[176px] gap-2 pl-3.5 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm shadow-sm hover:border-brand-primary transition"
          >
            <div className="flex items-center gap-1.5">
              <span>
                {sortBy === 'default' ? 'Sort: Featured' :
                 sortBy === 'rating' ? 'Top Rated' :
                 sortBy === 'price-asc' ? 'Low to High' :
                 'High to Low'}
              </span>
              {maxPrice < absoluteMax && <span className="w-2 h-2 rounded-full bg-brand-primary" title="Price filter active" />}
            </div>
            <Icon name={isDropdownOpen ? "chevronUp" : "chevronDown"} className="w-4 h-4 text-slate-400 shrink-0" />
          </button>

          {isDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
              <div className="absolute right-0 sm:left-auto mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden pt-2 pb-4">
                
                {/* Sort Options */}
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700 mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Sort By</span>
                  <div className="space-y-1">
                    {[
                      { id: 'default', label: 'Featured' },
                      { id: 'rating', label: 'Top Rated' },
                      { id: 'price-asc', label: 'Price: Low to High' },
                      { id: 'price-desc', label: 'Price: High to Low' }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => { onSortByChange(opt.id as any); }}
                        className={`w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors ${
                          sortBy === opt.id ? 'bg-brand-primary/10 text-brand-primary font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Ranging */}
                <div className="px-4 py-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                    <Icon name="tag" className="w-3 h-3" /> Pricing Range
                  </span>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-500">Price up to</span>
                      <span className="text-brand-primary border border-brand-primary/20 bg-brand-primary/5 px-2 py-0.5 rounded-md">
                        {maxPrice >= absoluteMax ? 'All prices' : `₹${absoluteMin.toLocaleString()} - ₹${maxPrice.toLocaleString()}`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={absoluteMin}
                      max={absoluteMax}
                      step={Math.max(1, Math.floor((absoluteMax - absoluteMin) / 100))}
                      value={maxPrice}
                      onChange={e => onMaxPriceChange(Number(e.target.value))}
                      aria-label="Filter maximum price"
                      className="w-full mt-2 accent-brand-primary h-1 cursor-pointer"
                    />
                  </div>
                </div>
                
              </div>
            </>
          )}
        </div>
      </div>

      {/* Category chips row */}
      <div className="mb-3">
        {/* Category chips */}
        <div className="flex flex-nowrap gap-2 overflow-x-auto overflow-y-hidden whitespace-nowrap pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`shrink-0 px-[14px] py-2 rounded-full text-sm font-semibold border transition-all ${
                selectedCategory === cat
                  ? 'bg-brand-primary text-white border-brand-primary shadow-md shadow-brand-primary/20'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-brand-primary/50 hover:text-brand-primary'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Active filters + Clear */}
      {isFiltered && (
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">Active filters:</span>
          <div className="flex flex-wrap gap-2">
            {searchQuery && (
              <span className="inline-flex items-center gap-1 bg-brand-primary/10 text-brand-primary text-xs px-3 py-1 rounded-full font-medium">
                "{searchQuery}"
                <button onClick={() => onSearchChange('')}><Icon name="x" className="w-3 h-3" /></button>
              </span>
            )}
            {selectedCategory !== 'All' && (
              <span className="inline-flex items-center gap-1 bg-brand-primary/10 text-brand-primary text-xs px-3 py-1 rounded-full font-medium">
                {selectedCategory}
                <button onClick={() => onCategoryChange('All')}><Icon name="x" className="w-3 h-3" /></button>
              </span>
            )}
            {maxPrice < absoluteMax && (
              <span className="inline-flex items-center gap-1 bg-brand-primary/10 text-brand-primary text-xs px-3 py-1 rounded-full font-medium">
                ≤ ₹{maxPrice.toLocaleString()}
                <button onClick={() => onMaxPriceChange(absoluteMax)}><Icon name="x" className="w-3 h-3" /></button>
              </span>
            )}
          </div>
          <button onClick={clearAll} className="ml-auto text-xs text-red-500 hover:text-red-700 font-medium hover:underline">
            Clear all
          </button>
        </div>
      )}
    </div>
  );
};

export default StoreFilters;
