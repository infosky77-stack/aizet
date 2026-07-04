'use client';

// 구매자 쇼핑몰 공용 헤더 — 상점명 + 장바구니 아이콘(담긴 수량 배지).
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCartItems } from '@/store/shopCart';

interface Props {
  slug:     string;
  shopName: string;
}

export function ShopHeader({ slug, shopName }: Props) {
  const items = useCartItems(slug);
  const count = items.reduce((sum, i) => sum + i.qty, 0);
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-stone-100">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href={`/site/${slug}/shop`} className="font-black text-stone-900 truncate">
          {shopName}
        </Link>
        <Link
          href={`/site/${slug}/shop/cart`}
          className="relative p-2 rounded-xl hover:bg-stone-100 text-stone-600 transition-colors"
          aria-label="장바구니"
        >
          <ShoppingCart size={20} />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {count > 99 ? '99+' : count}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
