import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getMediaOrder } from '@/lib/db/media-orders';
import {
  createPlacement, getPlacement, listPlacementsByOrder, updatePlacement, deletePlacement,
  PlacementKind, PlacementSlot, PlacementStatus,
} from '@/lib/db/magazine-placements';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// magazine_placements는 가벼운 메타데이터만 다룬다 — 광고 이미지/원고 원본 같은 무거운
// 바이너리는 이 라우트에 절대 실리지 않는다(로컬 원장 쪽에서 별도로 관리, ledger_ref만 참조).

function ownedOrder(orderId: string, userId: string) {
  const order = getMediaOrder(orderId);
  return order && order.user_id === userId ? order : null;
}

const SLOTS: PlacementSlot[] = ['full', 'half', 'quarter'];

// page_no/slot 입력 정규화 — 잘못된 값은 에러 문자열 반환(자유 텍스트가 스키마에 스미는 걸 차단).
function parsePagePos(body: { pageNo?: unknown; slot?: unknown }):
  { pageNo: number | null; slot: PlacementSlot | null } | { error: string } {
  let pageNo: number | null = null;
  if (body.pageNo !== undefined && body.pageNo !== null && body.pageNo !== '') {
    const n = Number(body.pageNo);
    if (!Number.isInteger(n) || n < 1) return { error: 'pageNo must be a positive integer' };
    pageNo = n;
  }
  let slot: PlacementSlot | null = null;
  if (body.slot !== undefined && body.slot !== null && body.slot !== '') {
    if (!SLOTS.includes(body.slot as PlacementSlot)) {
      return { error: `slot must be one of ${SLOTS.join(', ')}` };
    }
    slot = body.slot as PlacementSlot;
  }
  return { pageNo, slot };
}

// ledgerRef 입력 정규화 — 원장 FileEntry.id 포인터(빈 문자열/null은 미연결).
function parseLedgerRef(value: unknown): string | null | { error: string } {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') return { error: 'ledgerRef must be a string' };
  return value;
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

  const body = await req.json();
  const { orderId, kind, partyName, sizeSpec } = body;
  if (!orderId || !ownedOrder(orderId, session.sub)) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }
  if (kind !== 'ad' && kind !== 'manuscript') {
    return Response.json({ error: 'kind must be ad or manuscript' }, { status: 400 });
  }
  const pos = parsePagePos(body);
  if ('error' in pos) return Response.json({ error: pos.error }, { status: 400 });
  const ledgerRef = parseLedgerRef(body.ledgerRef);
  if (ledgerRef !== null && typeof ledgerRef === 'object') {
    return Response.json({ error: ledgerRef.error }, { status: 400 });
  }

  const placement = createPlacement(session.sub, orderId, kind as PlacementKind, {
    partyName: partyName ?? '',
    sizeSpec:  sizeSpec ?? '',
    pageNo:    pos.pageNo,
    slot:      pos.slot,
    ledgerRef,
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

  const body = await req.json();
  const { partyName, sizeSpec, status } = body;
  if (status && status !== 'intake' && status !== 'placed' && status !== 'confirmed') {
    return Response.json({ error: 'invalid status' }, { status: 400 });
  }

  // pageNo/slot/ledgerRef 필드가 요청에 아예 없으면(상태만 바꾸는 PUT 등) 기존 값 유지(undefined 전달)
  const hasPos = 'pageNo' in body || 'slot' in body;
  let pageNo: number | null | undefined;
  let slot:   PlacementSlot | null | undefined;
  if (hasPos) {
    const pos = parsePagePos(body);
    if ('error' in pos) return Response.json({ error: pos.error }, { status: 400 });
    pageNo = pos.pageNo;
    slot   = pos.slot;
  }
  let ledgerRef: string | null | undefined;
  if ('ledgerRef' in body) {
    const parsed = parseLedgerRef(body.ledgerRef);
    if (parsed !== null && typeof parsed === 'object') {
      return Response.json({ error: parsed.error }, { status: 400 });
    }
    ledgerRef = parsed;
  }

  updatePlacement(id, { partyName, sizeSpec, pageNo, slot, ledgerRef, status: status as PlacementStatus | undefined });
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
