import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const enc = new TextEncoder();

// orderId → Set<ReadableStreamController>
export const sseChannels = new Map<string, Set<ReadableStreamDefaultController>>();

function sse(data: object): Uint8Array {
  return enc.encode(`data: ${JSON.stringify(data)}\n\n`);
}

export function notifyChannel(orderId: string, data: object) {
  const controllers = sseChannels.get(orderId);
  if (!controllers) return;
  const payload = sse(data);
  for (const ctrl of controllers) {
    try { ctrl.enqueue(payload); } catch { /* 연결 끊김 */ }
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { orderId } = await params;

  const stream = new ReadableStream({
    start(controller) {
      if (!sseChannels.has(orderId)) sseChannels.set(orderId, new Set());
      sseChannels.get(orderId)!.add(controller);

      // 연결 확인 신호
      controller.enqueue(sse({ type: 'connected', orderId }));

      // 15초마다 keepalive
      const hb = setInterval(() => {
        try { controller.enqueue(enc.encode(': keepalive\n\n')); }
        catch { clearInterval(hb); }
      }, 15_000);

      // 연결 종료 시 정리
      req.signal.addEventListener('abort', () => {
        clearInterval(hb);
        sseChannels.get(orderId)?.delete(controller);
        if (sseChannels.get(orderId)?.size === 0) sseChannels.delete(orderId);
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
