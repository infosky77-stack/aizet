import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { createImagePayment, getActivePaidPayment } from '@/lib/db/image-payments';
import { PRICES } from '@/config/prices';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  // 아직 completed 처리 안 된 paid 결제가 있으면 재사용
  const active = getActivePaidPayment(session.sub);
  if (active) {
    return Response.json({
      orderId:    active.id,
      amount:     active.amount,
      paymentKey: active.toss_key,
      resumable:  true,
    });
  }

  const payment = createImagePayment(session.sub, PRICES.image_generation);
  return Response.json({ orderId: payment.id, amount: payment.amount, resumable: false }, { status: 201 });
}
