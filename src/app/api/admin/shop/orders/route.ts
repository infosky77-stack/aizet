// 판매자 주문 API — 목록(?status= 필터) + 정산 개요(?summaryDays=).
// 상태 전환은 단건 라우트([orderId]) 몫. 전이 규칙은 lib/shop/types.ts 단일 소스.

import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { listShopOrders, summarizeShopSales } from '@/lib/db/shop-orders';
import { SHOP_ORDER_STATUS_LABELS, type ShopOrderStatus } from '@/lib/shop/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const summaryDays = req.nextUrl.searchParams.get('summaryDays');
  if (summaryDays) {
    const days = Math.max(1, Math.min(365, Number(summaryDays) || 30));
    const since = Date.now() - days * 24 * 60 * 60 * 1000;
    return Response.json({ summary: summarizeShopSales(session.sub, since), days });
  }

  const rawStatus = req.nextUrl.searchParams.get('status');
  const status = rawStatus && rawStatus in SHOP_ORDER_STATUS_LABELS
    ? (rawStatus as ShopOrderStatus) : undefined;
  return Response.json({ orders: listShopOrders(session.sub, status) });
}
