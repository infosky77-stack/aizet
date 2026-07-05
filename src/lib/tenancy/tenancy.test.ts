// 사업장 DB 뼈대(순수 타입·경로 규칙) 테스트
// (기존 조립 테스트와 같은 방식: 순수 tsx 스크립트, checks 배열, process.exit)
//
// 확정 구조: 회원 → 사업장(siteId로 식별, 각 독립 DB) → 명부. 같은 업종 사업장 여러 개는
// 서로 다른 siteId·같은 industry(분류 축)로 표현.
import { sitePath, newSiteId, REGISTRY_DB_PATH, INDUSTRY_KINDS } from './types';
import { resolveSiteDb } from './industryDb';

const checks: [string, boolean][] = [];
const throws = (fn: () => unknown) => { try { fn(); return false; } catch { return true; } };
const PATH_SEG = /^[A-Za-z0-9_-]+$/;

// ── sitePath: 경로 규칙 ──────────────────────────────────────────────────────
checks.push(['sitePath: 회원×사업장 경로', sitePath('u123', 'site-abc') === 'data/members/u123/site-abc.db']);
checks.push(['sitePath: 같은 회원 다른 사업장은 다른 파일', sitePath('u123', 'site-a') === 'data/members/u123/site-a.db'
  && sitePath('u123', 'site-b') === 'data/members/u123/site-b.db']);
checks.push(['sitePath: 앞뒤 공백 트림', sitePath('  u123  ', '  site-x  ') === 'data/members/u123/site-x.db']);

// ── sitePath: 검증(throw) ────────────────────────────────────────────────────
checks.push(['빈 userId → throw', throws(() => sitePath('', 'site-a')) && throws(() => sitePath('   ', 'site-a'))]);
checks.push(['빈 siteId → throw', throws(() => sitePath('u123', '')) && throws(() => sitePath('u123', '   '))]);
checks.push(['경로 조작 userId(구분자·상위이동·점) → throw', throws(() => sitePath('a/b', 'site-a'))
  && throws(() => sitePath('..', 'site-a')) && throws(() => sitePath('a.b', 'site-a'))]);
checks.push(['경로 조작 siteId(구분자·상위이동·점) → throw', throws(() => sitePath('u123', 'a/b'))
  && throws(() => sitePath('u123', '..')) && throws(() => sitePath('u123', 's.b'))]);

// ── newSiteId: 유니크·경로 검증 통과 형식 ────────────────────────────────────
const a = newSiteId(), b = newSiteId();
checks.push(['newSiteId: 2회 호출 서로 다름(유니크)', a !== b]);
checks.push(['newSiteId: 경로 조각 규칙(^[A-Za-z0-9_-]+$) 통과', PATH_SEG.test(a) && PATH_SEG.test(b)]);
checks.push(['newSiteId: site- 접두 + 실제 경로에 그대로 사용 가능', a.startsWith('site-')
  && sitePath('u123', a) === `data/members/u123/${a}.db`]);

// ── resolveSiteDb: ref 형태(industry는 분류 축으로 함께 보관) ────────────────
const ref = resolveSiteDb('u123', 'site-abc', 'education');
checks.push(['resolveSiteDb: userId/siteId/industry/dbPath 채움', ref.userId === 'u123' && ref.siteId === 'site-abc'
  && ref.industry === 'education' && ref.dbPath === 'data/members/u123/site-abc.db']);
checks.push(['resolveSiteDb: 같은 업종 두 사업장은 dbPath만 다르고 industry 동일', (() => {
  const r1 = resolveSiteDb('u123', 'site-1', 'education');
  const r2 = resolveSiteDb('u123', 'site-2', 'education');
  return r1.industry === r2.industry && r1.dbPath !== r2.dbPath;
})()]);
checks.push(['resolveSiteDb: 이상 입력이면 throw(경로함수 위임)', throws(() => resolveSiteDb('a/b', 'site-a', 'education'))
  && throws(() => resolveSiteDb('u123', '..', 'education'))]);

// ── 상수(유지) ───────────────────────────────────────────────────────────────
checks.push(['REGISTRY_DB_PATH = data/aizet.db(임시상태 유지)', REGISTRY_DB_PATH === 'data/aizet.db']);
checks.push(['INDUSTRY_KINDS 6종 유지(분류 축)', INDUSTRY_KINDS.length === 6
  && (['catalog', 'education', 'video', 'print', 'product', 'magazine'] as const).every((k) => INDUSTRY_KINDS.includes(k))]);

let failed = 0;
for (const [name, ok] of checks) { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}`); }
console.log(`\n${checks.length - failed}/${checks.length} passed`);
process.exit(failed === 0 ? 0 : 1);
