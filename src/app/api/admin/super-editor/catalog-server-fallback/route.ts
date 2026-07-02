import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getMediaOrder, updateStatus } from '@/lib/db/media-orders';
import { enqueueJob, processNextJob } from '@/lib/render/RenderQueue';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST /api/admin/super-editor/catalog-server-fallback
// 결제 완료된 도록 주문에서 "브라우저 클라이언트 PDF 생성"이 실패했을 때만 쓰는 안전망.
// 기존 서버(python) 렌더 경로(RenderQueue → UbuntuLocalWorker → render-catalog.py)를 그대로 태운다.
export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { orderId } = await req.json() as { orderId: string };
  if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });

  const order = getMediaOrder(orderId);
  if (!order || order.user_id !== session.sub) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (order.order_type !== 'catalog') {
    return NextResponse.json({ error: 'catalog only' }, { status: 400 });
  }
  if (!order.is_paid) {
    return NextResponse.json({ error: 'unpaid order — use catalog-test-render instead' }, { status: 400 });
  }
  if (order.status === 'queued' || order.status === 'processing') {
    return NextResponse.json({ ok: true, alreadyQueued: true });
  }

  updateStatus(orderId, 'queued');
  const job = enqueueJob(orderId, 'catalog');
  void processNextJob().catch(e => console.error('[catalog-server-fallback]', e));

  return NextResponse.json({ ok: true, jobId: job.id });
}
