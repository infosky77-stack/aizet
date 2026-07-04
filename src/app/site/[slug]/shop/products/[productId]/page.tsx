// 구매자 상품 상세 — 얇은 래퍼(본체는 ProductDetailView, 한캔디와 공유).
import { ProductDetailView } from '@/components/shop/ProductDetailView';

export const dynamic = 'force-dynamic';

export default async function ShopProductDetailPage(
  { params }: { params: Promise<{ slug: string; productId: string }> },
) {
  const { slug, productId } = await params;
  return <ProductDetailView slug={slug} productId={productId} />;
}
