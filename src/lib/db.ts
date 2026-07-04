import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'aizet.db'));

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          TEXT    PRIMARY KEY,
    email       TEXT    NOT NULL,
    name        TEXT    NOT NULL,
    picture     TEXT    NOT NULL DEFAULT '',
    plan        TEXT    NOT NULL DEFAULT 'free',
    industry    TEXT    NOT NULL DEFAULT '',
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id           TEXT    PRIMARY KEY,
    sub          TEXT    NOT NULL,
    email        TEXT    NOT NULL,
    name         TEXT    NOT NULL,
    picture      TEXT    NOT NULL DEFAULT '',
    accessToken  TEXT    NOT NULL DEFAULT '',
    refreshToken TEXT,
    expiresAt    INTEGER NOT NULL,
    plan         TEXT    NOT NULL DEFAULT 'free',
    industry     TEXT    NOT NULL DEFAULT '',
    createdAt    INTEGER NOT NULL
  );
`);

// ── users 테이블 신규 컬럼 추가 (기존 row 보존, 멱등) ──────────────────────────
{
  const existing = (db.pragma('table_info(users)') as Array<{ name: string }>).map(c => c.name);
  const toAdd: [string, string][] = [
    ['shop_name',      "TEXT NOT NULL DEFAULT ''"],
    ['phone',          "TEXT NOT NULL DEFAULT ''"],
    ['address',        "TEXT NOT NULL DEFAULT ''"],
    ['business_hours', "TEXT NOT NULL DEFAULT ''"],
    ['slug',           'TEXT'],
    ['site_config',      "TEXT NOT NULL DEFAULT '{}'"],
    ['drive_folder_id',  'TEXT'],
    ['regen_count',      'INTEGER NOT NULL DEFAULT 0'],
    ['is_super_admin',   'INTEGER NOT NULL DEFAULT 0'],
  ];
  for (const [col, def] of toAdd) {
    if (!existing.includes(col)) {
      db.exec(`ALTER TABLE users ADD COLUMN ${col} ${def}`);
    }
  }
}

// ── 슬러그 유니크 인덱스 (이미 있으면 무시) ────────────────────────────────────
db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_slug ON users(slug) WHERE slug IS NOT NULL;`);

// ── 거래처 테이블 ──────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS tax_clients (
    id          TEXT    PRIMARY KEY,
    user_id     TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT    NOT NULL,
    biz_number  TEXT    NOT NULL DEFAULT '',
    contact     TEXT    NOT NULL DEFAULT '',
    phone       TEXT    NOT NULL DEFAULT '',
    email       TEXT    NOT NULL DEFAULT '',
    memo        TEXT    NOT NULL DEFAULT '',
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_tax_clients_user_id ON tax_clients(user_id);
`);

// ── 신고 현황 테이블 ────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS tax_filings (
    id          TEXT    PRIMARY KEY,
    client_id   TEXT    NOT NULL REFERENCES tax_clients(id) ON DELETE CASCADE,
    user_id     TEXT    NOT NULL,
    type        TEXT    NOT NULL DEFAULT 'vat',
    year        INTEGER NOT NULL,
    month       INTEGER NOT NULL,
    due_date    TEXT    NOT NULL,
    status      TEXT    NOT NULL DEFAULT 'pending',
    filed_at    INTEGER,
    memo        TEXT    NOT NULL DEFAULT '',
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_tax_filings_user_id   ON tax_filings(user_id);
  CREATE INDEX IF NOT EXISTS idx_tax_filings_client_id ON tax_filings(client_id);
  CREATE INDEX IF NOT EXISTS idx_tax_filings_due_date  ON tax_filings(due_date);
`);

