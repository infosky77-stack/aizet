// 슈퍼에디터 파일 원장 — 타입 정의 (로직 없음)
//
// 핵심 철학: 원장은 "파일"이 아니라 "파일이 어디 사는지에 대한 참조"를 관리한다.
// 하나의 FileEntry(물리적으로 하나의 파일, contentHash로 식별)는 0개 이상의 위치(locations)에
// 동시에 존재할 수 있다 — 로컬 기기(OPFS), 사용자가 지정한 실제 컴퓨터 폴더(userFolder),
// 서버, (스텁으로만 존재, 미사용) 사용자 구글 드라이브.
// 상태(status)나 표시용 URL은 이 파일에 저장하지 않는다 — locations[] 로부터 항상 계산해서
// selectors.ts 가 파생시킨다. "저장된 status와 실제 locations가 서로 어긋나는" 버그 클래스를
// 구조적으로 없애기 위함(=단일 진실 원천 원칙).

export type FileLocationKind = 'local' | 'userDrive' | 'userFolder' | 'serverLight' | 'cache';

export interface FileLocationRef {
  kind:      FileLocationKind;
  status:    'pending' | 'present' | 'error';
  /** 위치별로 의미가 다른 참조값 — OPFS 파일명 / 사용자 폴더 내 파일명 / 서버 파일 id / Drive 파일 id / 캐시 키 */
  ref:       string;
  updatedAt: number;
  error?:    string;
}

// 오늘 사실상 전체 파이프라인(썸네일·업로드·중복판정)이 뒷받침하는 건 'image' 뿐이다.
// 'video'|'audio'는 기존 슈퍼에디터 업로드가 이미 다루던 종류라 유지하고,
// 'text'|'print'는 향후(원고·인쇄물) 확장을 위해 타입만 미리 열어둔다 — 지금은 미사용.
export type FileEntryKind = 'image' | 'video' | 'audio' | 'text' | 'print';

export type FileEntryStatus = 'uploading' | 'ready' | 'error';

export interface FileEntry {
  /** 생성된 순간 정해지면 이 엔트리의 수명 동안 절대 바뀌지 않음 — React key, 캐시 키로 사용 */
  id:         string;
  /** 클라이언트에서 비동기로 계산(선택적 병합용) — 서버가 재계산하는 값이 항상 최종 권위 */
  contentHash?: string;
  kind:       FileEntryKind;
  origName:   string;
  mimeType:   string;
  sizeBytes:  number;
  locations:  FileLocationRef[];
  /** serverLight 위치가 present 가 되면 채워짐 — URL 조립에 필요(위치 자체와는 분리) */
  userId?:    string;
  filename?:  string;
  /** 이 파일이 속한 주문(도록/영상/인쇄) id — 주문 미지정(독립 파일 관리자 페이지) 이면 없음 */
  orderId?:   string;
  /** ingest 시점에 즉석 생성되는 blob URL — 어떤 위치도 아직 present 가 아닐 때만 쓰는 낙관적 미리보기.
   *  locations 가 아닌 이유: 이건 "저장된 곳"이 아니라 "아직 아무 데도 저장되기 전의 화면용 가림막"이라서. */
  previewUrl?: string;
  /** 예약 필드 — 오늘은 아무 모듈도 채우지 않음(워터마크/보안코드 기능 없음) */
  securityStatus?: { watermarked?: boolean; code?: string };
  /** 예약 필드 — 오늘은 아무 모듈도 채우지 않음(쇼핑몰/도록 상품 연결 기능 없음) */
  mappedTo?:  { kind: string; id: string }[];
  sortOrder:  number;
  createdAt:  number;
  /** 클라이언트 메모리에만 존재 — 재시도용 원본 File. 위치가 아니고, 저장/전송되지 않음 */
  retryFile?: File;
}

export interface LedgerNotice {
  id:      string;
  kind:    'duplicate' | 'renamed' | 'error';
  message: string;
}

// 서버가 내려주는 파일 레코드(=serverLight 위치의 원천) — src/lib/db/super-editor-files.ts 와 동일 shape
export interface SEFileDTO {
  id:            string;
  user_id:       string;
  filename:      string;
  orig_name:     string;
  file_type:     'image' | 'video' | 'audio';
  mime_type:     string;
  size_bytes:    number;
  content_hash?: string;
  sort_order?:   number;
  order_id?:     string | null;
  created_at:    number;
}

// ── 위치 어댑터 공용 인터페이스 ───────────────────────────────────────────────
// 어댑터는 절대 throw 하지 않는다 — 실패는 반드시 결과 객체로 돌려줘서 호출부(store)가
// "이 위치는 실패했지만 다른 위치는 계속 진행"할 수 있게 한다. 이게 안전성 원칙의 핵심 경계.
export interface LocationSaveResult {
  ok:   boolean;
  ref?: string;
  error?: string;
  /** serverLight 전용 — 서버의 중복/이름충돌 판정 결과 */
  outcome?: 'created' | 'duplicate' | 'renamed';
  dto?: SEFileDTO;
  renamedFrom?: string;
}

export interface LocationAdapter {
  kind: FileLocationKind;
  isSupported(): boolean;
  save(entryId: string, file: File, meta: { mimeType: string; origName: string; orderId?: string }): Promise<LocationSaveResult>;
  resolveUrl(ref: string): Promise<string | null>;
  remove(ref: string): Promise<void>;
}
