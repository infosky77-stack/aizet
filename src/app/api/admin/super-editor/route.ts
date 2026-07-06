import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import {
  createMediaOrder, getMediaOrder, listMediaOrders,
  updateSnapshot, deleteMediaOrder,
} from '@/lib/db/media-orders';
import { getFolder } from '@/lib/db/order-folders';
import { getSiteContext } from '@/lib/registry/siteContext';
import { bootstrapSite } from '@/lib/siteDb/siteDb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/admin/super-editor?orderId=xxx  → 특정 주문 조회
// GET /api/admin/super-editor              → 내 주문 목록
export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const orderId = req.nextUrl.searchParams.get('orderId');
  if (orderId) {
    const order = getMediaOrder(orderId);
    if (!order || order.user_id !== session.sub) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }
    return Response.json({ order });
  }

  const siteId = req.nextUrl.searchParams.get('siteId');

  // siteId가 있으면 그 홈페이지 전용 siteDb에서 목록을 읽는다(읽기 전용, 2단계 파일관리자 GET과 동일 패턴).
  // 소유자 검증은 getSiteContext가 수행 — 소유자 아님/없는 siteId면 null → 빈 목록으로 거부
  // (에러로 터뜨리지 않음). siteId가 없으면 기존과 100% 동일하게 싱글턴(aizet.db)에서 읽는다.
  if (siteId) {
    const ctx = getSiteContext(siteId, session.sub);
    if (!ctx) return Response.json({ orders: [] });
    const siteDb = bootstrapSite(ctx.dbPath);
    try {
      const orders = listMediaOrders(session.sub, siteDb);
      return Response.json({ orders });
    } finally {
      siteDb.close();
    }
  }

  const orders = listMediaOrders(session.sub);
  return Response.json({ orders });
}

// POST /api/admin/super-editor  → 새 주문 생성
export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { orderType, title, folderId } = await req.json();
  if (orderType !== 'video' && orderType !== 'print' && orderType !== 'catalog' && orderType !== 'magazine' && orderType !== 'product' && orderType !== 'education') {
    return Response.json({ error: 'orderType must be video, print, catalog, magazine, product, or education' }, { status: 400 });
  }

  if (folderId) {
    const folder = getFolder(folderId);
    if (!folder || folder.user_id !== session.sub) {
      return Response.json({ error: 'Folder not found' }, { status: 404 });
    }
  }

  const order = createMediaOrder(session.sub, orderType, title ?? '제목 없음', folderId ?? null);
  return Response.json({ order });
}

// PUT /api/admin/super-editor  → auto-save (snapshot + 선택적 title)
export async function PUT(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { orderId, snapshot, title } = await req.json();
  if (!orderId) return Response.json({ error: 'orderId required' }, { status: 400 });

  const order = getMediaOrder(orderId);
  if (!order || order.user_id !== session.sub) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }
  if (order.is_paid) {
    return Response.json({ error: 'Locked: payment completed' }, { status: 403 });
  }

  updateSnapshot(orderId, snapshot ?? {}, title);
  return Response.json({ ok: true });
}

// DELETE /api/admin/super-editor?orderId=xxx  → 미결제 주문 삭제
export async function DELETE(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const orderId = req.nextUrl.searchParams.get('orderId');
  if (!orderId) return Response.json({ error: 'orderId required' }, { status: 400 });

  deleteMediaOrder(orderId, session.sub);
  return Response.json({ ok: true });
}
