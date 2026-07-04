'use client';

// 상세페이지 하단 고정 구매 바 — 쿠팡 관례(가격 + 장바구니 + 바로구매).
// 스크롤과 무관하게 항상 보이는 구매 진입점. "바로구매"는 담고 장바구니로 이동.
import { useRouter } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';
import { useShopCart } from '@/store/shopCart';
import { formatPrice } from '@/lib/shop/types';

interface Props {
  slug: string;
  product: { id: string; name: string; price: number; thumbnail_path: string | null };
  /** URL 접두(기본 /site/{slug}/shop) — 한캔디처럼 자체 경로를 가진 상점용 */
  basePath?: string;
}

export function BuyBar({ slug, product, basePath }: Props) {
  const base    = basePath ?? `/site/${slug}/shop`;
  const router  = useRouter();
  const addItem = useShopCart((s) => s.addItem);

  function toCartItem() {
    return {
      productId: product.id, name: product.name,
      price: product.price, thumbnailPath: product.thumbnail_path,
    };
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-stone-200 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
        <span className="text-lg font-black text-stone-900 shrink-0">{formatPrice(product.price)}</span>
        <div className="flex-1" />
        <button
          onClick={() => addItem(slug, toCartItem())}
          className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors"
        >
          <ShoppingCart size={15} /> 장바구니
        </button>
        <button
          onClick={() => { addItem(slug, toCartItem()); router.push(`${base}/cart`); }}
          className="px-5 py-2.5 text-sm font-bold rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors"
        >
          바로구매
        </button>
      </div>
    </div>
  );
}
