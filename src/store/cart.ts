import { create } from 'zustand';
import { MenuItem } from '@/types/menu';
import { OrderType } from '@/types/order';

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  specialRequest?: string;
}

interface CartStore {
  orderType: OrderType;
  tableNumber: number | null;
  deliveryAddress: string;
  items: CartItem[];
  lastOrderId: string | null;
  setOrderType: (t: OrderType) => void;
  setTable: (n: number) => void;
  setDeliveryAddress: (addr: string) => void;
  setLastOrderId: (id: string) => void;
  addItem: (item: MenuItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  total: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  orderType: 'dine-in',
  tableNumber: null,
  deliveryAddress: '',
  items: [],
  lastOrderId: null,
  setOrderType: (orderType) => set({ orderType }),
  setTable: (n) => set({ tableNumber: n }),
  setDeliveryAddress: (deliveryAddress) => set({ deliveryAddress }),
  setLastOrderId: (id) => set({ lastOrderId: id }),
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
