import { create } from 'zustand';
import type { CartItem, Product } from '../types';

interface POSState {
  cart: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotals: () => { subtotal: number; totalCGST: number; totalSGST: number; grandTotal: number };
}

export const usePOSStore = create<POSState>((set, get) => ({
  cart: [],
  addItem: (product) => {
    const { cart } = get();
    const existing = cart.find(item => item.product.product_id === product.product_id);
    if (existing) {
      get().updateQuantity(product.product_id, existing.quantity + 1);
    } else {
      const unitPrice = product.base_price;
      const taxRate = product.tax_rate_pct;
      const cgstAmt = (unitPrice * (taxRate / 2)) / 100;
      const sgstAmt = (unitPrice * (taxRate / 2)) / 100;
      const lineTotal = unitPrice + cgstAmt + sgstAmt;
      
      set({
        cart: [...cart, {
          product,
          quantity: 1,
          unit_price: unitPrice,
          cgst_amount: cgstAmt,
          sgst_amount: sgstAmt,
          line_total: lineTotal
        }]
      });
    }
  },
  removeItem: (productId) => {
    set({ cart: get().cart.filter(item => item.product.product_id !== productId) });
  },
  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    set({
      cart: get().cart.map(item => {
        if (item.product.product_id === productId) {
          const unitPrice = item.product.base_price;
          const taxRate = item.product.tax_rate_pct;
          const cgstAmt = (unitPrice * quantity * (taxRate / 2)) / 100;
          const sgstAmt = (unitPrice * quantity * (taxRate / 2)) / 100;
          const lineTotal = (unitPrice * quantity) + cgstAmt + sgstAmt;
          return { ...item, quantity, cgst_amount: cgstAmt, sgst_amount: sgstAmt, line_total: lineTotal };
        }
        return item;
      })
    });
  },
  clearCart: () => set({ cart: [] }),
  getTotals: () => {
    const { cart } = get();
    return cart.reduce((acc, item) => ({
      subtotal: acc.subtotal + (item.unit_price * item.quantity),
      totalCGST: acc.totalCGST + item.cgst_amount,
      totalSGST: acc.totalSGST + item.sgst_amount,
      grandTotal: acc.grandTotal + item.line_total
    }), { subtotal: 0, totalCGST: 0, totalSGST: 0, grandTotal: 0 });
  }
}));
