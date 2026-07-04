// 판매자 상품 API — 목록/생성. 세션 소유자 스코프(user=shop 관례).
// 생성 시 슈퍼에디터 product 콘텐츠(media_orders)를 함께 만들어 detail_order_id로
// 연결한다 — 이 media_order가 상품 사진의 파일 원장 컨테이너이자 상세페이지
// 스냅샷의 저장소를 겸한다(상품 1 : product 콘텐츠 1).

import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { createProduct, listProducts, getProductByDetailOrder } from '@/lib/db/products';
import { createMediaOrder } from '@/lib/db/media-orders';

export const dynamic = 'force-dynamic';

// GET ?detailOrderId=… : 슈퍼에디터 콘텐츠에 연결된 상품 단건(게시 버튼 노출용), 없으면 목록
export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const detailOrderId = req.nextUrl.searchParams.get('detailOrderId');
  if (detailOrderId) {
    return Response.json({ product: getProductByDetailOrder(detailOrderId, session.sub) });
  }
  return Response.json({ products: listProducts(session.sub) });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { name } = await req.json().catch(() => ({}));
  const title = typeof name === 'string' && name.trim() ? name.trim() : '새 상품';

  const detailOrder = createMediaOrder(session.sub, 'product', title);
  const product = createProduct(session.sub, { name: title, detail_order_id: detailOrder.id });
  return Response.json({ product });
}