// ── 문서 보관 테이블 ────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS tax_documents (
    id            TEXT    PRIMARY KEY,
    client_id     TEXT    NOT NULL REFERENCES tax_clients(id) ON DELETE CASCADE,
    user_id       TEXT    NOT NULL,
    filename      TEXT    NOT NULL,
    mime_type     TEXT    NOT NULL DEFAULT 'application/octet-stream',
    file_size     INTEGER NOT NULL DEFAULT 0,
    local_path    TEXT,
    drive_file_id TEXT,
    drive_url     TEXT,
    doc_date      TEXT,
    amount        INTEGER,
    vendor        TEXT    NOT NULL DEFAULT '',
    category      TEXT    NOT NULL DEFAULT '',
    ai_raw        TEXT    NOT NULL DEFAULT '',
    ai_confirmed  INTEGER NOT NULL DEFAULT 0,
    deleted_at    INTEGER,
    deleted_by    TEXT,
    created_at    INTEGER NOT NULL,
    updated_at    INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_tax_documents_user_id   ON tax_documents(user_id);
  CREATE INDEX IF NOT EXISTS idx_tax_documents_client_id ON tax_documents(client_id);
  CREATE INDEX IF NOT EXISTS idx_tax_documents_deleted   ON tax_documents(deleted_at);
`);

// ── tax_documents 신규 컬럼 추가 (AI 원본 + 이상치, 멱등) ──────────────────────
{
  const existing = (db.pragma('table_info(tax_documents)') as Array<{ name: string }>).map(c => c.name);
  const toAdd: [string, string][] = [
    ['ai_date',      'TEXT'],
    ['ai_amount',    'INTEGER'],
    ['ai_vendor',    "TEXT NOT NULL DEFAULT ''"],
    ['ai_category',  "TEXT NOT NULL DEFAULT ''"],
    ['anomaly_flag', 'INTEGER NOT NULL DEFAULT 0'],
    ['anomaly_note', "TEXT NOT NULL DEFAULT ''"],
  ];
  for (const [col, def] of toAdd) {
    if (!existing.includes(col)) {
      db.exec(`ALTER TABLE tax_documents ADD COLUMN ${col} ${def}`);
    }
  }
}

// ── 문서 수정이력 테이블 ────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS tax_document_edits (
    id          TEXT    PRIMARY KEY,
    document_id TEXT    NOT NULL,
    user_id     TEXT    NOT NULL,
    field       TEXT    NOT NULL,
    old_value   TEXT,
    new_value   TEXT,
    edited_by   TEXT    NOT NULL DEFAULT '',
    created_at  INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_tax_document_edits_doc ON tax_document_edits(document_id);
`);

// ── 이미지 생성 결제 테이블 ──────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS image_payments (
    id          TEXT    PRIMARY KEY,
    user_id     TEXT    NOT NULL,
    amount      INTEGER NOT NULL,
    item_type   TEXT    NOT NULL DEFAULT 'image_generation',
    toss_key    TEXT,
    status      TEXT    NOT NULL DEFAULT 'pending',
    created_at  INTEGER NOT NULL,
    paid_at     INTEGER
  );
  CREATE INDEX IF NOT EXISTS idx_image_payments_user ON image_payments(user_id);
`);

// ── 메뉴 아이템 테이블 ─────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS menu_items (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       TEXT    NOT NULL,
    price      INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_menu_items_user_id ON menu_items(user_id);
`);

// ── menu_items 테이블 신규 컬럼 추가 (기존 row 보존, 멱등) ─────────────────────
{
  const existing = (db.pragma('table_info(menu_items)') as Array<{ name: string }>).map(c => c.name);
  const toAdd: [string, string][] = [
    ['description', "TEXT NOT NULL DEFAULT ''"],
  ];
  for (const [col, def] of toAdd) {
    if (!existing.includes(col)) {
      db.exec(`ALTER TABLE menu_items ADD COLUMN ${col} ${def}`);
    }
  }
}

// ── 미디어 주문 테이블 (SuperEditor) ──────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS media_orders (
    id          TEXT    PRIMARY KEY,
    user_id     TEXT    NOT NULL,
    order_type  TEXT    NOT NULL DEFAULT 'video',
    title       TEXT    NOT NULL DEFAULT '',
    snapshot    TEXT    NOT NULL DEFAULT '{}',
    is_paid     INTEGER NOT NULL DEFAULT 0,
    payment_id  TEXT,
    status      TEXT    NOT NULL DEFAULT 'editing',
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_media_orders_user   ON media_orders(user_id);
  CREATE INDEX IF NOT EXISTS idx_media_orders_status ON media_orders(status);
