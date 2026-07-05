// 사업장 DB 스키마 — 순수 SQL 상수(실행 코드 없음). registry/schema.ts와 대칭.
//
// 한 사업장(회원×업종) = 독립 DB 1개. 이 스키마는 그 DB에 들어가는 테이블을 정의한다.
// 초기엔 전 사업장 DB에 "동일 전체 스키마"를 깐다(업종마다 일부 테이블은 비어 있음 — 통일
// 스키마라 부트스트랩이 단순하고 빈 테이블 비용은 0). 업종별 분리는 확장 과제.
//
// 컬럼은 기존 aizet.db의 CREATE 문을 정확히 복제하되(ALTER로 붙은 컬럼은 정식 컬럼으로 통합),
// 두 가지만 다르다:
//   1) user_id는 문자열로만 보관한다(registry.members 논리 참조, 파일 간 FK 불가).
//   2) menu_items의 `REFERENCES users(id) ON DELETE CASCADE`는 제거한다 — 사업장 DB에는
//      users 테이블이 없다(users는 공통 registry 소관). 크로스 DB FK는 SQLite에서 불가.
// super_editor_folders의 parent_folder_id self-FK는 같은 DB 안이라 그대로 유지한다.

/** 사업장 정보 1행(id='self') — 기존 users의 사업장 프로필 컬럼을 여기로 내린다 */
export const CREATE_SITE_PROFILE = `
CREATE TABLE IF NOT EXISTS site_profile (
  id             TEXT    PRIMARY KEY,
  shop_name      TEXT    NOT NULL DEFAULT '',
  phone          TEXT    NOT NULL DEFAULT '',
  address        TEXT    NOT NULL DEFAULT '',
  business_hours TEXT    NOT NULL DEFAULT '',
  slug           TEXT    NOT NULL DEFAULT '',
  site_config    TEXT    NOT NULL DEFAULT '',
  updated_at     INTEGER
)`;

/** 이 사업장의 주문만 담긴다(기존 media_orders 컬럼 복제, ALTER분 통합) */
export const CREATE_MEDIA_ORDERS = `
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
  updated_at  INTEGER NOT NULL,
  output_uuid TEXT,
  folder_id   TEXT
)`;

/** 파일 원장 — order_id로 media_orders와 같은 DB 안에서 JOIN된다 */
export const CREATE_SUPER_EDITOR_FILES = `
CREATE TABLE IF NOT EXISTS super_editor_files (
  id           TEXT    PRIMARY KEY,
  user_id      TEXT    NOT NULL,
  filename     TEXT    NOT NULL,
  orig_name    TEXT    NOT NULL,
  file_type    TEXT    NOT NULL,
  mime_type    TEXT    NOT NULL,
  size_bytes   INTEGER NOT NULL DEFAULT 0,
  created_at   INTEGER NOT NULL,
  content_hash TEXT    NOT NULL DEFAULT '',
  sort_order   INTEGER,
  order_id     TEXT
)`;

/** 폴더 트리(parent self-FK는 같은 DB 안이라 유지) */
export const CREATE_SUPER_EDITOR_FOLDERS = `
CREATE TABLE IF NOT EXISTS super_editor_folders (
  id               TEXT    PRIMARY KEY,
  user_id          TEXT    NOT NULL,
  parent_folder_id TEXT    REFERENCES super_editor_folders(id),
  title            TEXT    NOT NULL DEFAULT '',
  domain           TEXT    NOT NULL DEFAULT 'generic',
  sort_order       INTEGER,
  created_at       INTEGER NOT NULL,
  updated_at       INTEGER NOT NULL
)`;

/** 잡지 배치(잡지 업종용, ALTER분 page_no·slot 통합) */
export const CREATE_MAGAZINE_PLACEMENTS = `
CREATE TABLE IF NOT EXISTS magazine_placements (
  id            TEXT    PRIMARY KEY,
  order_id      TEXT    NOT NULL,
  user_id       TEXT    NOT NULL,
  kind          TEXT    NOT NULL,
  party_name    TEXT    NOT NULL DEFAULT '',
  size_spec     TEXT    NOT NULL DEFAULT '',
  status        TEXT    NOT NULL DEFAULT 'intake',
  intake_date   INTEGER,
  ledger_ref    TEXT,
  sort_order    INTEGER,
  receivable_id TEXT,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL,
  page_no       INTEGER,
  slot          TEXT
)`;

/** 제품(쇼핑 업종용, ALTER분 description·thumbnail_ref·detail_json_path 통합) */
export const CREATE_PRODUCTS = `
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
  updated_at        INTEGER NOT NULL,
  description       TEXT    NOT NULL DEFAULT '',
  thumbnail_ref     TEXT,
  detail_json_path  TEXT
)`;

/** 메뉴(음식점 업종용) — 기존 users FK는 제거(사업장 DB엔 users 없음) */
export const CREATE_MENU_ITEMS = `
CREATE TABLE IF NOT EXISTS menu_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     TEXT    NOT NULL,
  name        TEXT    NOT NULL,
  price       INTEGER NOT NULL DEFAULT 0,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  description TEXT    NOT NULL DEFAULT ''
)`;

/** 부트스트랩 시 실행할 DDL 목록(전부 IF NOT EXISTS라 멱등) */
export const SITE_SCHEMA: readonly string[] = [
  CREATE_SITE_PROFILE,
  CREATE_MEDIA_ORDERS,
  CREATE_SUPER_EDITOR_FILES,
  CREATE_SUPER_EDITOR_FOLDERS,
  CREATE_MAGAZINE_PLACEMENTS,
  CREATE_PRODUCTS,
  CREATE_MENU_ITEMS,
];
