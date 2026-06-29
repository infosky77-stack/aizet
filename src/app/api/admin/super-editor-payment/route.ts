import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getMediaOrder } from '@/lib/db/media-orders';
import { createImagePayment } from '@/lib/db/image-payments';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PRICES: Record<string, number> = {
  video: 29_000,
  print: 19_000,
};

// POST /api/admin/super-editor-payment
// body: { orderId }
// → image_payments 레코드 생성 후 toss orderId 반환
export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { orderId } = await req.json();
  if (!orderId) return Response.json({ error: 'orderId required' }, { status: 400 });

  const order = getMediaOrder(orderId);
  if (!order || order.user_id !== session.sub) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }
  if (order.is_paid) {
    return Response.json({ error: 'Already paid' }, { status: 409 });
  }

  const itemType  = order.order_type === 'video' ? 'video_edit' : 'print_edit';
  const amount    = PRICES[order.order_type] ?? 19_000;
  const payment   = createImagePayment(session.sub, amount, itemType);

  return Response.json({ paymentOrderId: payment.id, amount, itemType });
}
