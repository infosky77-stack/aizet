// TODO: 테스트용, 배포 전 제거
import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getImagePayment, confirmImagePayment } from '@/lib/db/image-payments';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST /api/admin/image-payment/bypass
// 실제 Toss 결제 없이 image_payments.status='paid' 로 직접 전환
export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { orderId } = await req.json();
  if (!orderId) return Response.json({ error: 'orderId required' }, { status: 400 });

  const payment = getImagePayment(orderId);
  if (!payment || payment.user_id !== session.sub) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }
  if (payment.status !== 'pending') {
    return Response.json({ ok: true, alreadyDone: true });
  }

  confirmImagePayment(orderId, 'test-bypass');
  return Response.json({ ok: true });
}
