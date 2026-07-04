// 구매자 상품 상세 공유 뷰 (서버 컴포넌트) — /site/[slug]/shop과 /hancandy가 같은 본체를 쓴다.
// 상단 요약 → 상세(칸칸 HTML 게시본 우선, 없으면 기존 긴 JPEG 폴백) → 리뷰 → 구매 바.
// showHeader=false는 자체 헤더를 가진 상점 레이아웃(한캔디)용.
import { readFile } from 'fs/promises';
import path from 'path';
import { notFound } from 'next/navigation';
import { Package } from 'lucide-react';
import { getUserBySlug } from '@/lib/users';
import { getProduct, listReviews } from '@/lib/db/products';
import { discountRate, formatPrice } from '@/lib/shop/types';
import {
  isPublishedProductDetail, type PublishedProductDetail,
} from '@/lib/super-editor/product/published';
import { ProductDetailSections } from '@/components/product-detail/ProductDetailSections';
import { RatingStars } from './RatingStars';
import { ShopHeader } from './ShopHeader';
import { BuyBar } from './BuyBar';
import { ReviewForm } from './ReviewForm';

// 게시된 칸칸 HTML JSON을 공개 디렉토리에서 읽는다 — 파일명은 게시 라우트의 고정 규칙.
// detail_json_path는 존재 표시(+캐시 버스팅)로만 쓰고, 서버 렌더는 fs에서 직접 읽는다.
// 어떤 실패(없음/손상)든 null → 호출부가 JPEG로 폴백하므로 기존 상품은 그대로 동작.
async function readPublishedDetail(
  userId: string, productId: string,
): Promise<PublishedProductDetail | null> {
  try {
    const filePath = path.join(
      process.cwd(), 'data', 'shop-public', userId, `detail-${productId}.json`,
    );
    const parsed: unknown = JSON.parse(await readFile(filePath, 'utf-8'));
    return isPublishedProductDetail(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

interface Props {
  slug:       string;
  productId:  string;
  basePath?:  string;
  showHeader?: boolean;
}

export async function ProductDetailView({ slug, productId, basePath, showHeader = true }: Props) {
  const user = getUserBySlug(slug);
  if (!user) notFound();

  const product = getProduct(productId);
  // 소유자 불일치·비공개 상품은 존재 자체를 숨긴다(active만 공개 원칙)
  if (!product || product.user_id !== user.id || product.status !== 'active') notFound();

  const reviews = listReviews(productId);
  const rate = discountRate(product.price, product.original_price);
  const publishedDetail = product.detail_json_path
    ? await readPublishedDetail(user.id, productId)
    : null;

  return (
    <div className="min-h-screen bg-white pb-24">
      {showHeader && <ShopHeader slug={slug} shopName={user.shop_name || slug} />}

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

        {/* 상세페이지 — 칸칸 HTML 게시본 우선(확대해도 선명·다국어 준비), 없으면 긴 JPEG 폴백 */}
        {publishedDetail ? (
          <div className="border-t border-stone-100">
            <ProductDetailSections detail={publishedDetail} />
          </div>
        ) : product.detail_image_path ? (
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
          <ReviewForm slug={slug} productId={product.id} />
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
        basePath={basePath}
        product={{ id: product.id, name: product.name, price: product.price, thumbnail_path: product.thumbnail_path }}
      />
    </div>
  );
}
