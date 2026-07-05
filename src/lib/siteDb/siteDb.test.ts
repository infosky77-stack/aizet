// 사업장 DB 부트스트랩(빈 스키마 생성) 테스트
// (기존 조립 테스트와 같은 방식: 순수 tsx 스크립트, checks 배열, process.exit)
import { bootstrapSite, openSiteDb } from './siteDb';
import { SITE_SCHEMA } from './schema';

const checks: [string, boolean][] = [];
const throws = (fn: () => unknown) => { try { fn(); return false; } catch { return true; } };

// ── 부트스트랩: 인메모리 DB에 전체 테이블 생성 ──────────────────────────────
const db = bootstrapSite(':memory:');
const tables = (db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all() as { name: string }[]).map((r) => r.name);
const expected = ['site_profile', 'media_orders', 'render_jobs', 'super_editor_files', 'super_editor_folders', 'magazine_placements', 'products', 'menu_items'];
checks.push(['전체 테이블 생성(8종, render_jobs 포함)', expected.every((t) => tables.includes(t))]);

// menu_items에 users FK 없음(사업장 DB엔 users 테이블 없음)
const fkList = db.prepare('PRAGMA foreign_key_list(menu_items)').all();
checks.push(['menu_items에 users FK 없음(크로스 DB FK 제거)', fkList.length === 0 && !tables.includes('users')]);

// ── site_profile 1행 삽입/조회 ──────────────────────────────────────────────
const now = Date.now();
db.prepare(`INSERT INTO site_profile (id,shop_name,phone,address,business_hours,slug,site_config,updated_at)
  VALUES ('self',?,?,?,?,?,?,?)`).run('미스터차이나', '010-0000', '서울', '10-19', 'mr-china', '{}', now);
const prof = db.prepare("SELECT * FROM site_profile WHERE id='self'").get() as { shop_name: string; slug: string };
checks.push(['site_profile 1행(self) 삽입·조회', prof.shop_name === '미스터차이나' && prof.slug === 'mr-china']);

// ── media_orders + super_editor_files → order_id JOIN(같은 DB 안) ───────────
db.prepare(`INSERT INTO media_orders (id,user_id,order_type,title,created_at,updated_at)
  VALUES ('o1','u123','education','3분 한국어',?,?)`).run(now, now);
db.prepare(`INSERT INTO super_editor_files (id,user_id,filename,orig_name,file_type,mime_type,created_at,order_id)
  VALUES ('f1','u123','a.png','원본.png','image','image/png',?, 'o1')`).run(now);
const joined = db.prepare(`
  SELECT f.orig_name, o.title, o.order_type FROM super_editor_files f
  JOIN media_orders o ON o.id = f.order_id WHERE f.id='f1'`).get() as { orig_name: string; title: string; order_type: string };
checks.push(['files ↔ orders order_id JOIN(같은 DB 안)', joined.orig_name === '원본.png'
  && joined.title === '3분 한국어' && joined.order_type === 'education']);

// ── render_jobs ↔ media_orders order_id JOIN(같은 DB 안, FK 순서로 생성됨) ──
db.prepare(`INSERT INTO render_jobs (id,order_id,job_type,status,priority,queued_at,output_uuid,output_type)
  VALUES ('j1','o1','catalog','done',0,?, 'uuid-1','pdf')`).run(now);
const jobJoin = db.prepare(`
  SELECT j.status, j.output_type, o.title FROM render_jobs j
  JOIN media_orders o ON o.id = j.order_id WHERE j.id='j1'`).get() as { status: string; output_type: string; title: string };
checks.push(['render_jobs ↔ orders order_id JOIN(같은 DB 안)', jobJoin.status === 'done'
  && jobJoin.output_type === 'pdf' && jobJoin.title === '3분 한국어']);

// ── 멱등: 스키마 재적용해도 테이블·데이터 안 깨짐 ────────────────────────────
checks.push(['스키마 재적용(SITE_SCHEMA) 멱등', !throws(() => { for (const ddl of SITE_SCHEMA) db.exec(ddl); })]);
const stillThere = db.prepare("SELECT COUNT(*) n FROM media_orders").get() as { n: number };
checks.push(['재적용 후 기존 데이터 보존', stillThere.n === 1]);
db.close();

// 다시 부트스트랩(새 인메모리)해도 에러 없이 전체 테이블
checks.push(['재부트스트랩 안전', !throws(() => { const d2 = bootstrapSite(':memory:'); d2.close(); })]);

// ── openSiteDb: sitePath 경로 위임(이상 입력이면 throw) ──────────────────────
checks.push(['openSiteDb: 이상 userId면 throw(sitePath 위임)', throws(() => openSiteDb('a/b', 'site-x'))
  && throws(() => openSiteDb('u123', '..'))]);

let failed = 0;
for (const [name, ok] of checks) { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}`); }
console.log(`\n${checks.length - failed}/${checks.length} passed`);
process.exit(failed === 0 ? 0 : 1);
