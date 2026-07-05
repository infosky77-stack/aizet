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
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
)`;

/**
 * 회원×업종 명부 — (member_id, industry, title) 조합이 "한 회원의 한 업종".
 * db_path는 해당 업종 DB 위치(tenancy.industryDbPath 규칙과 같은 값). 백업 메타 동반.
 */
export const CREATE_MEMBER_INDUSTRIES = `
CREATE TABLE IF NOT EXISTS member_industries (
  id              TEXT    PRIMARY KEY,
  member_id       TEXT    NOT NULL,
  industry        TEXT    NOT NULL,
  db_path         TEXT    NOT NULL,
  title           TEXT    NOT NULL DEFAULT '',
  status          TEXT    NOT NULL DEFAULT 'active',
  created_at      INTEGER NOT NULL,
  last_edited_at  INTEGER,
  last_backup_at  INTEGER,
  backup_location TEXT
)`;

/** member_id 인덱스 — 한 회원의 업종 목록 조회용 */
export const CREATE_MEMBER_INDUSTRIES_IDX = `
CREATE INDEX IF NOT EXISTS idx_member_industries_member
  ON member_industries(member_id)`;

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
  CREATE_MEMBER_INDUSTRIES,
  CREATE_MEMBER_INDUSTRIES_IDX,
  CREATE_SESSIONS,
];