`);

// ── 렌더링 잡 큐 테이블 (FullAutoCut / FullAutoShot) ─────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS render_jobs (
    id          TEXT    PRIMARY KEY,
    order_id    TEXT    NOT NULL REFERENCES media_orders(id) ON DELETE CASCADE,
    job_type    TEXT    NOT NULL DEFAULT 'video',
    worker_type TEXT    NOT NULL DEFAULT 'ubuntu_local',
    status      TEXT    NOT NULL DEFAULT 'queued',
    priority    INTEGER NOT NULL DEFAULT 0,
    queued_at   INTEGER NOT NULL,
    started_at  INTEGER,
    done_at     INTEGER,
    error_msg   TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_render_jobs_status ON render_jobs(status);
  CREATE INDEX IF NOT EXISTS idx_render_jobs_order  ON render_jobs(order_id);
`);

// ── render_jobs 신규 컬럼 추가 (출력 파일 UUID 매핑, 멱등) ────────────────────
{
  const existing = (db.pragma('table_info(render_jobs)') as Array<{ name: string }>).map(c => c.name);
  const toAdd: [string, string][] = [
    ['output_uuid', 'TEXT'],
    ['output_path', 'TEXT'],
    ['output_type', 'TEXT'],
  ];
  for (const [col, def] of toAdd) {
    if (!existing.includes(col)) {
      db.exec(`ALTER TABLE render_jobs ADD COLUMN ${col} ${def}`);
    }
  }
}

// ── media_orders 신규 컬럼 추가 (출력 UUID 연결, 멱등) ───────────────────────
{
  const existing = (db.pragma('table_info(media_orders)') as Array<{ name: string }>).map(c => c.name);
  if (!existing.includes('output_uuid')) {
    db.exec(`ALTER TABLE media_orders ADD COLUMN output_uuid TEXT`);
  }
}

// ── 슈퍼에디터 업로드 소재 테이블 ────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS super_editor_files (
    id         TEXT    PRIMARY KEY,
    user_id    TEXT    NOT NULL,
    filename   TEXT    NOT NULL,
    orig_name  TEXT    NOT NULL,
    file_type  TEXT    NOT NULL,
    mime_type  TEXT    NOT NULL,
    size_bytes INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_super_editor_files_user ON super_editor_files(user_id);
`);

// ── super_editor_files 신규 컬럼 추가 (기존 row 보존, 멱등) ───────────────────
{
  const existing = (db.pragma('table_info(super_editor_files)') as Array<{ name: string }>).map(c => c.name);
  const toAdd: [string, string][] = [
    ['content_hash', "TEXT NOT NULL DEFAULT ''"],
    ['sort_order',   'INTEGER'],
    // order_id: NULL = 주문 미지정(구 데이터, 독립 파일 관리자 페이지 업로드) — 그대로 둬서 하위호환
    ['order_id',     'TEXT'],
  ];
  for (const [col, def] of toAdd) {
    if (!existing.includes(col)) {
      db.exec(`ALTER TABLE super_editor_files ADD COLUMN ${col} ${def}`);
    }
  }
  // 기존 row는 sort_order가 NULL — created_at 역순(최신 먼저)과 동일하게 백필
  db.exec(`UPDATE super_editor_files SET sort_order = -created_at WHERE sort_order IS NULL`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_super_editor_files_order ON super_editor_files(order_id)`);
}

