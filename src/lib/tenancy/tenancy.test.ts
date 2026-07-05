// 업종 DB 뼈대(순수 타입·경로 규칙) 테스트
// (기존 조립 테스트와 같은 방식: 순수 tsx 스크립트, checks 배열, process.exit)
import { industryDbPath, REGISTRY_DB_PATH, INDUSTRY_KINDS, type IndustryKind } from './types';
import { resolveIndustryDb } from './industryDb';

const checks: [string, boolean][] = [];
const throws = (fn: () => unknown) => { try { fn(); return false; } catch { return true; } };

// ── industryDbPath: 경로 규칙 ────────────────────────────────────────────────
checks.push(['industryDbPath: education 경로', industryDbPath('u123', 'education') === 'data/members/u123/education.db']);
checks.push(['industryDbPath: 업종별로 다른 파일', industryDbPath('u123', 'catalog') === 'data/members/u123/catalog.db'
  && industryDbPath('u123', 'video') === 'data/members/u123/video.db']);
checks.push(['industryDbPath: 앞뒤 공백 트림', industryDbPath('  u123  ', 'product') === 'data/members/u123/product.db']);

// ── industryDbPath: 검증(throw) ─────────────────────────────────────────────
checks.push(['빈 userId → throw', throws(() => industryDbPath('', 'education')) && throws(() => industryDbPath('   ', 'education'))]);
checks.push(['경로 조작 userId(구분자·상위이동) → throw', throws(() => industryDbPath('a/b', 'education'))
  && throws(() => industryDbPath('..', 'education')) && throws(() => industryDbPath('a.b', 'education'))]);
checks.push(['이상 industry → throw', throws(() => industryDbPath('u123', 'bogus' as IndustryKind))]);

// ── resolveIndustryDb: ref 형태 ─────────────────────────────────────────────
const ref = resolveIndustryDb('u123', 'education');
checks.push(['resolveIndustryDb: userId/industry/dbPath 채움', ref.userId === 'u123' && ref.industry === 'education'
  && ref.dbPath === 'data/members/u123/education.db']);
checks.push(['resolveIndustryDb: 이상 입력이면 throw(경로함수 위임)', throws(() => resolveIndustryDb('a/b', 'education'))]);

// ── 상수 ────────────────────────────────────────────────────────────────────
checks.push(['REGISTRY_DB_PATH = data/aizet.db', REGISTRY_DB_PATH === 'data/aizet.db']);
checks.push(['INDUSTRY_KINDS 6종 포함', INDUSTRY_KINDS.length === 6
  && (['catalog', 'education', 'video', 'print', 'product', 'magazine'] as const).every((k) => INDUSTRY_KINDS.includes(k))]);

let failed = 0;
for (const [name, ok] of checks) { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}`); }
console.log(`\n${checks.length - failed}/${checks.length} passed`);
process.exit(failed === 0 ? 0 : 1);
