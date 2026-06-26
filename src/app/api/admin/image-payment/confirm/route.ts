import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getImagePayment, confirmImagePayment, failImagePayment } from '@/lib/db/image-payments';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { paymentKey, orderId, amount } = await req.json();
  if (!paymentKey || !orderId || !amount) {
    return Response.json({ error: 'paymentKey, orderId, amount required' }, { status: 400 });
  }

  const payment = getImagePayment(orderId);
  if (!payment || payment.user_id !== session.sub) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }
  if (payment.status === 'paid') {
    return Response.json({ ok: true, alreadyPaid: true });
  }

  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) return Response.json({ error: 'TOSS_SECRET_KEY not configured' }, { status: 500 });

  const encoded = Buffer.from(secretKey + ':').toString('base64');
  const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: { Authorization: `Basic ${encoded}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
  });

  const data = await tossRes.json();
  if (!tossRes.ok) {
    failImagePayment(orderId);
    return Response.json({ error: data.message ?? '결제 승인 실패' }, { status: tossRes.status });
  }

  confirmImagePayment(orderId, paymentKey);
  return Response.json({ ok: true });
}
