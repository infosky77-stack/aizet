import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getImagePayment, completeImagePayment } from '@/lib/db/image-payments';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { orderId } = await req.json();
  if (!orderId) return Response.json({ error: 'orderId required' }, { status: 400 });

  const payment = getImagePayment(orderId);
  if (!payment || payment.user_id !== session.sub) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  completeImagePayment(orderId);
  return Response.json({ ok: true });
}
