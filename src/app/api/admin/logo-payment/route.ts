import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { createImagePayment, getActivePaidPayment } from '@/lib/db/image-payments';
import { PRICES } from '@/config/prices';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  // 로고 생성용 paid 결제가 있으면 재사용
  const active = getActivePaidPayment(session.sub, 'logo_generation');
  if (active) {
    return Response.json({
      orderId:    active.id,
      amount:     active.amount,
      paymentKey: active.toss_key,
      resumable:  true,
    });
  }

  const payment = createImagePayment(session.sub, PRICES.logo_generation, 'logo_generation');
  return Response.json({ orderId: payment.id, amount: payment.amount, resumable: false }, { status: 201 });
}
