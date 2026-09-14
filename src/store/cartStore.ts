import { create } from 'zustand';
import type { Product } from '../types/product';
import type { CartItem } from '../types/order';

export type { CartItem };

export type CartTab = 'sale' | 'rental';

interface CartStoreState {
  items: CartItem[];
  promoCode: string;
  discountPercentage: number;
  
  // Adding & Modifying Items
  addItem: (
    product: Product, 
    quantity?: number, 
    startDate?: string, 
    endDate?: string, 
    daysCount?: number
  ) => void;
  addToCart: (
    product: Product, 
    quantity?: number, 
    rentalDays?: number, 
    startDate?: string, 
    endDate?: string
  ) => void;
  removeItem: (productId: string) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateRentalDays: (productId: string, days: number) => void;

  // Promo Code
  applyPromoCode: (code: string) => boolean;
  removePromoCode: () => void;

  // Cart Clearing
  clearCart: () => void;
  clearSaleCart: () => void;
  clearRentalCart: () => void;

  // Filtered Items
  getSaleItems: () => CartItem[];
  getRentalItems: () => CartItem[];

  // Financial Calculations
  getSubtotal: (type?: 'all' | 'sale' | 'rental') => number;
  getDiscountAmount: (type?: 'all' | 'sale' | 'rental') => number;
  getTaxAmount: (type?: 'all' | 'sale' | 'rental') => number;
  getShippingFee: (type?: 'all' | 'sale' | 'rental') => number;
  getSecurityDeposit: (type?: 'all' | 'sale' | 'rental') => number;
  getTotal: (type?: 'all' | 'sale' | 'rental') => number;

  // Legacy Aliases
  getTotalPrice: () => number;
  getTotalCount: () => number;
}

const STORAGE_KEY = '@camcrew_cart';

const loadSavedCart = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to load cart from localStorage:', err);
    return [];
  }
};

const persistCart = (items: CartItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn('Failed to persist cart to localStorage:', err);
  }
};

export const useCartStore = create<CartStoreState>((set, get) => ({
  items: loadSavedCart(),
  promoCode: '',
  discountPercentage: 0,

  addItem: (product, quantity = 1, startDate, endDate, daysCount = 1) => {
    const items = [...get().items];
    const existingIndex = items.findIndex(i => i.product.id === product.id);

    if (existingIndex > -1) {
      items[existingIndex].quantity += quantity;
      if (startDate) items[existingIndex].startDate = startDate;
      if (endDate) items[existingIndex].endDate = endDate;
      if (daysCount) items[existingIndex].daysCount = daysCount;
    } else {
      items.push({ 
        product, 
        quantity, 
        startDate, 
        endDate, 
        daysCount 
      });
    }

    set({ items });
    persistCart(items);
  },

  addToCart: (product, quantity = 1, rentalDays = 1, startDate, endDate) => {
    get().addItem(product, quantity, startDate, endDate, rentalDays);
  },

  removeItem: (productId) => {
    const items = get().items.filter(i => i.product.id !== productId);
    set({ items });
    persistCart(items);
  },

  removeFromCart: (productId) => {
    get().removeItem(productId);
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    const items = get().items.map(i => 
      i.product.id === productId ? { ...i, quantity } : i
    );
    set({ items });
    persistCart(items);
  },

  updateRentalDays: (productId, days) => {
    const safeDays = Math.max(1, days);
    const items = get().items.map(i => 
      i.product.id === productId 
        ? { ...i, daysCount: safeDays } 
        : i
    );
    set({ items });
    persistCart(items);
  },

  applyPromoCode: (code) => {
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode === 'CAMCREW10') {
      set({ promoCode: cleanCode, discountPercentage: 10 });
      return true;
    } else if (cleanCode === 'PROPROMO20') {
      set({ promoCode: cleanCode, discountPercentage: 20 });
      return true;
    }
    return false;
  },

  removePromoCode: () => {
    set({ promoCode: '', discountPercentage: 0 });
  },

  clearCart: () => {
    set({ items: [], promoCode: '', discountPercentage: 0 });
    persistCart([]);
  },

  clearSaleCart: () => {
    const items = get().items.filter(i => i.product.type === 'rental');
    set({ items });
    persistCart(items);
  },

  clearRentalCart: () => {
    const items = get().items.filter(i => i.product.type !== 'rental');
    set({ items });
    persistCart(items);
  },

  getSaleItems: () => {
    return get().items.filter(i => i.product.type !== 'rental');
  },

  getRentalItems: () => {
    return get().items.filter(i => i.product.type === 'rental');
  },

  getSubtotal: (type = 'all') => {
    let targetItems = get().items;
    if (type === 'sale') targetItems = get().getSaleItems();
    if (type === 'rental') targetItems = get().getRentalItems();

    return targetItems.reduce((acc, item) => {
      if (item.product.type === 'rental') {
        const dailyRate = item.product.rentalPricePerDay || item.product.price;
        const days = item.daysCount || 1;
        return acc + (dailyRate * days * item.quantity);
      }
      return acc + (item.product.price * item.quantity);
    }, 0);
  },

  getDiscountAmount: (type = 'all') => {
    const subtotal = get().getSubtotal(type);
    return (subtotal * get().discountPercentage) / 100;
  },

  getTaxAmount: (type = 'all') => {
    const subtotal = get().getSubtotal(type);
    const discount = get().getDiscountAmount(type);
    return Math.round((subtotal - discount) * 0.18); // 18% GST in India
  },

  getShippingFee: (type = 'all') => {
    if (type === 'rental') return 0;
    const saleSub = get().getSubtotal('sale');
    return saleSub > 0 ? 150 : 0;
  },

  getSecurityDeposit: (type = 'all') => {
    if (type === 'sale') return 0;
    const rentalItems = get().getRentalItems();
    return rentalItems.length > 0 ? 5000 : 0;
  },

  getTotal: (type = 'all') => {
    const subtotal = get().getSubtotal(type);
    if (subtotal === 0) return 0;

    const discount = get().getDiscountAmount(type);
    const tax = get().getTaxAmount(type);
    const shipping = get().getShippingFee(type);
    const deposit = get().getSecurityDeposit(type);

    return subtotal - discount + tax + shipping + deposit;
  },

  getTotalPrice: () => {
    return get().getTotal('all');
  },

  getTotalCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
