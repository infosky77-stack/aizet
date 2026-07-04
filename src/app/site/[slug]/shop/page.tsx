// 구매자 상품 목록 — 쿠팡 스타일 카드 그리드. 판매중(active) 상품만 노출된다
// (필터는 listPublicProducts가 담당 — 이 화면에서 상태 분기를 되살리지 말 것).
import { notFound } from 'next/navigation';
import { Package } from 'lucide-react';
import { getUserBySlug } from '@/lib/users';
import { listPublicProducts } from '@/lib/db/products';
import { ProductCard } from '@/components/shop/ProductCard';
import { ShopHeader } from '@/components/shop/ShopHeader';

export const dynamic = 'force-dynamic';

export default async function ShopListPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = getUserBySlug(slug);
  if (!user) notFound();

  const products = listPublicProducts(user.id);

  return (
    <div className="min-h-screen bg-stone-50">
      <ShopHeader slug={slug} shopName={user.shop_name || slug} />
      <main className="max-w-3xl mx-auto px-4 py-6">
        {products.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-24 text-stone-400">
            <Package size={32} className="opacity-30" />
            <p className="text-sm">아직 판매중인 상품이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {products.map((p) => <ProductCard key={p.id} slug={slug} product={p} />)}
          </div>
        )}
      </main>
    </div>
  );
}
