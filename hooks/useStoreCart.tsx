import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Product, CartItem } from '@/types';
import { safeLocalStorage } from '@/utils/safeStorage';

interface StoreCartContextType {
  cart: CartItem[];
  wishlist: string[];
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (productId: string) => void;
  addToCart: (product: Product, quantity?: number, selectedVariant?: {label: string, price: number}) => void;
  removeFromCart: (productId: string, variantLabel?: string) => void;
  updateQuantity: (productId: string, variantLabel: string | undefined, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setCartOpen: (isOpen: boolean) => void;
  cartTotal: number;
  cartItemCount: number;
}

const StoreCartContext = createContext<StoreCartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'edusimulate_store_cart';
const WISHLIST_STORAGE_KEY = 'edusimulate_store_wishlist';

export const StoreCartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isCartOpen, setCartOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Load cart
    const savedCart = safeLocalStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart storage', e);
      }
    }
    // Load wishlist
    const savedWishlist = safeLocalStorage.getItem(WISHLIST_STORAGE_KEY);
    if (savedWishlist) {
      try {
        setWishlist(JSON.parse(savedWishlist));
      } catch (e) {
        console.error('Failed to parse wishlist storage', e);
      }
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      safeLocalStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    }
  }, [cart, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      safeLocalStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
    }
  }, [wishlist, isInitialized]);

  const addToCart = (product: Product, quantity = 1, selectedVariant?: {label: string, price: number}) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id && item.selectedVariant?.label === selectedVariant?.label);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id && item.selectedVariant?.label === selectedVariant?.label
            ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock) }
            : item
        );
      }
      return [...prev, { product, quantity: Math.min(quantity, product.stock), selectedVariant }];
    });
    setCartOpen(true);
  };

  const removeFromCart = (productId: string, variantLabel?: string) => {
    setCart((prev) => prev.filter((item) => !(item.product.id === productId && item.selectedVariant?.label === variantLabel)));
  };

  const updateQuantity = (productId: string, variantLabel: string | undefined, quantity: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId && item.selectedVariant?.label === variantLabel) {
          const newQty = Math.max(1, Math.min(quantity, item.product.stock));
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const clearCart = () => setCart([]);

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  const toggleWishlist = (productId: string) => {
    setWishlist(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + (item.selectedVariant ? item.selectedVariant.price : item.product.price) * item.quantity, 0);
  }, [cart]);

  const cartItemCount = useMemo(() => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  }, [cart]);

  return (
    <StoreCartContext.Provider
      value={{
        cart,
        wishlist,
        isInWishlist,
        toggleWishlist,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setCartOpen,
        cartTotal,
        cartItemCount,
      }}
    >
      {children}
    </StoreCartContext.Provider>
  );
};

export const useStoreCart = () => {
  const context = useContext(StoreCartContext);
  if (context === undefined) {
    throw new Error('useStoreCart must be used within a StoreCartProvider');
  }
  return context;
};
