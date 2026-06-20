import { NextRequest } from 'next/server';
import { getOrdersByDate, getClosedDate, closeDate } from '@/lib/db/orders';
import { DailySummary, MethodBreakdown } from '@/types/settlement';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date');
  if (!date || !DATE_RE.test(date)) {
    return Response.json({ error: 'Invalid date (YYYY-MM-DD required)' }, { status: 400 });
  }

  const orders = getOrdersByDate(date);
  const closed = getClosedDate(date);

  const refundedOrders = orders.filter(
    (o) => o.status === 'refunded' || o.status === 'partially_refunded'
  );
  const cancelledOrders = orders.filter((o) => o.status === 'cancelled');
  const cancelledPaidOrders = cancelledOrders.filter((o) => o.paymentStatus === 'paid');

  // 총매출(gross)에 환불 주문 포함 — 취소만 제외
  // netRevenue = totalRevenue - cancelledAmount - refundedAmount 로 순매출 산출
  const paidOrders = orders.filter(
    (o) => o.paymentStatus === 'paid' && o.status !== 'cancelled'
  );

  const excludedStatuses = new Set(['cancelled', 'refunded', 'partially_refunded']);
  const activeOrders = orders.filter((o) => !excludedStatuses.has(o.status));
  const unpaidOrders = activeOrders.filter((o) => o.paymentStatus === 'unpaid');
  const pendingOrders = activeOrders.filter((o) => o.paymentStatus === 'pending');

  const totalRevenue = paidOrders.reduce((s, o) => s + o.totalAmount, 0);
  const cancelledAmount = cancelledPaidOrders.reduce((s, o) => s + o.totalAmount, 0);
  const refundedAmount = refundedOrders.reduce((s, o) => s + (o.refundAmount ?? 0), 0);

  const byMethod: MethodBreakdown = { card: 0, cash: 0, kakao: 0, naver: 0, unknown: 0 };
  for (const o of paidOrders) {
    const key = (o.paymentMethod ?? 'unknown') as keyof MethodBreakdown;
    byMethod[key] += o.totalAmount;
  }

  const summary: DailySummary = {
    date,
    totalOrders: orders.length,
    paidCount: paidOrders.length,
    totalRevenue,
    byMethod,
    cancelledCount: cancelledOrders.length,
    cancelledAmount,
    refundedCount: refundedOrders.length,
    refundedAmount,
    netRevenue: totalRevenue - cancelledAmount - refundedAmount,
    unpaidCount: unpaidOrders.length,
    pendingCount: pendingOrders.length,
    isClosed: !!closed,
    closedAt: closed?.closedAt,
  };

  return Response.json({ summary });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { date } = body;

  if (!date || !DATE_RE.test(date)) {
    return Response.json({ error: 'Invalid date (YYYY-MM-DD required)' }, { status: 400 });
  }

  const existing = getClosedDate(date);
  if (existing) {
    return Response.json(
      { error: 'Already closed', closedAt: existing.closedAt },
      { status: 409 }
    );
  }

  const result = closeDate(date);
  return Response.json({ closedAt: result.closedAt });
}
