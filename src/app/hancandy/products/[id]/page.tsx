// 한캔디 제품 상세 — 범용 공유 뷰(ProductDetailView). 슈퍼에디터로 게시한
// 상세 JPEG가 본문이 된다. 헤더는 한캔디 레이아웃이 담당(showHeader=false).
import { ProductDetailView } from '@/components/shop/ProductDetailView';

export const dynamic = 'force-dynamic';

export default async function HancandyProductDetailPage(
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return <ProductDetailView slug="hancandy" productId={id} basePath="/hancandy" showHeader={false} />;
}
