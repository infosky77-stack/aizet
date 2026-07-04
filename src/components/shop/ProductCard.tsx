// 상품 목록 카드 — 쿠팡 스타일: 정사각 썸네일, 가격 크게(할인율 빨강 + 정가 취소선),
// 별점+리뷰수. 어느 회원 상점이든 slug만 받아 동작하는 범용 컴포넌트.
import Link from 'next/link';
import { Package } from 'lucide-react';
import { discountRate, formatPrice, type ProductRow } from '@/lib/shop/types';
import { RatingStars } from './RatingStars';

interface Props {
  slug:    string;
  product: ProductRow;
}

export function ProductCard({ slug, product }: Props) {
  const rate = discountRate(product.price, product.original_price);
  return (
    <Link
      href={`/site/${slug}/shop/products/${product.id}`}
      className="group flex flex-col bg-white rounded-2xl border border-stone-100 hover:border-stone-300 hover:shadow-md overflow-hidden transition-all"
    >
      <div className="aspect-square bg-stone-50 overflow-hidden flex items-center justify-center">
        {product.thumbnail_path ? (
          // 게시된 공개 사본 — next/image 최적화 대상 아님(자체 API 서빙)
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.thumbnail_path}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <Package size={28} className="text-stone-200" />
        )}
      </div>
      <div className="p-3 flex flex-col gap-1">
        <p className="text-sm text-stone-700 line-clamp-2 leading-snug">{product.name}</p>
        <div className="flex items-baseline gap-1.5 flex-wrap">
          {rate !== null && <span className="text-base font-black text-red-500">{rate}%</span>}
          <span className="text-lg font-black text-stone-900">{formatPrice(product.price)}</span>
          {rate !== null && (
            <span className="text-xs text-stone-300 line-through">{formatPrice(product.original_price!)}</span>
          )}
        </div>
        <RatingStars rating={product.avg_rating} count={product.review_count} />
      </div>
    </Link>
  );
}
