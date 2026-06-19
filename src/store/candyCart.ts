import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CandyProduct } from '@/lib/hancandy/products';

export interface CandyCartItem {
  product: CandyProduct;
  quantity: number;
}

interface CandyCartStore {
  items: CandyCartItem[];
  addItem: (product: CandyProduct) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  total: () => number;
  itemCount: () => number;
}

export const useCandyCart = create<CandyCartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => {
        const existing = get().items.find(i => i.product.id === product.id);
        if (existing) {
          set(s => ({
            items: s.items.map(i =>
              i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          }));
        } else {
          set(s => ({ items: [...s.items, { product, quantity: 1 }] }));
        }
      },
      removeItem: (id) => set(s => ({ items: s.items.filter(i => i.product.id !== id) })),
      updateQuantity: (id, qty) =>
        set(s => ({
          items: qty <= 0
            ? s.items.filter(i => i.product.id !== id)
            : s.items.map(i => i.product.id === id ? { ...i, quantity: qty } : i),
        })),
      clearCart: () => set({ items: [] }),
      total: () => get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'hancandy-cart' }
  )
);
