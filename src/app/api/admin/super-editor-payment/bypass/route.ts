// TODO: 테스트용, 배포 전 제거
import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getImagePayment, confirmImagePayment, completeImagePayment } from '@/lib/db/image-payments';
import { getMediaOrder, markPaid } from '@/lib/db/media-orders';
import { enqueueJob, processNextJob } from '@/lib/render/RenderQueue';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST /api/admin/super-editor-payment/bypass
// 실제 Toss 결제 없이 is_paid=1 + 렌더 큐 등록 + 렌더 즉시 시작
export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { paymentOrderId, mediaOrderId } = await req.json();
  if (!paymentOrderId || !mediaOrderId) {
    return Response.json({ error: 'paymentOrderId and mediaOrderId required' }, { status: 400 });
  }

  const payment = getImagePayment(paymentOrderId);
  if (!payment || payment.user_id !== session.sub) {
    return Response.json({ error: 'Payment not found' }, { status: 404 });
  }
  if (payment.status !== 'pending') {
    // 이미 처리됐지만 렌더가 안 됐을 수 있으므로 큐 트리거
    void processNextJob().catch(e => console.error('[bypass] render trigger error:', e));
    return Response.json({ ok: true, alreadyDone: true });
  }

  const mediaOrder = getMediaOrder(mediaOrderId);
  if (!mediaOrder || mediaOrder.user_id !== session.sub) {
    return Response.json({ error: 'Media order not found' }, { status: 404 });
  }

  confirmImagePayment(paymentOrderId, 'test-bypass');
  markPaid(mediaOrderId, paymentOrderId);
  const job = enqueueJob(mediaOrderId, mediaOrder.order_type);
  completeImagePayment(paymentOrderId);

  // 렌더링 즉시 시작 (응답 블록 없이 백그라운드 실행)
  void processNextJob().catch(e => console.error('[bypass] render trigger error:', e));

  return Response.json({ ok: true, jobId: job.id });
}
