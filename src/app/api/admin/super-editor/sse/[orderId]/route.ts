import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import {
  registerSseChannel, unregisterSseChannel,
  ssePayload, keepalivePayload,
} from '@/lib/mobile-upload-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { orderId } = await params;

  const stream = new ReadableStream({
    start(controller) {
      registerSseChannel(orderId, controller);

      // 연결 확인 신호
      controller.enqueue(ssePayload({ type: 'connected', orderId }));

      // 15초마다 keepalive
      const hb = setInterval(() => {
        try { controller.enqueue(keepalivePayload()); }
        catch { clearInterval(hb); }
      }, 15_000);

      req.signal.addEventListener('abort', () => {
        clearInterval(hb);
        unregisterSseChannel(orderId, controller);
        try { controller.close(); } catch { /* 이미 닫힘 */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type':      'text/event-stream',
      'Cache-Control':     'no-cache',
      'Connection':        'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
