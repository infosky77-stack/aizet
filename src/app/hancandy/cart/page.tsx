'use client';

// 한캔디 장바구니 — 범용 공유 뷰(ShopCartView). 주문은 shop_orders에 영속 저장되고
// /admin/shop/orders에서 관리된다(기존 데모의 화면상 완료 처리를 대체).
import { ShopCartView } from '@/components/shop/ShopCartView';

export default function HancandyCartPage() {
  return <ShopCartView slug="hancandy" basePath="/hancandy" showHeader={false} />;
}
