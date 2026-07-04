// 한국어교육 스냅샷 테스트 — 가드 · 1편 프리셋 완전성 · 해석 폴백 · StudyLang 동기화
import {
  isEducationSnapshot, newEducationUnit, type StudyLang,
} from '../src/lib/super-editor/education/types';
import {
  EPISODE_1_TITLE, episode1Preset, resolveEducationSnapshot,
} from '../src/lib/super-editor/education/preset';
import { SUPPORTED_LOCALES } from '../src/lib/i18n/types';

const checks: [string, boolean][] = [];
const STUDY_LANGS = SUPPORTED_LOCALES.filter((l): l is StudyLang => l !== 'ko');

// ── 가드 ────────────────────────────────────────────────────────────────────
const preset = episode1Preset();
checks.push(['1편 프리셋은 version 1 가드 통과', isEducationSnapshot(preset)]);
checks.push(['구형/임의 스냅샷은 가드 거부', !isEducationSnapshot({ curriculum: [] }) && !isEducationSnapshot(null) && !isEducationSnapshot('x')]);
checks.push(['version 불일치 거부', !isEducationSnapshot({ ...preset, version: 2 })]);

// ── 1편 프리셋 완전성 — 기본 모음 6개 ──────────────────────────────────────
checks.push(['유닛 6개 (기본 모음)', preset.units.length === 6]);
checks.push(['모음 구성 ㅏㅓㅗㅜㅡㅣ', preset.units.map((u) => u.char).join('') === 'ㅏㅓㅗㅜㅡㅣ']);
checks.push(['로마자 표기 a/eo/o/u/eu/i', preset.units.map((u) => u.romanization).join(',') === 'a,eo,o,u,eu,i']);
checks.push(['유닛 id 유일', new Set(preset.units.map((u) => u.id)).size === 6]);
checks.push(['episodeNo는 1', preset.episodeNo === 1]);
checks.push(['예시 단어(ko) 전부 비지 않음', preset.units.every((u) => u.exampleKo.trim().length > 0)]);
checks.push([
  '전 유닛 × 전 학습 언어 번역 존재(StudyLang 동기화)',
  preset.units.every((u) => STUDY_LANGS.every((l) => u.example[l].trim().length > 0)),
]);
checks.push(['삽화/음성은 미연결(null)로 시작', preset.units.every((u) => u.illustrationRef === null && u.voiceRef === null)]);

// ── 해석 폴백 — 빈/구형 스냅샷은 1편 프리셋으로 시작 ────────────────────────
checks.push(['유효 스냅샷은 그대로 통과(참조 동일)', resolveEducationSnapshot(preset, '무시') === preset]);
const fromEmpty = resolveEducationSnapshot({}, '내 첫 콘텐츠');
checks.push(['빈 스냅샷 → 프리셋 + 콘텐츠 제목 유지', fromEmpty.units.length === 6 && fromEmpty.title === '내 첫 콘텐츠']);
checks.push(['제목 없으면 1편 기본 제목', resolveEducationSnapshot({}, '').title === EPISODE_1_TITLE]);

// ── 새 유닛 ─────────────────────────────────────────────────────────────────
const u1 = newEducationUnit();
const u2 = newEducationUnit({ char: 'ㅑ' });
checks.push(['새 유닛 id 유일 + 전 언어 빈 번역 슬롯', u1.id !== u2.id && STUDY_LANGS.every((l) => u1.example[l] === '')]);
checks.push(['override 반영', u2.char === 'ㅑ']);

let failed = 0;
for (const [name, ok] of checks) { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}`); }
console.log(`\n${checks.length - failed}/${checks.length} passed`);
process.exit(failed === 0 ? 0 : 1);
