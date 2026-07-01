import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getMediaOrder } from '@/lib/db/media-orders';
import { createImagePayment } from '@/lib/db/image-payments';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ── 영상·인쇄 고정 단가 ──────────────────────────────────────────────────────
const PRICES: Record<string, number> = {
  video: 29_000,
  print: 19_000,
};

// ── 도록 단가 (나중에 실제 풀린키/성신 단가로 상수만 교체) ──────────────────
const CATALOG_BASE_PRICE   = 30_000; // 도록 기본 제작비 (원)
const CATALOG_PER_ARTWORK  =  3_000; // 작품 1점(1페이지)당 추가 비용 (원)

function calcCatalogAmount(snapshot: string): number {
  try {
    const snap    = JSON.parse(snapshot) as { artworks?: unknown[] };
    const count   = Array.isArray(snap.artworks) ? snap.artworks.length : 0;
    return CATALOG_BASE_PRICE + count * CATALOG_PER_ARTWORK;
  } catch {
    return CATALOG_BASE_PRICE;
  }
}

// POST /api/admin/super-editor-payment
// body: { orderId }
// → image_payments 레코드 생성 후 toss orderId 반환
export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { orderId } = await req.json();
  if (!orderId) return Response.json({ error: 'orderId required' }, { status: 400 });

  const order = getMediaOrder(orderId);
  if (!order || order.user_id !== session.sub) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }
  if (order.is_paid) {
    return Response.json({ error: 'Already paid' }, { status: 409 });
  }

  let itemType: string;
  let amount:   number;

  if (order.order_type === 'catalog') {
    itemType = 'catalog_edit';
    amount   = calcCatalogAmount(order.snapshot);
  } else {
    itemType = order.order_type === 'video' ? 'video_edit' : 'print_edit';
    amount   = PRICES[order.order_type] ?? 19_000;
  }

  const payment = createImagePayment(session.sub, amount, itemType);

  return Response.json({ paymentOrderId: payment.id, amount, itemType });
}