// ── 슈퍼에디터 폴더 트리 테이블 (잡지 등 계층 구조용, 공용 코어) ───────────────
// media_orders와 완전히 분리 — 결제 관련 컬럼(is_paid/payment_id/status)이 전혀 없어서
// 폴더 노드는 애초에 결제 함수(markPaid 등)에 넘길 수 있는 id 종류가 아니다.
db.exec(`
  CREATE TABLE IF NOT EXISTS super_editor_folders (
    id                TEXT    PRIMARY KEY,
    user_id           TEXT    NOT NULL,
    parent_folder_id  TEXT    REFERENCES super_editor_folders(id),
    title             TEXT    NOT NULL DEFAULT '',
    domain            TEXT    NOT NULL DEFAULT 'generic',
    sort_order        INTEGER,
    created_at        INTEGER NOT NULL,
    updated_at        INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_super_editor_folders_user   ON super_editor_folders(user_id);
  CREATE INDEX IF NOT EXISTS idx_super_editor_folders_parent ON super_editor_folders(parent_folder_id);
`);

// ── media_orders 신규 컬럼 추가 (폴더 트리 연결, 멱등) ───────────────────────
// folder_id: NULL = 폴더에 안 속함(기존 도록/영상/인쇄 — 지금처럼 단일 평면 유지)
{
  const existing = (db.pragma('table_info(media_orders)') as Array<{ name: string }>).map(c => c.name);
  if (!existing.includes('folder_id')) {
    db.exec(`ALTER TABLE media_orders ADD COLUMN folder_id TEXT`);
  }
  db.exec(`CREATE INDEX IF NOT EXISTS idx_media_orders_folder ON media_orders(folder_id)`);
}

// ── 잡지 광고·원고 게재 항목 테이블 (magazine_placements, 독립 모듈) ─────────
// media_orders와 완전히 분리된 별도 테이블 — 무거운 원본(광고 이미지·원고 파일)은
// 여기 안 두고 로컬 원장(FileEntry)에 두며, ledger_ref는 그 FileEntry.id를 가리키는
// 포인터일 뿐이다. order_id는 media_orders.id에 대한 앱 레벨 참조(FK 강제 없음 —
// foreign_keys pragma가 꺼져있는 이 코드베이스 관례와 동일, 삭제 시 정리는 애플리케이션
// 코드가 담당). receivable_id는 향후 미수금 모듈을 위한 예약 컬럼 — 오늘은 항상 NULL이고
// 어떤 코드도 쓰지 않는다(src/lib/super-editor/placements/billing.ts 참고).
// 게재 위치는 자유 텍스트가 아니라 구조화 컬럼 두 개다 — page_no(몇 페이지) +
// slot(페이지 안 배치: 'full'|'half'|'quarter'). 향후 PDF 조판 자동화가 이 두 값을
// 입력으로 쓰므로 절대 여기에 자유 텍스트 위치 컬럼을 되살리지 말 것.
db.exec(`
  CREATE TABLE IF NOT EXISTS magazine_placements (
    id             TEXT    PRIMARY KEY,
    order_id       TEXT    NOT NULL,
    user_id        TEXT    NOT NULL,
    kind           TEXT    NOT NULL,
    party_name     TEXT    NOT NULL DEFAULT '',
    size_spec      TEXT    NOT NULL DEFAULT '',
    page_no        INTEGER,
    slot           TEXT,
    status         TEXT    NOT NULL DEFAULT 'intake',
    intake_date    INTEGER,
    ledger_ref     TEXT,
    sort_order     INTEGER,
    receivable_id  TEXT,
    created_at     INTEGER NOT NULL,
    updated_at     INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_magazine_placements_order ON magazine_placements(order_id);
  CREATE INDEX IF NOT EXISTS idx_magazine_placements_user  ON magazine_placements(user_id);
`);

// ── magazine_placements 마이그레이션: placement_pos(자유 텍스트) → page_no + slot (멱등) ──
// 초기 스키마로 이미 생성된 DB용. 전 환경에서 데이터 0건일 때(2026-07-04 확인) 바꾸는 것이라
// 값 이관 없이 컬럼만 교체한다.
{
  const cols = (db.pragma('table_info(magazine_placements)') as Array<{ name: string }>).map(c => c.name);
  if (!cols.includes('page_no')) db.exec(`ALTER TABLE magazine_placements ADD COLUMN page_no INTEGER`);
  if (!cols.includes('slot'))    db.exec(`ALTER TABLE magazine_placements ADD COLUMN slot TEXT`);
  if (cols.includes('placement_pos')) db.exec(`ALTER TABLE magazine_placements DROP COLUMN placement_pos`);
}

