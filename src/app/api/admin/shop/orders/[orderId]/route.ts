// 판매자 주문 단건 API — 상태 전환(PUT). 허용 전이는 db 계층이 검증한다
// (SHOP_ORDER_TRANSITIONS 단일 소스 — 배송 시작 후 취소 등 불가 전이는 400).

import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { updateShopOrderStatus } from '@/lib/db/shop-orders';
import { SHOP_ORDER_STATUS_LABELS, type ShopOrderStatus } from '@/lib/shop/types';

export const dynamic = 'force-dynamic';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const session = getSessionFromRequest(req);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { orderId } = await params;
  const { status } = await req.json().catch(() => ({}));
  if (!(status in SHOP_ORDER_STATUS_LABELS)) {
    return Response.json({ error: 'invalid status' }, { status: 400 });
  }

  const order = updateShopOrderStatus(orderId, session.sub, status as ShopOrderStatus);
  if (!order) {
    return Response.json({ error: '허용되지 않은 상태 전환이거나 주문을 찾을 수 없습니다' }, { status: 400 });
  }
  return Response.json({ order });
}
