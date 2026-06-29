import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getImagePayment, completeImagePayment } from '@/lib/db/image-payments';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST /api/admin/super-editor-payment/complete
// body: { paymentOrderId }
export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { paymentOrderId } = await req.json();
  if (!paymentOrderId) return Response.json({ error: 'paymentOrderId required' }, { status: 400 });

  const payment = getImagePayment(paymentOrderId);
  if (!payment || payment.user_id !== session.sub) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  completeImagePayment(paymentOrderId);
  return Response.json({ ok: true });
}
