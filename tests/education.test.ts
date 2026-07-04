// 한국어교육 테스트 — 스냅샷(가드/프리셋/폴백) + 카드 배치(cardLayout 순수 로직)
import {
  isEducationSnapshot, newEducationUnit, type StudyLang,
} from '../src/lib/super-editor/education/types';
import {
  EPISODE_1_TITLE, episode1Preset, resolveEducationSnapshot,
} from '../src/lib/super-editor/education/preset';
import {
  layoutEducationCard, shrinkToFit, CARD_SIZE_PX,
} from '../src/lib/super-editor/education/cardLayout';
import { buildEbookPages, type EbookPage } from '../src/lib/super-editor/education/ebookPages';
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

// ── 카드 배치(cardLayout) — 순수 계산, 가짜 measure 주입 ────────────────────
const fakeMeasure = (text: string, sizePx: number) => text.length * sizePx * 0.6;
const base = {
  episodeTitle: EPISODE_1_TITLE, char: 'ㅏ', romanization: 'a', exampleKo: '아기',
};

const plain = layoutEducationCard({ ...base, hasIllustration: false }, fakeMeasure);
const texts = (r: typeof plain) => r.blocks.filter((b) => b.kind === 'text') as Extract<(typeof r.blocks)[number], { kind: 'text' }>[];
checks.push(['카드는 정사각 1080', plain.widthPx === CARD_SIZE_PX && plain.heightPx === CARD_SIZE_PX]);
checks.push(['글자 카드: 삽화 슬롯 없음', !plain.blocks.some((b) => b.kind === 'image')]);
checks.push(['글자/로마자/예시단어/제목 텍스트 존재', ['ㅏ', 'a', '아기', EPISODE_1_TITLE].every((t) => texts(plain).some((b) => b.text === t))]);
checks.push(['학습 글자가 가장 큰 폰트', texts(plain).every((b) => b.text === 'ㅏ' || b.fontSizePx < texts(plain).find((x) => x.text === 'ㅏ')!.fontSizePx)]);

const illust = layoutEducationCard({ ...base, hasIllustration: true }, fakeMeasure);
checks.push(['삽화 카드: 삽화 슬롯 1개', illust.blocks.filter((b) => b.kind === 'image').length === 1]);
checks.push([
  '삽화 카드는 글자를 줄여 자리 양보',
  texts(illust).find((b) => b.text === 'ㅏ')!.fontSizePx < texts(plain).find((b) => b.text === 'ㅏ')!.fontSizePx,
]);
checks.push([
  '모든 블록이 캔버스 경계 안',
  [plain, illust].every((r) => r.blocks.every((b) => b.kind === 'text'
    ? b.x >= 0 && b.y >= 0 && b.y < CARD_SIZE_PX
    : b.x >= 0 && b.y >= 0 && b.x + b.w <= CARD_SIZE_PX && b.y + b.h <= CARD_SIZE_PX)),
]);

const longWord = layoutEducationCard({ ...base, exampleKo: '아주아주아주아주아주 긴 예시 단어입니다', hasIllustration: false }, fakeMeasure);
const shortSize = texts(plain).find((b) => b.text === '아기')!.fontSizePx;
const longSize  = texts(longWord).find((b) => b.text.startsWith('아주'))!.fontSizePx;
checks.push(['긴 예시 단어는 폰트 자동 축소', longSize < shortSize]);
checks.push(['축소 하한(minPx) 보장', shrinkToFit('아'.repeat(200), 84, 40, 920, true, fakeMeasure) === 40]);
checks.push(['제목 없으면 제목 블록 생략', !texts(layoutEducationCard({ ...base, episodeTitle: '', hasIllustration: false }, fakeMeasure)).some((b) => b.fontSizePx <= 34 && b.text !== 'a')]);

// ── 이북 페이지 모델(ebookPages) — 플립북·PDF 공용 단일 소스 ────────────────
const ebook = buildEbookPages(preset, 'ko');
const unitPages = ebook.pages.filter((p): p is Extract<EbookPage, { kind: 'unit' }> => p.kind === 'unit');
checks.push(['표지+유닛6+복습 = 8페이지', ebook.pages.length === 8]);
checks.push(['첫 페이지 표지·마지막 복습', ebook.pages[0].kind === 'cover' && ebook.pages[7].kind === 'review']);
checks.push(['표지에 배울 글자 나열', ebook.pages[0].kind === 'cover' && ebook.pages[0].chars.join('') === 'ㅏㅓㅗㅜㅡㅣ']);
checks.push(['유닛 페이지 번호 1~6', unitPages.map((p) => p.index).join(',') === '1,2,3,4,5,6']);
checks.push(['ko 열람은 번역 병기 없음(원문이 본문)', unitPages.every((p) => p.exampleTranslated === null)]);
checks.push(['복습 페이지에 전 글자+로마자', ebook.pages[7].kind === 'review' && ebook.pages[7].items.length === 6]);
checks.push(['정상 스냅샷은 경고 0', ebook.notices.length === 0]);

const ebookJa = buildEbookPages(preset, 'ja');
const jaUnits = ebookJa.pages.filter((p): p is Extract<EbookPage, { kind: 'unit' }> => p.kind === 'unit');
checks.push(['ja 열람은 일본어 번역 병기', jaUnits[0].exampleTranslated === 'あかちゃん']);

const holed = episode1Preset();
holed.units[2] = { ...holed.units[2], char: '  ' }; // 글자 비움
holed.units[4] = { ...holed.units[4], example: { ...holed.units[4].example, ja: '' } }; // ja 번역 비움
const holedJa = buildEbookPages(holed, 'ja');
checks.push(['빈 글자 유닛 제외 + 경고 보고', holedJa.pages.length === 7 && holedJa.notices.length === 1 && holedJa.notices[0].label.includes('3번')]);
checks.push([
  '빈 번역은 병기 없이 원문만(폴백 원칙, 경고 아님)',
  (() => {
    const u = holedJa.pages.filter((p): p is Extract<EbookPage, { kind: 'unit' }> => p.kind === 'unit');
    return u.find((p) => p.char === 'ㅡ')!.exampleTranslated === null && u.find((p) => p.char === 'ㅏ')!.exampleTranslated === 'あかちゃん';
  })(),
]);
checks.push(['제외 후에도 페이지 번호 연속(1~5)', holedJa.pages.filter((p) => p.kind === 'unit').map((p) => (p as Extract<EbookPage, { kind: 'unit' }>).index).join(',') === '1,2,3,4,5']);

let failed = 0;
for (const [name, ok] of checks) { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}`); }
console.log(`\n${checks.length - failed}/${checks.length} passed`);
process.exit(failed === 0 ? 0 : 1);
