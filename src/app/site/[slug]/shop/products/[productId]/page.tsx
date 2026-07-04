// 구매자 상품 상세 — 상단 요약(썸네일/이름/별점/가격) → 슈퍼에디터가 게시한 긴 JPEG를
// 세로로 그대로 → 리뷰 목록(작성 UI는 후속). 하단 고정 구매 바(BuyBar)는 쿠팡 관례.
import { notFound } from 'next/navigation';
import { Package } from 'lucide-react';
import { getUserBySlug } from '@/lib/users';
import { getProduct, listReviews } from '@/lib/db/products';
import { discountRate, formatPrice } from '@/lib/shop/types';
import { RatingStars } from '@/components/shop/RatingStars';
import { ShopHeader } from '@/components/shop/ShopHeader';
import { BuyBar } from '@/components/shop/BuyBar';

export const dynamic = 'force-dynamic';

export default async function ShopProductDetailPage(
  { params }: { params: Promise<{ slug: string; productId: string }> },
) {
  const { slug, productId } = await params;
  const user = getUserBySlug(slug);
  if (!user) notFound();

  const product = getProduct(productId);
  // 소유자 불일치·비공개 상품은 존재 자체를 숨긴다(active만 공개 원칙)
  if (!product || product.user_id !== user.id || product.status !== 'active') notFound();

  const reviews = listReviews(productId);
  const rate = discountRate(product.price, product.original_price);

  return (
    <div className="min-h-screen bg-white pb-24">
      <ShopHeader slug={slug} shopName={user.shop_name || slug} />

      <main className="max-w-3xl mx-auto">
        {/* 상단 요약 */}
        <div className="px-4 py-5 flex gap-4">
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-stone-50 overflow-hidden flex items-center justify-center shrink-0">
            {product.thumbnail_path ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.thumbnail_path} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <Package size={28} className="text-stone-200" />
            )}
          </div>
          <div className="flex flex-col gap-1.5 min-w-0">
            {product.category && <p className="text-xs text-stone-400">{product.category}</p>}
            <h1 className="text-lg font-bold text-stone-900 leading-snug">{product.name}</h1>
            <RatingStars rating={product.avg_rating} count={product.review_count} />
            <div className="flex items-baseline gap-1.5 flex-wrap mt-1">
              {rate !== null && <span className="text-xl font-black text-red-500">{rate}%</span>}
              <span className="text-2xl font-black text-stone-900">{formatPrice(product.price)}</span>
              {rate !== null && (
                <span className="text-sm text-stone-300 line-through">{formatPrice(product.original_price!)}</span>
              )}
            </div>
            {product.description && (
              <p className="text-sm text-stone-500 leading-relaxed mt-1">{product.description}</p>
            )}
          </div>
        </div>

        {/* 상세페이지 — 슈퍼에디터가 게시한 긴 세로 JPEG */}
        {product.detail_image_path ? (
          <div className="border-t border-stone-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={product.detail_image_path} alt={`${product.name} 상세 정보`} className="w-full h-auto" />
          </div>
        ) : (
          <div className="border-t border-stone-100 py-16 text-center text-sm text-stone-300">
            상세 이미지가 준비 중입니다
          </div>
        )}

        {/* 리뷰 */}
        <section className="border-t-8 border-stone-50 px-4 py-6 flex flex-col gap-4">
          <h2 className="text-sm font-bold text-stone-800">
            상품평 {reviews.length > 0 && <span className="text-stone-400 font-medium">({reviews.length.toLocaleString()})</span>}
          </h2>
          {reviews.length === 0 ? (
            <p className="text-sm text-stone-400 py-6 text-center">아직 상품평이 없습니다.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {reviews.map((r) => (
                <div key={r.id} className="flex flex-col gap-1 pb-4 border-b border-stone-100 last:border-0">
                  <RatingStars rating={r.rating} count={undefined} />
                  <div className="flex items-center gap-2 text-xs text-stone-400">
                    <span className="font-semibold text-stone-600">{r.author_name || '구매자'}</span>
                    <span>{new Date(r.created_at).toLocaleDateString('ko-KR')}</span>
                  </div>
                  {r.body && <p className="text-sm text-stone-700 leading-relaxed">{r.body}</p>}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <BuyBar
        slug={slug}
        product={{ id: product.id, name: product.name, price: product.price, thumbnail_path: product.thumbnail_path }}
      />
    </div>
  );
}