// ── 쇼핑몰 테이블 (회원별 상품 판매 — user = shop 구조, 모든 행이 user_id 스코프) ──
// products.detail_order_id는 슈퍼에디터 media_orders(order_type='product') 포인터 —
// 상세페이지 스냅샷·파일 원장의 컨테이너를 겸한다. thumbnail_path/detail_image_path는
// "발행 시 공개 디렉토리(data/shop-public)로 복사된 사본" 경로다: 파일 원장(인증 서빙)과
// 구매자 공개 자산의 경계를 여기서 가른다 — 원장 파일을 직접 공개 서빙하지 말 것.
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id                TEXT    PRIMARY KEY,
    user_id           TEXT    NOT NULL,
    name              TEXT    NOT NULL DEFAULT '',
    price             INTEGER NOT NULL DEFAULT 0,
    original_price    INTEGER,
    category          TEXT    NOT NULL DEFAULT '',
    status            TEXT    NOT NULL DEFAULT 'draft',
    thumbnail_path    TEXT,
    detail_order_id   TEXT,
    detail_image_path TEXT,
    sort_order        INTEGER NOT NULL DEFAULT 0,
    created_at        INTEGER NOT NULL,
    updated_at        INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_products_user   ON products(user_id);
  CREATE INDEX IF NOT EXISTS idx_products_status ON products(user_id, status);
`);

// 구매자 주문 — 기존 lib/db/orders.ts(식당 데모, in-memory)와 별개의 영속 테이블.
// v1은 주문 접수까지(PG 없음): status는 판매자가 수동 전환하며, 허용 전이는
// lib/shop/types.ts의 단일 소스(SHOP_ORDER_TRANSITIONS)를 따른다.
// shop_order_items의 name/price는 주문 시점 스냅샷 — 상품이 나중에 수정/삭제돼도
// 주문 내역은 보존된다(product_id는 참고용 포인터일 뿐 JOIN 의존 금지).
db.exec(`
  CREATE TABLE IF NOT EXISTS shop_orders (
    id            TEXT    PRIMARY KEY,
    user_id       TEXT    NOT NULL,
    buyer_name    TEXT    NOT NULL,
    buyer_phone   TEXT    NOT NULL,
    buyer_address TEXT    NOT NULL,
    request       TEXT    NOT NULL DEFAULT '',
    total         INTEGER NOT NULL,
    status        TEXT    NOT NULL DEFAULT 'placed',
    created_at    INTEGER NOT NULL,
    updated_at    INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_shop_orders_user   ON shop_orders(user_id);
  CREATE INDEX IF NOT EXISTS idx_shop_orders_status ON shop_orders(user_id, status);

  CREATE TABLE IF NOT EXISTS shop_order_items (
    id         TEXT    PRIMARY KEY,
    order_id   TEXT    NOT NULL,
    product_id TEXT,
    name       TEXT    NOT NULL,
    price      INTEGER NOT NULL,
    qty        INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_shop_order_items_order ON shop_order_items(order_id);
`);

// 상품 리뷰 — 목록 카드의 별점/리뷰수 집계용(작성 UI는 후속). user_id는 판매자(상점) 스코프.
db.exec(`
  CREATE TABLE IF NOT EXISTS product_reviews (
    id          TEXT    PRIMARY KEY,
    product_id  TEXT    NOT NULL,
    user_id     TEXT    NOT NULL,
    rating      INTEGER NOT NULL,
    body        TEXT    NOT NULL DEFAULT '',
    author_name TEXT    NOT NULL DEFAULT '',
    created_at  INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON product_reviews(product_id);
`);

export default db;
