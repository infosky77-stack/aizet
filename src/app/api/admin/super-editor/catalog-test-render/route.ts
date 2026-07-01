import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getMediaOrder, updateStatus } from '@/lib/db/media-orders';
import { enqueueJob, processNextJob } from '@/lib/render/RenderQueue';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST /api/admin/super-editor/catalog-test-render
// body: { orderId }         → render without payment
// body: { orderId, reset }  → reset status back to 'editing'
export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { orderId, reset } = await req.json() as { orderId: string; reset?: boolean };
  if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });

  const order = getMediaOrder(orderId);
  if (!order || order.user_id !== session.sub) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (order.order_type !== 'catalog') {
    return NextResponse.json({ error: 'catalog only' }, { status: 400 });
  }
  if (order.is_paid) {
    return NextResponse.json({ error: 'Already paid — use payment flow' }, { status: 403 });
  }

  // 편집 모드 리셋 (다시 편집)
  if (reset) {
    updateStatus(orderId, 'editing');
    db.prepare('UPDATE media_orders SET output_uuid=NULL WHERE id=?').run(orderId);
    return NextResponse.json({ ok: true, reset: true });
  }

  // 이미 렌더 중이면 스킵
  if (order.status === 'queued' || order.status === 'processing') {
    return NextResponse.json({ ok: true, alreadyQueued: true });
  }

  // 상태 → queued + 잡 등록
  updateStatus(orderId, 'queued');
  const job = enqueueJob(orderId, 'catalog');

  // 백그라운드 렌더 시작 (응답 블록 없이)
  void processNextJob().catch(e => console.error('[catalog-test-render]', e));

  return NextResponse.json({ ok: true, jobId: job.id });
}
