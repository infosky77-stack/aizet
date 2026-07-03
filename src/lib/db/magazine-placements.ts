import { randomUUID } from 'crypto';
import db from '@/lib/db';

/**
 * 잡지 광고·원고 게재 항목 — 독립 모듈.
 *
 * media_orders(주문/결제)와 완전히 분리된 별도 테이블(magazine_placements)이다.
 * order_id로 media_orders를 앱 레벨 참조만 할 뿐(FK 강제 없음), 결제 컬럼은 전혀 없다.
 *
 * 무거운 원본(광고 이미지·원고 파일)은 이 테이블에 저장하지 않는다 — 로컬 원장(FileEntry,
 * src/lib/super-editor/ledger)에 두고, ledger_ref 컬럼은 그 FileEntry.id를 가리키는
 * 포인터만 들고 있다. 서버 DB에는 가벼운 메타데이터만 남는다.
 *
 * receivable_id는 향후 미수금 모듈을 위한 예약 컬럼이다. 이 파일의 어떤 함수도
 * receivable_id를 쓰지 않는다 — 지금은 항상 NULL로 남겨두고, 실제 미수금 로직은
 * src/lib/super-editor/placements/billing.ts 쪽에서 나중에 별도로 구현한다.
 */

export type PlacementKind   = 'ad' | 'manuscript';
export type PlacementStatus = 'intake' | 'placed' | 'confirmed';

export interface MagazinePlacement {
  id:            string;
  order_id:      string;
  user_id:       string;
  kind:          PlacementKind;
  party_name:    string;
  size_spec:     string;
  placement_pos: string | null;
  status:        PlacementStatus;
  intake_date:   number | null;
  ledger_ref:    string | null;
  sort_order:    number | null;
  receivable_id: string | null;
  created_at:    number;
  updated_at:    number;
}

export interface CreatePlacementOpts {
  partyName?:    string;
  sizeSpec?:     string;
  placementPos?: string | null;
  status?:       PlacementStatus;
  intakeDate?:   number | null;
  ledgerRef?:    string | null;
  sortOrder?:    number | null;
}

export function createPlacement(
  userId:  string,
  orderId: string,
  kind:    PlacementKind,
  opts:    CreatePlacementOpts = {},
): MagazinePlacement {
  const id  = randomUUID();
  const now = Date.now();
  db.prepare(`
    INSERT INTO magazine_placements
      (id, order_id, user_id, kind, party_name, size_spec, placement_pos, status, intake_date, ledger_ref, sort_order, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, orderId, userId, kind,
    opts.partyName ?? '', opts.sizeSpec ?? '', opts.placementPos ?? null,
    opts.status ?? 'intake', opts.intakeDate ?? now, opts.ledgerRef ?? null, opts.sortOrder ?? null,
    now, now,
  );
  return getPlacement(id)!;
}

export function getPlacement(id: string): MagazinePlacement | null {
  return db.prepare<[string], MagazinePlacement>(
    'SELECT * FROM magazine_placements WHERE id=?'
  ).get(id) ?? null;
}

export function listPlacementsByOrder(orderId: string): MagazinePlacement[] {
  return db.prepare<[string], MagazinePlacement>(
    'SELECT * FROM magazine_placements WHERE order_id=? ORDER BY sort_order ASC, created_at ASC'
  ).all(orderId) as MagazinePlacement[];
}

export interface PlacementPatch {
  partyName?:    string;
  sizeSpec?:     string;
  placementPos?: string | null;
  status?:       PlacementStatus;
  intakeDate?:   number | null;
  ledgerRef?:    string | null;
  sortOrder?:    number | null;
}

// receivable_id는 의도적으로 여기서 갱신 대상이 아니다 — 미수금은 지금 이 모듈 밖에 있다.
export function updatePlacement(id: string, patch: PlacementPatch): void {
  const current = getPlacement(id);
  if (!current) return;
  const next = {
    party_name:    patch.partyName    ?? current.party_name,
    size_spec:     patch.sizeSpec     ?? current.size_spec,
    placement_pos: patch.placementPos !== undefined ? patch.placementPos : current.placement_pos,
    status:        patch.status       ?? current.status,
    intake_date:   patch.intakeDate   !== undefined ? patch.intakeDate : current.intake_date,
    ledger_ref:    patch.ledgerRef    !== undefined ? patch.ledgerRef : current.ledger_ref,
    sort_order:    patch.sortOrder    !== undefined ? patch.sortOrder : current.sort_order,
  };
  db.prepare(`
    UPDATE magazine_placements
    SET party_name=?, size_spec=?, placement_pos=?, status=?, intake_date=?, ledger_ref=?, sort_order=?, updated_at=?
    WHERE id=?
  `).run(
    next.party_name, next.size_spec, next.placement_pos, next.status,
    next.intake_date, next.ledger_ref, next.sort_order, Date.now(), id,
  );
}

export function deletePlacement(id: string, userId: string): void {
  db.prepare('DELETE FROM magazine_placements WHERE id=? AND user_id=?').run(id, userId);
}
