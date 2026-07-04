import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import {
  createMediaOrder, getMediaOrder, listMediaOrders,
  updateSnapshot, deleteMediaOrder,
} from '@/lib/db/media-orders';
import { getFolder } from '@/lib/db/order-folders';

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
