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
import { newSiteId, sitePath } from '../src/lib/tenancy/types.ts';

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

// ── [4] 사업장 명부(sites) + 소유 연결(site_members) 시드 ────────────────────
// 현재 데이터는 "한 회원 = 한 사업장(업종당)"이라, 각 (회원 × 업종) 조합을 사업장 1개로
// 시드한다. tenancy.newSiteId()로 siteId를 발급하고 sitePath로 db_path를 계산한다.
//
// ★멱등: siteId가 매번 랜덤이라 INSERT OR REPLACE로는 멱등이 안 된다. 대신 "이 회원의
//   이 업종 사업장이 이미 site_members+sites에 있는지"를 확인해, 없을 때만 새로 만든다.
//   (이 시드는 "회원×업종 조합당 사업장 1개"를 초기 1회 부여하는 용도 — 이후 추가 사업장은
//    앱에서 생성하며, 재실행 시 기존 조합은 전부 건너뛴다.)
const combos = src.prepare(`
  SELECT user_id, order_type, MIN(created_at) first_created, MAX(updated_at) last_updated
  FROM media_orders GROUP BY user_id, order_type ORDER BY user_id, order_type
`).all();

const findShopName = src.prepare('SELECT shop_name FROM users WHERE id=?');
const existsSiteForMemberIndustry = reg.prepare(`
  SELECT s.id FROM site_members sm JOIN sites s ON s.id = sm.site_id
  WHERE sm.member_id = ? AND s.industry = ? LIMIT 1
`);
const insSite = reg.prepare(`
  INSERT INTO sites (id, industry, title, db_path, status, sort_order, created_at, last_edited_at, last_backup_at, backup_location)
  VALUES (@id, @industry, @title, @db_path, 'active', @sort_order, @created_at, @last_edited_at, NULL, NULL)
`);
const insOwnerLink = reg.prepare(`
  INSERT OR IGNORE INTO site_members (site_id, member_id, role, added_at) VALUES (?, ?, 'owner', ?)
`);

const sortByMember = new Map(); // 회원별 sort_order 순번(0,1,2…)
let seededSites = 0;
const seedSites = reg.transaction((rows) => {
  for (const c of rows) {
    if (existsSiteForMemberIndustry.get(c.user_id, c.order_type)) continue; // 멱등: 이미 있으면 skip
    const siteId = newSiteId();
    const title = (findShopName.get(c.user_id)?.shop_name ?? '').trim(); // 없으면 빈값(업종 표시명은 앱에서)
    const ord = sortByMember.get(c.user_id) ?? 0;
    sortByMember.set(c.user_id, ord + 1);
    insSite.run({
      id: siteId,
      industry: c.order_type,
      title,
      db_path: sitePath(c.user_id, siteId),
      sort_order: ord,
      created_at: c.first_created ?? now,
      last_edited_at: c.last_updated ?? now,
    });
    insOwnerLink.run(siteId, c.user_id, now); // 소유자(owner) 1명. 공동관리자는 앱의 "회원 추가"에서
    seededSites++;
  }
});
seedSites(combos);

// ── order 없는 업종 시드(선결2) — menu_items 보유 회원의 서비스 업종 사업장 ─────
// media_orders(order_type) 조합엔 없지만 menu_items 같은 order 없는 콘텐츠를 가진 회원은
// sites에 안 잡힌다. industry는 users.industry(예: 'beauty')를 쓴다(sites.industry는 TEXT라 수용).
// 멱등은 위와 동일(existsSiteForMemberIndustry). insSite·insOwnerLink 재사용.
const findIndustry = src.prepare('SELECT industry FROM users WHERE id=?');
const orderlessOwners = src.prepare('SELECT DISTINCT user_id FROM menu_items').all();
let seededOrderless = 0;
const seedOrderless = reg.transaction((rows) => {
  for (const r of rows) {
    const industry = (findIndustry.get(r.user_id)?.industry ?? '').trim() || 'service'; // 빈값이면 'service'
    if (existsSiteForMemberIndustry.get(r.user_id, industry)) continue; // 멱등
    const siteId = newSiteId();
    const title = (findShopName.get(r.user_id)?.shop_name ?? '').trim();
    const ord = sortByMember.get(r.user_id) ?? 0;
    sortByMember.set(r.user_id, ord + 1);
    insSite.run({
      id: siteId, industry, title, db_path: sitePath(r.user_id, siteId),
      sort_order: ord, created_at: now, last_edited_at: now,
    });
    insOwnerLink.run(siteId, r.user_id, now);
    seededOrderless++;
  }
});
seedOrderless(orderlessOwners);

// ── [검증·출력] ──────────────────────────────────────────────────────────────
const srcUsers = src.prepare('SELECT COUNT(*) n FROM users').get().n;
const srcSess = src.prepare('SELECT COUNT(*) n FROM sessions').get().n;
const regMembers = reg.prepare('SELECT COUNT(*) n FROM members').get().n;
const regSess = reg.prepare('SELECT COUNT(*) n FROM sessions').get().n;

const comboCount = src.prepare('SELECT COUNT(*) n FROM (SELECT 1 FROM media_orders GROUP BY user_id, order_type)').get().n;
const regSites = reg.prepare('SELECT COUNT(*) n FROM sites').get().n;
const regLinks = reg.prepare('SELECT COUNT(*) n FROM site_members').get().n;

console.log('── 이전 결과 ─────────────────────────────');
console.log(`members : aizet.users ${srcUsers} → registry.members ${regMembers} ${srcUsers === regMembers ? '✅' : '⚠불일치'}`);
console.log(`sessions: aizet.sessions ${srcSess} → registry.sessions ${regSess} ${srcSess === regSess ? '✅' : '⚠불일치'}`);
console.log(`sites   : (회원×업종) 조합 ${comboCount} → registry.sites ${regSites} (이번 시드 ${seededSites}) ${comboCount === regSites ? '✅' : '⚠불일치'}`);
console.log(`site_members(owner): ${regLinks}`);

// 한 회원(infosky77) 사업장 목록 샘플(member_id JOIN sites, 업종별)
const mySub = '112873040654574135275';
const myList = reg.prepare(`
  SELECT s.industry, s.title, s.db_path FROM site_members sm
  JOIN sites s ON s.id = sm.site_id WHERE sm.member_id=? ORDER BY s.sort_order
`).all(mySub);
console.log(`infosky77 사업장 ${myList.length}개:`);
for (const s of myList) console.log(`  - industry=${s.industry} title="${s.title || '(빈)'}" db=${s.db_path}`);

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
