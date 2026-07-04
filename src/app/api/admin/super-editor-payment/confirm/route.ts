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

  // 결제 승인 → media_orders 잠금
  confirmImagePayment(paymentOrderId, paymentKey);
  markPaid(mediaOrderId, paymentOrderId);

  // 도록(catalog)은 서버 큐에 태우지 않는다 — 결제 성공 화면에서 브라우저가 직접 PDF를 만들어
  // catalog-store-render로 보관한다(51MB대 서버 렌더 대신 수 MB급 클라이언트 생성).
  // 실패 시엔 성공 화면이 catalog-server-fallback으로 이 경로(enqueueJob)와 동일한 결과를 낸다.
  // 잡지(magazine)·제품상세(product)는 아직 결제/렌더큐 연동 전 단계 — UI에도 결제 버튼을
  // 노출하지 않으므로 이 경로는 정상 흐름에서 호출되지 않지만, enqueueJob이 해당 jobType을
  // 모르므로 catalog와 동일하게 조기 반환해 타입/런타임 모두 안전하게 막아둔다.
  if (mediaOrder.order_type === 'catalog' || mediaOrder.order_type === 'magazine' || mediaOrder.order_type === 'product' || mediaOrder.order_type === 'education') {
    return Response.json({ ok: true, orderType: mediaOrder.order_type });
  }

  const job = enqueueJob(mediaOrderId, mediaOrder.order_type);
  return Response.json({ ok: true, jobId: job.id, orderType: mediaOrder.order_type });
}
