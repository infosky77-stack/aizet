// 명부(registry) DB 스키마 — 순수 SQL 상수(실행 코드 없음).
//
// 명부는 "누가 어떤 업종을 갖고 그 DB가 어디 있는지 + 계정/세션"만 안다. 업종 콘텐츠
// 본체는 각 업종 DB(data/members/<userId>/<industry>.db)에 따로 산다(tenancy 참고).
// 기존 aizet.db와는 별개 파일(data/registry.db)이며, 기존 스키마는 무접촉이다.

/** 회원 계정 코어 — 기존 users에서 계정 식별·권한·구글 폴더만 추린 것 */
export const CREATE_MEMBERS = `
CREATE TABLE IF NOT EXISTS members (
  id              TEXT    PRIMARY KEY,
  email           TEXT    NOT NULL,
  name            TEXT    NOT NULL,
  picture         TEXT    NOT NULL DEFAULT '',
  plan            TEXT    NOT NULL DEFAULT 'free',
  is_super_admin  INTEGER NOT NULL DEFAULT 0,
  drive_folder_id TEXT,
  status          TEXT    NOT NULL DEFAULT 'active',
  regen_count     INTEGER NOT NULL DEFAULT 0,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
)`;

/**
 * 사업장 명부 — 사업장 1개 = 1행 = 독립 DB 1개(id=siteId). 특정 회원을 넣지 않는다
 * (공동소유라 소유·연결은 site_members가 담당). industry는 분류·그룹핑 축, db_path는
 * tenancy.sitePath(userId, siteId) 규칙과 같은 값. 백업 메타 동반.
 */
export const CREATE_SITES = `
CREATE TABLE IF NOT EXISTS sites (
  id              TEXT    PRIMARY KEY,
  industry        TEXT    NOT NULL,
  title           TEXT    NOT NULL DEFAULT '',
  db_path         TEXT    NOT NULL,
  status          TEXT    NOT NULL DEFAULT 'active',
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      INTEGER NOT NULL,
  last_edited_at  INTEGER,
  last_backup_at  INTEGER,
  backup_location TEXT
)`;

/** industry 인덱스 — 업종별 그룹핑 조회용 */
export const CREATE_SITES_IDX = `
CREATE INDEX IF NOT EXISTS idx_sites_industry
  ON sites(industry)`;

/**
 * 사업장↔회원 연결(공동관리) — 한 사업장을 여러 회원이 공동관리한다.
 *   · 한 회원의 사업장 목록 = site_members(member_id) JOIN sites  → 묶음관리·업종 그룹핑
 *   · 한 사업장의 공동관리자 목록 = site_members(site_id)
 *   · "회원 추가" = (site_id, member_id, role='member') 한 행 추가(지금은 이것만, 세분 권한 나중)
 * role: 'owner'(처음 만든 사람) / 'member'(추가된 공동관리자) — 지금은 구분 표시만.
 * PK(site_id, member_id)로 한 사업장에 같은 회원 중복 연결을 원천 차단.
 */
export const CREATE_SITE_MEMBERS = `
CREATE TABLE IF NOT EXISTS site_members (
  site_id   TEXT    NOT NULL,
  member_id TEXT    NOT NULL,
  role      TEXT    NOT NULL DEFAULT 'member',
  added_at  INTEGER NOT NULL,
  PRIMARY KEY (site_id, member_id)
)`;

/** member_id 인덱스(한 회원의 사업장 목록 = 묶음관리), site_id 인덱스(한 사업장의 회원 목록) */
export const CREATE_SITE_MEMBERS_MEMBER_IDX = `
CREATE INDEX IF NOT EXISTS idx_site_members_member
  ON site_members(member_id)`;
export const CREATE_SITE_MEMBERS_SITE_IDX = `
CREATE INDEX IF NOT EXISTS idx_site_members_site
  ON site_members(site_id)`;

/**
 * 세션 — 기존 sessions와 달리 토큰을 평문이 아니라 암호화값(_enc)만 저장한다.
 * (registry/crypto.ts의 encryptToken/decryptToken 경유)
 */
export const CREATE_SESSIONS = `
CREATE TABLE IF NOT EXISTS sessions (
  id                TEXT    PRIMARY KEY,
  sub               TEXT    NOT NULL,
  email             TEXT    NOT NULL,
  name              TEXT    NOT NULL,
  picture           TEXT    NOT NULL DEFAULT '',
  access_token_enc  TEXT    NOT NULL DEFAULT '',
  refresh_token_enc TEXT,
  expires_at        INTEGER NOT NULL,
  plan              TEXT    NOT NULL DEFAULT 'free',
  created_at        INTEGER NOT NULL
)`;

/** 초기화 시 실행할 DDL 목록(순서대로, 전부 IF NOT EXISTS라 멱등) */
export const REGISTRY_SCHEMA: readonly string[] = [
  CREATE_MEMBERS,
  CREATE_SESSIONS,
  CREATE_SITES,
  CREATE_SITES_IDX,
  CREATE_SITE_MEMBERS,
  CREATE_SITE_MEMBERS_MEMBER_IDX,
  CREATE_SITE_MEMBERS_SITE_IDX,
];
