// 계정 이전(1회용) — 기존 aizet.db(users/sessions) → 새 registry.db(members/sessions).
//
// 안전 원칙: 원본 aizet.db는 { readonly: true }로 열어 "읽기만"(변경 0). registry.db에만
// 쓴다. 단방향. 앱 런타임 코드(src/)는 무수정 — registry 모듈(openRegistry·encryptToken)만
// 재사용한다. 재실행해도 안전(INSERT OR REPLACE, id 기준 멱등).
//
// 실행: REGISTRY_ENC_KEY=<hex64> npx tsx scripts/migrate-registry.mjs
//   ★ REGISTRY_ENC_KEY(32바이트 hex 64자)가 없으면 세션 토큰을 암호화할 수 없어 중단한다.
//
// member_industries는 이번에 채우지 않는다(업종 DB 확정 후 별도 단계 — 아래 TODO).

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { openRegistry } from '../src/lib/registry/registryDb.ts';
import { encryptToken, decryptToken } from '../src/lib/registry/crypto.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ── [0] REGISTRY_ENC_KEY 선검사 ──────────────────────────────────────────────
const KEY = process.env.REGISTRY_ENC_KEY;
if (!KEY || !/^[0-9a-fA-F]{64}$/.test(KEY)) {
  console.error('❌ REGISTRY_ENC_KEY 미설정/형식오류 — 32바이트 hex(64자)가 필요합니다.');
  console.error('   세션 토큰 암호화를 할 수 없어 이전을 중단합니다.');
  console.error('   예) REGISTRY_ENC_KEY=$(openssl rand -hex 32) npx tsx scripts/migrate-registry.mjs');
  process.exit(1);
}

// ── [1] 연결: 원본 readonly, 명부 쓰기 ───────────────────────────────────────
const src = new Database(path.join(ROOT, 'data', 'aizet.db'), { readonly: true });
const reg = openRegistry(path.join(ROOT, 'data', 'registry.db'));
const now = Date.now();

// ── [2] users → members (regen_count 컬럼 멱등 보장 후 이전) ─────────────────
const memberCols = reg.prepare('PRAGMA table_info(members)').all().map((c) => c.name);
if (!memberCols.includes('regen_count')) {
  // 기존 registry.db가 이전 스키마(regen_count 없음)로 만들어졌다면 여기서 보강
  reg.exec('ALTER TABLE members ADD COLUMN regen_count INTEGER NOT NULL DEFAULT 0');
}

const users = src.prepare('SELECT * FROM users').all();
const insMember = reg.prepare(`
  INSERT OR REPLACE INTO members
    (id, email, name, picture, plan, is_super_admin, drive_folder_id, status, regen_count, created_at, updated_at)
  VALUES
    (@id, @email, @name, @picture, @plan, @is_super_admin, @drive_folder_id, 'active', @regen_count, @created_at, @updated_at)
`);
const migrateMembers = reg.transaction((rows) => {
  for (const u of rows) {
    insMember.run({
      id: u.id,
      email: u.email,
      name: u.name,
      picture: u.picture ?? '',
      plan: u.plan ?? 'free',
      is_super_admin: u.is_super_admin ?? 0,
      drive_folder_id: u.drive_folder_id ?? null,
      regen_count: u.regen_count ?? 0,
      created_at: u.created_at ?? now, // users.created_at은 NOT NULL이나 방어적 폴백
      updated_at: now,
    });
  }
});
migrateMembers(users);
// 사업장 정보(shop_name·phone·address·business_hours·slug·site_config)는 옮기지 않는다 —
// 업종/사이트 DB 소관. 원본 aizet.db에 그대로 남아 있어 유실이 아니다.

// ── [3] sessions → registry.sessions (토큰 평문 → _enc 암호화) ───────────────
const sessions = src.prepare('SELECT * FROM sessions').all();
const insSession = reg.prepare(`
  INSERT OR REPLACE INTO sessions
    (id, sub, email, name, picture, access_token_enc, refresh_token_enc, expires_at, plan, created_at)
  VALUES
    (@id, @sub, @email, @name, @picture, @access_token_enc, @refresh_token_enc, @expires_at, @plan, @created_at)
`);
const migrateSessions = reg.transaction((rows) => {
  for (const s of rows) {
    insSession.run({
      id: s.id,
      sub: s.sub,
      email: s.email,
      name: s.name ?? '',
      picture: s.picture ?? '',
      access_token_enc: encryptToken(s.accessToken ?? ''),   // 빈값이면 '' 통과
      refresh_token_enc: encryptToken(s.refreshToken ?? ''), // null이면 '' 암호화 → ''
      expires_at: s.expiresAt,
      plan: s.plan ?? 'free',
      created_at: s.createdAt,
    });
  }
});
migrateSessions(sessions);

// ── [4] member_industries — 이번엔 채우지 않음 ───────────────────────────────
// TODO(업종 DB 확정 후): media_orders를 (user_id, order_type)로 집계해 각 조합을
//   member_industries 행으로 만들고, db_path = tenancy.industryDbPath(userId, industry)로
//   채운다. title 채우기 정책·업종 DB 부트스트랩은 그 단계에서 결정.

// ── [검증·출력] ──────────────────────────────────────────────────────────────
const srcUsers = src.prepare('SELECT COUNT(*) n FROM users').get().n;
const srcSess = src.prepare('SELECT COUNT(*) n FROM sessions').get().n;
const regMembers = reg.prepare('SELECT COUNT(*) n FROM members').get().n;
const regSess = reg.prepare('SELECT COUNT(*) n FROM sessions').get().n;

console.log('── 이전 결과 ─────────────────────────────');
console.log(`members : aizet.users ${srcUsers} → registry.members ${regMembers} ${srcUsers === regMembers ? '✅' : '⚠불일치'}`);
console.log(`sessions: aizet.sessions ${srcSess} → registry.sessions ${regSess} ${srcSess === regSess ? '✅' : '⚠불일치'}`);

// 토큰 왕복 검증 — 실제 토큰이 있는 세션 1건(민감값은 길이만 출력)
const s0 = sessions.find((s) => s.accessToken) ?? sessions[0];
if (s0) {
  const enc = reg.prepare('SELECT access_token_enc FROM sessions WHERE id=?').get(s0.id).access_token_enc;
  const dec = decryptToken(enc);
  const ok = dec === (s0.accessToken ?? '');
  console.log(`토큰 왕복 검증: ${ok ? '✅ 일치' : '❌ 불일치'} (원본 len ${String(s0.accessToken ?? '').length}, 복호 len ${dec.length}, 암호문 len ${enc.length})`);
}

console.log('원본 aizet.db: readonly로 열어 변경 없음(쓰기 0).');
src.close();
reg.close();
