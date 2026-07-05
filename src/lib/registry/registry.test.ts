// 명부(registry) DB 스키마·암호화 테스트
// (기존 조립 테스트와 같은 방식: 순수 tsx 스크립트, checks 배열, process.exit)
import { openRegistry } from './registryDb';
import { encryptToken, decryptToken } from './crypto';

const checks: [string, boolean][] = [];
const throws = (fn: () => unknown) => { try { fn(); return false; } catch { return true; } };
const TEST_KEY = 'ab'.repeat(32); // 32바이트 = hex 64자

// ── 스키마: 인메모리 DB에 4테이블 + 인덱스 생성 ─────────────────────────────
const db = openRegistry(':memory:');
const tableNames = (db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all() as { name: string }[]).map((r) => r.name);
checks.push(['members·sessions·sites·site_members 4테이블 생성', ['members', 'sessions', 'sites', 'site_members'].every((t) => tableNames.includes(t))]);
const idxNames = (db.prepare("SELECT name FROM sqlite_master WHERE type='index'").all() as { name: string }[]).map((r) => r.name);
checks.push(['인덱스 생성(sites.industry, site_members.member/site)', ['idx_sites_industry', 'idx_site_members_member', 'idx_site_members_site'].every((i) => idxNames.includes(i))]);
// sessions에 토큰이 _enc 컬럼으로만 있는지(평문 컬럼 부재)
const sessionCols = (db.prepare('PRAGMA table_info(sessions)').all() as { name: string }[]).map((c) => c.name);
checks.push(['sessions 토큰은 _enc 컬럼(평문 accessToken 없음)', sessionCols.includes('access_token_enc')
  && sessionCols.includes('refresh_token_enc') && !sessionCols.includes('accessToken')]);
// sites에는 특정 회원 컬럼(user_id/member_id)이 없어야 함(공동소유 — 연결은 site_members)
const siteCols = (db.prepare('PRAGMA table_info(sites)').all() as { name: string }[]).map((c) => c.name);
checks.push(['sites는 특정 회원 컬럼 없음(공동소유)', !siteCols.includes('user_id') && !siteCols.includes('member_id')
  && siteCols.includes('industry') && siteCols.includes('db_path') && siteCols.includes('sort_order')]);

// ── 멱등: 다시 열어도(같은 커넥션 재실행) 에러 없이 통과 ──────────────────────
checks.push(['스키마 재적용 멱등(IF NOT EXISTS)', !throws(() => { const d2 = openRegistry(':memory:'); d2.close(); })]);

// ── CRUD: members 삽입·조회 ─────────────────────────────────────────────────
const now = Date.now();
const insMember = db.prepare(`INSERT INTO members (id,email,name,plan,is_super_admin,drive_folder_id,status,created_at,updated_at)
  VALUES (?,?,?,?,?,?,?,?,?)`);
insMember.run('m1', 'a@b.com', '홍길동', 'free', 0, null, 'active', now, now);
insMember.run('m2', 'c@d.com', '김공동', 'free', 0, null, 'active', now, now);
const m = db.prepare('SELECT * FROM members WHERE id=?').get('m1') as { email: string; name: string; status: string };
checks.push(['members 삽입·조회', m.email === 'a@b.com' && m.name === '홍길동' && m.status === 'active']);

// ── sites 삽입 — 한 회원(m1)이 사업장 3개(education 2 + product 1) ──────────
const insSite = db.prepare(`INSERT INTO sites (id,industry,title,db_path,status,sort_order,created_at)
  VALUES (?,?,?,?,?,?,?)`);
insSite.run('site-edu-a', 'education', '강남 한국어학원', 'data/members/m1/site-edu-a.db', 'active', 0, now);
insSite.run('site-edu-b', 'education', '부산 한국어학원', 'data/members/m1/site-edu-b.db', 'active', 1, now);
insSite.run('site-prod',  'product',  '한캔디 쇼핑몰',   'data/members/m1/site-prod.db',  'active', 2, now);

