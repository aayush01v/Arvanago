import React from 'react';
import Icon from '@/components/common/Icon';

const StoreTrustBar: React.FC = () => {
  return (
    <div className="bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-100 dark:border-emerald-800/50 py-2 hidden sm:block">
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-center sm:justify-between flex-wrap gap-4 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
        <div className="flex items-center gap-1.5">
          <Icon name="shield-check" className="w-4 h-4" /> 100% Genuine Products
        </div>
        <div className="flex items-center gap-1.5">
          <Icon name="refresh-cw" className="w-4 h-4" /> 30-Day Return Policy
        </div>
        <div className="flex items-center gap-1.5">
          <Icon name="lock" className="w-4 h-4" /> Secure Payments
        </div>
        <div className="flex items-center gap-1.5">
          <Icon name="truck" className="w-4 h-4" /> Fast Delivery
        </div>
        <div className="flex items-center gap-1.5">
          <Icon name="credit-card" className="w-4 h-4" /> COD Available
        </div>
      </div>
    </div>
  );
};

export default StoreTrustBar;
