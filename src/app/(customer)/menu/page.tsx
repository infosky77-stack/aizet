'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import { MenuCard } from '@/components/menu/MenuCard';
import { CategoryFilter } from '@/components/menu/CategoryFilter';
import { CartDrawer } from '@/components/menu/CartDrawer';
import { AiRecommendBanner } from '@/components/menu/AiRecommendBanner';
import { MenuItem, MenuCategory } from '@/types/menu';
import { ShoppingCart, UtensilsCrossed, MessageSquare, CalendarClock, Truck, ArrowLeft } from 'lucide-react';

export default function MenuPage() {
  const router = useRouter();
  const { tableNumber, orderType, deliveryAddress, items } = useCartStore();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [category, setCategory] = useState<'all' | MenuCategory>('all');
  const [cartOpen, setCartOpen] = useState(false);

  const cartCount = items.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = useCartStore((s) => s.total);

  useEffect(() => {
    const isDineIn = orderType === 'dine-in' && !!tableNumber;
    const isDelivery = orderType === 'delivery' && !!deliveryAddress;
    if (!isDineIn && !isDelivery) {
      router.replace('/demo');
      return;
    }
    fetch('/api/menu')
      .then((r) => r.json())
      .then((data) => setMenuItems(data.items ?? []));
  }, [tableNumber, deliveryAddress, orderType, router]);

  const filtered = useMemo(
    () => category === 'all' ? menuItems : menuItems.filter((i) => i.category === category),
    [menuItems, category]
  );

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-stone-100">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/demo')}
              className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center transition-colors"
            >
              <ArrowLeft size={18} className="text-stone-600" />
            </button>
            <UtensilsCrossed size={20} className="text-amber-600" />
            <span className="font-bold text-amber-800 tracking-tight">중화가정</span>
            {orderType === 'delivery' ? (
              <span className="text-xs text-stone-400 ml-1 flex items-center gap-1">
                <Truck size={11} />
                배달
              </span>
            ) : (
              <span className="text-xs text-stone-400 ml-1">테이블 {tableNumber}번</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/reservation')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-stone-200 text-stone-600 hover:border-amber-400 text-xs font-medium transition-colors"
            >
              <CalendarClock size={13} />
              예약
            </button>
            <button
              onClick={() => router.push('/chat')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-stone-200 text-stone-600 hover:border-amber-400 text-xs font-medium transition-colors"
            >
              <MessageSquare size={13} />
              AI 주문
            </button>
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium transition-colors"
            >
              <ShoppingCart size={13} />
              장바구니
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-4 flex flex-col gap-4">
        {/* AI Recommend */}
        <AiRecommendBanner />

        {/* Category Filter */}
        <CategoryFilter selected={category} onChange={setCategory} />

        {/* Menu Grid */}
        {filtered.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-stone-400 text-sm py-20">
            메뉴를 불러오는 중...
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 pb-24">
            {filtered.map((item) => (
              <MenuCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>

      {/* Floating cart button (mobile) */}
      {cartCount > 0 && !cartOpen && (
        <div className="fixed bottom-6 left-0 right-0 px-4 z-30 max-w-2xl mx-auto">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-2xl shadow-xl flex items-center justify-between px-5 transition-colors"
          >
            <span className="bg-white/20 text-white text-sm font-bold rounded-full w-7 h-7 flex items-center justify-center">
              {cartCount}
            </span>
            <span>장바구니 보기</span>
            <span className="font-bold">
              {cartTotal().toLocaleString()}원
            </span>
          </button>
        </div>
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
