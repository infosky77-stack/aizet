'use client';

// 구매자 장바구니 — 얇은 래퍼(본체는 ShopCartView, 한캔디와 공유).
import { useParams } from 'next/navigation';
import { ShopCartView } from '@/components/shop/ShopCartView';

export default function ShopCartPage() {
  const { slug } = useParams<{ slug: string }>();
  return <ShopCartView slug={slug} />;
}
