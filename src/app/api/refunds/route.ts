import { NextRequest } from 'next/server';
import { getOrderById, refundOrder } from '@/lib/db/orders';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { orderId, refundType, refundAmount, refundReason } = body;

  if (!orderId || !refundReason?.trim()) {
    return Response.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 });
  }
  if (!['full', 'partial'].includes(refundType)) {
    return Response.json({ error: '유효하지 않은 환불 유형입니다.' }, { status: 400 });
  }
  if (refundType === 'partial' && (!refundAmount || refundAmount <= 0)) {
    return Response.json({ error: '부분환불 금액을 입력하세요.' }, { status: 400 });
  }

  const order = getOrderById(orderId);
  if (!order) {
    return Response.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 });
  }
  if (order.paymentStatus !== 'paid') {
    return Response.json(
      { error: '결제완료 상태의 주문만 환불 가능합니다.' },
      { status: 409 }
    );
  }
  if (order.status === 'refunded' || order.status === 'partially_refunded') {
    return Response.json({ error: '이미 환불 처리된 주문입니다.' }, { status: 409 });
  }

  const finalAmount = refundType === 'full' ? order.totalAmount : Number(refundAmount);
  if (finalAmount > order.totalAmount) {
    return Response.json(
      { error: '환불 금액이 결제 금액을 초과할 수 없습니다.' },
      { status: 400 }
    );
  }

  const updated = refundOrder(orderId, refundType, finalAmount, refundReason.trim());
  if (!updated) {
    return Response.json({ error: '환불 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }

  return Response.json({ order: updated });
}
