import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { createImagePayment } from '@/lib/db/image-payments';
import { PRICES } from '@/config/prices';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const payment = createImagePayment(session.sub, PRICES.image_generation);
  return Response.json({ orderId: payment.id, amount: payment.amount }, { status: 201 });
}
