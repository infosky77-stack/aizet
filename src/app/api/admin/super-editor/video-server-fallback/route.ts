import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getMediaOrder } from '@/lib/db/media-orders';
import { enqueueJob, processNextJob } from '@/lib/render/RenderQueue';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST /api/admin/super-editor/video-server-fallback
// 브라우저 로컬 영상 생성(WebCodecs)이 미지원/실패일 때의 안전망 — 기존 서버 렌더 경로
// (RenderQueue → UbuntuLocalWorker → render-video.py)를 그대로 태운다.
// render-video.py는 스냅샷의 legacy 파생 필드(canvas.blocks)만 읽으므로 이미지·텍스트
// 장면만 결과에 포함된다(클립 장면은 브라우저 렌더 전용 — 호출부 UI가 안내).
// catalog-test-render처럼 미결제 주문도 허용한다: 미지원 브라우저에선 이 경로가 유일한
// 시안 확인 수단이기 때문. 주문 status는 건드리지 않는다(큐 완료 처리가 갱신).
export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { orderId } = await req.json() as { orderId: string };
  if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });

  const order = getMediaOrder(orderId);
  if (!order || order.user_id !== session.sub) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (order.order_type !== 'video') {
    return NextResponse.json({ error: 'video only' }, { status: 400 });
  }
  if (order.status === 'queued' || order.status === 'processing') {
    return NextResponse.json({ ok: true, alreadyQueued: true });
  }

  const job = enqueueJob(orderId, 'video');
  void processNextJob().catch(e => console.error('[video-server-fallback]', e));

  return NextResponse.json({ ok: true, jobId: job.id });
}
