// 잡지 광고·원고 게재 항목 — 도메인 타입 (로직 없음)
//
// magazine_placements 테이블(src/lib/db/magazine-placements.ts)과 동일한 shape를
// 의도적으로 중복 정의한다 — ledger의 SEFileDTO가 super_editor_files 테이블 shape를
// 중복 정의하는 것과 같은 이유. lib/db/*는 서버 전용 better-sqlite3 db 싱글턴을 물고
// 있어서, 클라이언트 컴포넌트가 이 모듈을 import했을 때 서버 전용 코드가 번들에 딸려
// 들어가는 걸 막기 위해 domain 레이어에서 값 import 없이 별도로 선언한다.

export type PlacementKind   = 'ad' | 'manuscript';
export type PlacementStatus = 'intake' | 'placed' | 'confirmed';
/** 페이지 안 배치 — 전면/1/2/1/4. PDF 조판 자동화의 입력이므로 자유 텍스트 금지. */
export type PlacementSlot   = 'full' | 'half' | 'quarter';

export interface Placement {
  id:            string;
  order_id:      string;
  user_id:       string;
  kind:          PlacementKind;
  party_name:    string;
  size_spec:     string;
  /** 게재 페이지 번호(1부터). 미정이면 null */
  page_no:       number | null;
  /** 페이지 안 배치. 미정이면 null */
  slot:          PlacementSlot | null;
  status:        PlacementStatus;
  intake_date:   number | null;
  /** 무거운 원본 파일은 여기 없음 — 로컬 원장(FileEntry, src/lib/super-editor/ledger)의
   *  id를 가리키는 포인터일 뿐. 원본 바이트는 서버 DB에 절대 들어오지 않는다. */
  ledger_ref:    string | null;
  sort_order:    number | null;
  /** 예약 필드 — 미수금 모듈이 아직 없어서 오늘은 항상 null.
   *  실제 상태 조회는 이 필드를 직접 읽지 말고 billing.ts의 getReceivableStatus()를 통해서만 한다. */
  receivable_id: string | null;
  created_at:    number;
  updated_at:    number;
}
