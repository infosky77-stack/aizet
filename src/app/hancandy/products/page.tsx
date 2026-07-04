// 한캔디 제품 목록 — 범용 쇼핑몰 구조(products 테이블 + ProductCard)로 동작.
// 헤더/네비는 한캔디 레이아웃이 담당하므로 그리드만 그린다. 경로는 기존 /hancandy 유지.
import { notFound } from 'next/navigation';
import { Package } from 'lucide-react';
import { getUserBySlug } from '@/lib/users';
import { listPublicProducts } from '@/lib/db/products';
import { ProductCard } from '@/components/shop/ProductCard';

export const dynamic = 'force-dynamic';

export default async function HancandyProductsPage() {
  const user = getUserBySlug('hancandy');
  if (!user) notFound(); // seed(scripts/seed-hancandy.ts) 실행 전이면 404

  const products = listPublicProducts(user.id);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">전체 제품</h1>
        <p className="text-sm text-gray-500 mt-1">한의학 원료로 만든 무설탕 건강 캔디</p>
      </div>
      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-24 text-stone-400">
          <Package size={32} className="opacity-30" />
          <p className="text-sm">아직 판매중인 상품이 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {products.map((p) => (
            <ProductCard key={p.id} slug="hancandy" basePath="/hancandy" product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
