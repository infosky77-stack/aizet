// 쇼핑몰 장바구니 — 상점(slug)별로 분리된 zustand 스토어.
// 기존 candyCart가 단일 매장 전제였던 것과 달리, 여기는 carts[slug]로 격리해
// 한 브라우저에서 여러 회원 상점을 오가도 장바구니가 섞이지 않는다.
// 항목의 name/price는 담은 시점 스냅샷 — 서버 주문 생성 시 어차피 서버 가격으로
// 재검증하므로(신뢰 안 함) 표시용일 뿐이다.

import { create } from 'zustand';

export interface ShopCartItem {
  productId:     string;
  name:          string;
  price:         number;
  thumbnailPath: string | null;
  qty:           number;
}

interface ShopCartStore {
  carts: Record<string, ShopCartItem[]>;
  addItem:    (slug: string, item: Omit<ShopCartItem, 'qty'>, qty?: number) => void;
  updateQty:  (slug: string, productId: string, qty: number) => void;
  removeItem: (slug: string, productId: string) => void;
  clear:      (slug: string) => void;
}

export const useShopCart = create<ShopCartStore>((set) => ({
  carts: {},
  addItem: (slug, item, qty = 1) => set((s) => {
    const items = s.carts[slug] ?? [];
    const existing = items.find((i) => i.productId === item.productId);
    const next = existing
      ? items.map((i) => (i.productId === item.productId ? { ...i, qty: Math.min(99, i.qty + qty) } : i))
      : [...items, { ...item, qty: Math.max(1, Math.min(99, qty)) }];
    return { carts: { ...s.carts, [slug]: next } };
  }),
  updateQty: (slug, productId, qty) => set((s) => ({
    carts: {
      ...s.carts,
      [slug]: (s.carts[slug] ?? []).map((i) =>
        i.productId === productId ? { ...i, qty: Math.max(1, Math.min(99, qty)) } : i),
    },
  })),
  removeItem: (slug, productId) => set((s) => ({
    carts: { ...s.carts, [slug]: (s.carts[slug] ?? []).filter((i) => i.productId !== productId) },
  })),
  clear: (slug) => set((s) => ({ carts: { ...s.carts, [slug]: [] } })),
}));

export function useCartItems(slug: string): ShopCartItem[] {
  return useShopCart((s) => s.carts[slug]) ?? [];
}

export function cartTotal(items: ShopCartItem[]): number {
  return items.reduce((sum, i) => sum + i.price * i.qty, 0);
}
