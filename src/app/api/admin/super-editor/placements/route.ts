import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getMediaOrder } from '@/lib/db/media-orders';
import {
  createPlacement, getPlacement, listPlacementsByOrder, updatePlacement, deletePlacement,
  PlacementKind, PlacementStatus,
} from '@/lib/db/magazine-placements';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// magazine_placements는 가벼운 메타데이터만 다룬다 — 광고 이미지/원고 원본 같은 무거운
// 바이너리는 이 라우트에 절대 실리지 않는다(로컬 원장 쪽에서 별도로 관리, ledger_ref만 참조).

function ownedOrder(orderId: string, userId: string) {
  const order = getMediaOrder(orderId);
  return order && order.user_id === userId ? order : null;
}

// GET /api/admin/super-editor/placements?orderId=xxx → 해당 주문의 광고·원고 목록
export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const orderId = req.nextUrl.searchParams.get('orderId');
  if (!orderId) return Response.json({ error: 'orderId required' }, { status: 400 });
  if (!ownedOrder(orderId, session.sub)) return Response.json({ error: 'Not found' }, { status: 404 });

  return Response.json({ placements: listPlacementsByOrder(orderId) });
}

// POST /api/admin/super-editor/placements → 새 광고·원고 항목 생성
export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { orderId, kind, partyName, sizeSpec, placementPos } = await req.json();
  if (!orderId || !ownedOrder(orderId, session.sub)) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }
  if (kind !== 'ad' && kind !== 'manuscript') {
    return Response.json({ error: 'kind must be ad or manuscript' }, { status: 400 });
  }

  const placement = createPlacement(session.sub, orderId, kind as PlacementKind, {
    partyName:    partyName ?? '',
    sizeSpec:     sizeSpec ?? '',
    placementPos: placementPos ?? null,
  });
  return Response.json({ placement });
}

// PUT /api/admin/super-editor/placements?id=xxx → 필드/게재 상태 수정
export async function PUT(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return Response.json({ error: 'id required' }, { status: 400 });

  const existing = getPlacement(id);
  if (!existing || existing.user_id !== session.sub) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  const { partyName, sizeSpec, placementPos, status } = await req.json();
  if (status && status !== 'intake' && status !== 'placed' && status !== 'confirmed') {
    return Response.json({ error: 'invalid status' }, { status: 400 });
  }

  updatePlacement(id, { partyName, sizeSpec, placementPos, status: status as PlacementStatus | undefined });
  return Response.json({ ok: true });
}

// DELETE /api/admin/super-editor/placements?id=xxx
export async function DELETE(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return Response.json({ error: 'id required' }, { status: 400 });

  const existing = getPlacement(id);
  if (!existing || existing.user_id !== session.sub) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  deletePlacement(id, session.sub);
  return Response.json({ ok: true });
}
