import { create } from 'zustand';
import { MenuItem } from '@/types/menu';

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  specialRequest?: string;
}

interface CartStore {
  tableNumber: number | null;
  items: CartItem[];
  setTable: (n: number) => void;
  addItem: (item: MenuItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  total: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  tableNumber: null,
  items: [],
  setTable: (n) => set({ tableNumber: n }),
  addItem: (menuItem) => {
    const existing = get().items.find((i) => i.menuItem.id === menuItem.id);
    if (existing) {
      set((s) => ({
        items: s.items.map((i) =>
          i.menuItem.id === menuItem.id ? { ...i, quantity: i.quantity + 1 } : i
        ),
      }));
    } else {
      set((s) => ({ items: [...s.items, { menuItem, quantity: 1 }] }));
    }
  },
  removeItem: (id) =>
    set((s) => ({ items: s.items.filter((i) => i.menuItem.id !== id) })),
  updateQuantity: (id, qty) =>
    set((s) => ({
      items: qty <= 0
        ? s.items.filter((i) => i.menuItem.id !== id)
        : s.items.map((i) => (i.menuItem.id === id ? { ...i, quantity: qty } : i)),
    })),
  clearCart: () => set({ items: [] }),
  total: () =>
    get().items.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0),
}));
