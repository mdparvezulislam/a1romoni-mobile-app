// src/store/cartStore.ts
import { create } from "zustand";

export interface Product {
  _id: string;
  name: string;
  salePrice: number;
  stockQty: number;
}

export interface CartItem {
  product: Product;
  qty: number;
  customName?: string; // ✅ যুক্ত করা হলো
  customPrice?: number; // ✅ যুক্ত করা হলো
}

interface CartState {
  cart: CartItem[];
  totalItems: number;
  subtotal: number;
  discount: number; // ✅ ডিসকাউন্ট যুক্ত করা হলো
  finalAmount: number; // ✅ সাবটোটাল - ডিসকাউন্ট
  addToCart: (product: Product) => void;
  updateQty: (productId: string, qty: number) => void;
  updateItemDetails: (
    productId: string,
    customName: string,
    customPrice: number,
  ) => void; // ✅ এডিট সেভ করার জন্য
  removeFromCart: (productId: string) => void;
  setDiscount: (amount: number) => void; // ✅ ডিসকাউন্টের জন্য
  clearCart: () => void;
}

// কার্টের টোটাল হিসাব করার ফাংশন
const calculateTotals = (cart: CartItem[], discount: number = 0) => {
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = cart.reduce(
    (sum, item) =>
      sum + (item.customPrice ?? item.product.salePrice) * item.qty,
    0,
  );
  const finalAmount = Math.max(0, subtotal - discount);
  return { totalItems, subtotal, finalAmount };
};

export const useCartStore = create<CartState>((set, get) => ({
  cart: [],
  totalItems: 0,
  subtotal: 0,
  discount: 0,
  finalAmount: 0,

  addToCart: (product) => {
    const { cart, discount } = get();
    const existingItem = cart.find((item) => item.product._id === product._id);

    let newCart;
    if (existingItem) {
      newCart = cart.map((item) =>
        item.product._id === product._id
          ? { ...item, qty: item.qty + 1 }
          : item,
      );
    } else {
      newCart = [...cart, { product, qty: 1 }];
    }

    set({ cart: newCart, ...calculateTotals(newCart, discount) });
  },

  updateQty: (productId, qty) => {
    const { cart, discount } = get();
    if (qty < 1) return;

    const newCart = cart.map((item) =>
      item.product._id === productId ? { ...item, qty } : item,
    );
    set({ cart: newCart, ...calculateTotals(newCart, discount) });
  },

  // ✅ কাস্টম নাম এবং দর আপডেট করার ফাংশন
  updateItemDetails: (productId, customName, customPrice) => {
    const { cart, discount } = get();
    const newCart = cart.map((item) =>
      item.product._id === productId
        ? { ...item, customName, customPrice }
        : item,
    );
    set({ cart: newCart, ...calculateTotals(newCart, discount) });
  },

  removeFromCart: (productId) => {
    const { cart, discount } = get();
    const newCart = cart.filter((item) => item.product._id !== productId);
    set({ cart: newCart, ...calculateTotals(newCart, discount) });
  },

  setDiscount: (amount) => {
    const { cart } = get();
    set({ discount: amount, ...calculateTotals(cart, amount) });
  },

  clearCart: () =>
    set({ cart: [], totalItems: 0, subtotal: 0, discount: 0, finalAmount: 0 }),
}));
