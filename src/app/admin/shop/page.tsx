'use client';

// 판매자 쇼핑몰 — 상품 목록 (셀러센터 스타일).
// 행 클릭 → 상품 편집(/admin/shop/products/[id]). "새 상품"은 생성 API가
// 슈퍼에디터 product 콘텐츠까지 만들어 연결하므로 여기서는 POST 한 번이면 된다.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package, Plus, Loader2, Star, FileImage, ClipboardList } from 'lucide-react';
import { clsx } from 'clsx';
import {
  PRODUCT_STATUS_LABELS, formatPrice, discountRate,
  type ProductRow, type ProductStatus,
} from '@/lib/shop/types';

const STATUS_BADGE: Record<ProductStatus, string> = {
  draft:  'bg-stone-100 text-stone-500',
  active: 'bg-emerald-100 text-emerald-700',
  hidden: 'bg-amber-100 text-amber-700',
};

export default function ShopProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductRow[] | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch('/api/admin/shop/products')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setProducts(data?.products ?? []));
  }, []);

  async function handleCreate() {
    if (creating) return;
    setCreating(true);
    const res = await fetch('/api/admin/shop/products', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
    }).catch(() => null);
    if (res?.ok) {
      const { product } = await res.json();
      router.push(`/admin/shop/products/${product.id}`);
    } else {
      setCreating(false);
      alert('상품 생성에 실패했습니다.');
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-800">쇼핑몰 상품 관리</h1>
          <p className="text-sm text-stone-400 mt-0.5">
            상품을 등록하고 슈퍼에디터로 상세페이지를 만들어 판매하세요
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/shop/orders"
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border border-stone-200 text-stone-600 hover:border-violet-300 hover:text-violet-700 transition-colors"
          >
            <ClipboardList size={15} /> 주문 관리 · 정산
          </Link>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white transition-colors"
          >
            {creating ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            새 상품
          </button>
        </div>
      </div>

      {products === null ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-stone-300" /></div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-stone-400 bg-white border border-stone-200 rounded-2xl">
          <Package size={32} className="opacity-30" />
          <p className="text-sm">등록된 상품이 없습니다. &quot;새 상품&quot;으로 시작하세요.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {products.map((p) => {
            const rate = discountRate(p.price, p.original_price);
            return (
              <button
                key={p.id}
                onClick={() => router.push(`/admin/shop/products/${p.id}`)}
                className="flex items-center gap-4 bg-white border border-stone-200 hover:border-violet-300 rounded-2xl px-4 py-3 text-left transition-colors"
              >
                <div className="w-14 h-14 rounded-xl bg-stone-100 flex items-center justify-center overflow-hidden shrink-0">
                  {p.thumbnail_path ? (
                    // 공개 사본(발행 시 복사) — blob/원장 아님
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.thumbnail_path} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Package size={18} className="text-stone-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-stone-800 text-sm truncate">{p.name || '이름 없음'}</p>
                  <p className="text-xs text-stone-400 mt-0.5 flex items-center gap-2">
                    <span className="font-bold text-stone-700">{formatPrice(p.price)}</span>
                    {rate !== null && <span className="text-red-500 font-bold">{rate}%</span>}
                    {(p.review_count ?? 0) > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Star size={11} className="fill-amber-400 text-amber-400" />
                        {p.avg_rating} ({p.review_count})
                      </span>
                    )}
                  </p>
                </div>
                {p.detail_image_path && (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 shrink-0">
                    <FileImage size={12} /> 상세페이지
                  </span>
                )}
                <span className={clsx('px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0', STATUS_BADGE[p.status])}>
                  {PRODUCT_STATUS_LABELS[p.status]}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
