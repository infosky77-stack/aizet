import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getImagePayment, confirmImagePayment, failImagePayment } from '@/lib/db/image-payments';
import { getMediaOrder, markPaid } from '@/lib/db/media-orders';
import { enqueueJob } from '@/lib/render/RenderQueue';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST /api/admin/super-editor-payment/confirm
// body: { paymentKey, paymentOrderId, amount, mediaOrderId }
export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { paymentKey, paymentOrderId, amount, mediaOrderId } = await req.json();
  if (!paymentKey || !paymentOrderId || !amount || !mediaOrderId) {
    return Response.json({ error: 'paymentKey, paymentOrderId, amount, mediaOrderId required' }, { status: 400 });
  }

  const payment = getImagePayment(paymentOrderId);
  if (!payment || payment.user_id !== session.sub) {
    return Response.json({ error: 'Payment not found' }, { status: 404 });
  }
  if (payment.status === 'paid') {
    return Response.json({ ok: true, alreadyPaid: true });
  }

  const mediaOrder = getMediaOrder(mediaOrderId);
  if (!mediaOrder || mediaOrder.user_id !== session.sub) {
    return Response.json({ error: 'Media order not found' }, { status: 404 });
  }

  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) return Response.json({ error: 'TOSS_SECRET_KEY not configured' }, { status: 500 });

  const encoded = Buffer.from(secretKey + ':').toString('base64');
  const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method:  'POST',
    headers: { Authorization: `Basic ${encoded}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ paymentKey, orderId: paymentOrderId, amount: Number(amount) }),
  });

  const data = await tossRes.json();
  if (!tossRes.ok) {
    failImagePayment(paymentOrderId);
    return Response.json({ error: data.message ?? '결제 승인 실패' }, { status: tossRes.status });
  }

  // 결제 승인 → media_orders 잠금 + 큐 등록
  confirmImagePayment(paymentOrderId, paymentKey);
  markPaid(mediaOrderId, paymentOrderId);
  const job = enqueueJob(mediaOrderId, mediaOrder.order_type);

  return Response.json({ ok: true, jobId: job.id });
}