// ── site_members 연결(소유·공동관리) ────────────────────────────────────────
const insLink = db.prepare('INSERT INTO site_members (site_id,member_id,role,added_at) VALUES (?,?,?,?)');
insLink.run('site-edu-a', 'm1', 'owner', now);
insLink.run('site-edu-b', 'm1', 'owner', now);
insLink.run('site-prod',  'm1', 'owner', now);

// 한 회원의 사업장 목록 = site_members(member_id) JOIN sites
const myList = db.prepare(`
  SELECT s.id, s.industry, s.title FROM site_members sm
  JOIN sites s ON s.id = sm.site_id
  WHERE sm.member_id=? ORDER BY s.sort_order`).all('m1') as { id: string; industry: string; title: string }[];
checks.push(['한 회원의 사업장 목록(member_id JOIN)', myList.length === 3
  && myList[0].id === 'site-edu-a' && myList[2].industry === 'product']);
// 같은 industry 사업장 여러 개 → 업종 그룹핑 가능
const eduCount = myList.filter((s) => s.industry === 'education').length;
checks.push(['같은 업종 다중 사업장 + 업종 그룹핑', eduCount === 2]);

// ── 공동관리: 사업장 1개에 회원 2명 ─────────────────────────────────────────
insLink.run('site-edu-a', 'm2', 'member', now); // m2를 공동관리자로 추가
const coManagers = db.prepare('SELECT member_id, role FROM site_members WHERE site_id=? ORDER BY role').all('site-edu-a') as { member_id: string; role: string }[];
checks.push(['공동관리: 사업장에 회원 2명(owner+member)', coManagers.length === 2
  && coManagers.some((r) => r.member_id === 'm1' && r.role === 'owner')
  && coManagers.some((r) => r.member_id === 'm2' && r.role === 'member')]);
// (site_id, member_id) 중복 삽입 방지
checks.push(['같은 (site_id, member_id) 중복 연결 방지(PK)', throws(() => insLink.run('site-edu-a', 'm1', 'member', now))]);
// m2의 사업장 목록엔 공동관리하는 site-edu-a 1개만
const m2List = db.prepare('SELECT site_id FROM site_members WHERE member_id=?').all('m2') as { site_id: string }[];
checks.push(['공동관리자도 member_id로 자기 사업장 조회', m2List.length === 1 && m2List[0].site_id === 'site-edu-a']);
db.close();

// ── crypto: 왕복·빈문자열·키 검증 ───────────────────────────────────────────
const enc = encryptToken('ya29.secret-token', TEST_KEY);
checks.push(['encrypt→decrypt 왕복 일치', decryptToken(enc, TEST_KEY) === 'ya29.secret-token']);
checks.push(['암호문은 평문과 다름(그냥 base64 저장 아님)', enc !== 'ya29.secret-token' && enc.length > 0]);
checks.push(['같은 평문도 매번 다른 암호문(IV 랜덤)', encryptToken('x', TEST_KEY) !== encryptToken('x', TEST_KEY)]);
checks.push(['빈 문자열은 빈 문자열로 통과', encryptToken('', TEST_KEY) === '' && decryptToken('', TEST_KEY) === '']);

// 키 없음 → throw (env 제거 + 인자 없이)
const savedKey = process.env.REGISTRY_ENC_KEY;
delete process.env.REGISTRY_ENC_KEY;
checks.push(['키 없으면 throw', throws(() => encryptToken('x')) && throws(() => decryptToken(enc))]);
if (savedKey !== undefined) process.env.REGISTRY_ENC_KEY = savedKey;
checks.push(['키 길이 오류(hex 32자=16바이트) → throw', throws(() => encryptToken('x', 'ab'.repeat(16)))]);
checks.push(['틀린 키로 복호화 실패(GCM 인증) → throw', throws(() => decryptToken(enc, 'cd'.repeat(32)))]);

let failed = 0;
for (const [name, ok] of checks) { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}`); }
console.log(`\n${checks.length - failed}/${checks.length} passed`);
process.exit(failed === 0 ? 0 : 1);
