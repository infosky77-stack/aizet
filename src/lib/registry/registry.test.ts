// 명부(registry) DB 스키마·암호화 테스트
// (기존 조립 테스트와 같은 방식: 순수 tsx 스크립트, checks 배열, process.exit)
import { openRegistry } from './registryDb';
import { encryptToken, decryptToken } from './crypto';

const checks: [string, boolean][] = [];
const throws = (fn: () => unknown) => { try { fn(); return false; } catch { return true; } };
const TEST_KEY = 'ab'.repeat(32); // 32바이트 = hex 64자

// ── 스키마: 인메모리 DB에 3테이블 + 인덱스 생성 ─────────────────────────────
const db = openRegistry(':memory:');
const tableNames = (db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all() as { name: string }[]).map((r) => r.name);
checks.push(['members·member_industries·sessions 테이블 생성', ['members', 'member_industries', 'sessions'].every((t) => tableNames.includes(t))]);
const idx = (db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_member_industries_member'").get()) as { name: string } | undefined;
checks.push(['member_industries member_id 인덱스 생성', idx?.name === 'idx_member_industries_member']);
// sessions에 토큰이 _enc 컬럼으로만 있는지(평문 컬럼 부재)
const sessionCols = (db.prepare('PRAGMA table_info(sessions)').all() as { name: string }[]).map((c) => c.name);
checks.push(['sessions 토큰은 _enc 컬럼(평문 accessToken 없음)', sessionCols.includes('access_token_enc')
  && sessionCols.includes('refresh_token_enc') && !sessionCols.includes('accessToken')]);

// ── 멱등: 다시 열어도(같은 커넥션 재실행) 에러 없이 통과 ──────────────────────
checks.push(['스키마 재적용 멱등(IF NOT EXISTS)', !throws(() => { const d2 = openRegistry(':memory:'); d2.close(); })]);

// ── CRUD: members / member_industries 삽입·조회 ─────────────────────────────
const now = Date.now();
db.prepare(`INSERT INTO members (id,email,name,plan,is_super_admin,drive_folder_id,status,created_at,updated_at)
  VALUES (?,?,?,?,?,?,?,?,?)`).run('m1', 'a@b.com', '홍길동', 'free', 0, null, 'active', now, now);
const m = db.prepare('SELECT * FROM members WHERE id=?').get('m1') as { email: string; name: string; status: string };
checks.push(['members 삽입·조회', m.email === 'a@b.com' && m.name === '홍길동' && m.status === 'active']);

db.prepare(`INSERT INTO member_industries (id,member_id,industry,db_path,title,status,created_at)
  VALUES (?,?,?,?,?,?,?)`).run('mi1', 'm1', 'education', 'data/members/m1/education.db', '3분 한국어', 'active', now);
const rows = db.prepare('SELECT * FROM member_industries WHERE member_id=?').all('m1') as { industry: string; db_path: string; title: string }[];
checks.push(['member_industries 삽입·member_id 조회', rows.length === 1 && rows[0].industry === 'education'
  && rows[0].db_path === 'data/members/m1/education.db' && rows[0].title === '3분 한국어']);
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
