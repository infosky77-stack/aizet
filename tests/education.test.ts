// 한국어교육 테스트 — 스냅샷(가드/프리셋/폴백) + 카드 배치(cardLayout 순수 로직)
import {
  isEducationSnapshot, newEducationUnit, type StudyLang,
} from '../src/lib/super-editor/education/types';
import {
  EPISODE_1_TITLE, episode1Preset, resolveEducationSnapshot,
} from '../src/lib/super-editor/education/preset';
import {
  layoutEducationCard, layoutEducationSceneCard, shrinkToFit, unitPalette,
  CARD_SIZE_PX, SCENE_W_PX, SCENE_H_PX, UNIT_PALETTES,
} from '../src/lib/super-editor/education/cardLayout';
import { buildEbookPages, type EbookPage } from '../src/lib/super-editor/education/ebookPages';
import { deriveEducationVideo } from '../src/lib/super-editor/education/toVideoScenes';
import {
  toPublishedEpisode, publishedToEbookInput, isPublishedEducationEpisode,
} from '../src/lib/super-editor/education/published';
import { isVideoProjectSnapshot } from '../src/lib/super-editor/video/types';
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

// ── 유닛 팔레트 + 색 역할(글자=딥컬러 / 로마자=amber / 예시=잉크) ────────────
checks.push(['팔레트는 유닛 수만큼 순환', unitPalette(0) === UNIT_PALETTES[0] && unitPalette(6) === UNIT_PALETTES[0] && unitPalette(7) === UNIT_PALETTES[1]]);
const colored = layoutEducationCard({ ...base, hasIllustration: false, unitIndex: 3 }, fakeMeasure);
checks.push(['글자는 유닛 딥컬러', texts(colored).find((b) => b.text === 'ㅏ')!.color === UNIT_PALETTES[3].deep]);
checks.push(['로마자는 amber, 예시는 잉크(색 역할 구분)',
  texts(colored).find((b) => b.text === 'a')!.color === '#b45309'
  && texts(colored).find((b) => b.text === '아기')!.color === '#1c1917']);
checks.push(['글자 카드에 흰 라운드 판', colored.blocks.some((b) => b.kind === 'rect' && b.color === '#ffffff' && (b.radiusPx ?? 0) > 0)]);
checks.push(['unitIndex 생략 시 첫 팔레트(기존 호출 호환)', texts(plain).find((b) => b.text === 'ㅏ')!.color === UNIT_PALETTES[0].deep]);

// ── 영상 장면 카드(16:9) 배치 ────────────────────────────────────────────────
const sceneChar = layoutEducationSceneCard({ kind: 'char', char: 'ㅏ', romanization: 'a', unitIndex: 0 }, fakeMeasure);
const sceneTexts = texts(sceneChar as ReturnType<typeof layoutEducationCard>);
checks.push(['장면 카드는 영상 출력과 같은 1280×720', sceneChar.widthPx === SCENE_W_PX && sceneChar.heightPx === SCENE_H_PX]);
checks.push(['글자 장면: 글자 320px 이상(기존 51px 대비 대폭 확대)', sceneTexts.find((b) => b.text === 'ㅏ')!.fontSizePx >= 320]);
checks.push(['글자 장면: 글자 딥컬러 + 로마자 amber', sceneTexts.find((b) => b.text === 'ㅏ')!.color === UNIT_PALETTES[0].deep
  && sceneTexts.find((b) => b.text === 'a')!.color === '#b45309']);

const sceneReview = layoutEducationSceneCard({ kind: 'review', chars: ['ㅏ', 'ㅓ', 'ㅗ', 'ㅜ', 'ㅡ', 'ㅣ'] }, fakeMeasure);
const reviewTexts = texts(sceneReview as ReturnType<typeof layoutEducationCard>);
checks.push(['복습 장면: 글자 6개 각자 유닛 컬러', reviewTexts.length === 6
  && reviewTexts.every((b, i) => b.color === UNIT_PALETTES[i].deep)]);
checks.push(['복습 장면: 글자들이 화면 폭 안에 배치', reviewTexts.every((b) => b.x >= 80 && b.x <= SCENE_W_PX - 80)]);

const sceneExample = layoutEducationSceneCard({ kind: 'example', text: '아기', unitIndex: 2 }, fakeMeasure);
checks.push(['예시 장면: 유닛 딥컬러 + 64px 이상', (() => {
  const t = texts(sceneExample as ReturnType<typeof layoutEducationCard>)[0];
  return t.color === UNIT_PALETTES[2].deep && t.fontSizePx >= 64;
})()]);

const sceneTitle = layoutEducationSceneCard({ kind: 'title', text: '3분 한국어 1편' }, fakeMeasure);
checks.push(['타이틀 장면: 딥 배경 + 흰 글자', sceneTitle.blocks.some((b) => b.kind === 'rect' && b.color === '#92400e')
  && texts(sceneTitle as ReturnType<typeof layoutEducationCard>)[0].color === '#ffffff']);
checks.push(['장면 블록 전부 16:9 경계 안', [sceneChar, sceneReview, sceneExample, sceneTitle].every((r) => r.blocks.every((b) => b.kind === 'text'
  ? b.x >= 0 && b.y >= 0 && b.y < SCENE_H_PX
  : b.x >= 0 && b.y >= 0 && b.x + b.w <= SCENE_W_PX && b.y + b.h <= SCENE_H_PX))]);

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

// ── 영상 파생(toVideoScenes) — 순수 변환기, 기존 파이프라인 계약 준수 ────────
const dv = deriveEducationVideo(preset);
const sc = dv.project.scenes;
checks.push(['파생물은 version 2 영상 가드 통과', isVideoProjectSnapshot(dv.project)]);
checks.push(['장면 구성: 인트로+유닛(글자·예시)×6+복습+아웃트로 = 15', sc.length === 15]);
checks.push(['인트로/복습/아웃트로 순서와 fade', sc[0].id === 'edu-intro' && sc[0].transition === 'fade'
  && sc[13].id === 'edu-review' && sc[14].id === 'edu-outro']);
checks.push(['글자 카드에 로마자 병기', sc[1].kind === 'text' && sc[1].text === 'ㅏ  ·  a']);
checks.push(['삽화 미연결이면 image 장면 없음', !sc.some((s) => s.kind === 'image')]);
checks.push(['장면 id 결정적+유일', new Set(sc.map((s) => s.id)).size === sc.length
  && deriveEducationVideo(preset).project.scenes.map((s) => s.id).join() === sc.map((s) => s.id).join()]);
checks.push(['정상 스냅샷은 파생 경고 0(무음 안내는 voiceRef 있을 때만)', dv.notices.length === 0]);

const subs = dv.project.subtitles!;
checks.push(['자막: 전 언어 큐 생성', SUPPORTED_LOCALES.every((l) => (subs[l]?.length ?? 0) === 8)]); // 인트로+유닛6+복습
checks.push(['자막 ko: 원문 예시', subs.ko![1].text === 'ㅏ (a) — 아기']);
checks.push(['자막 ja: 번역 예시', subs.ja![1].text === 'ㅏ (a) — あかちゃん']);
checks.push(['자막 타이밍이 장면 시계와 일치(첫 유닛 3~8.5초)', subs.ko![1].startSec === 3 && subs.ko![1].endSec === 8.5]);

const withExtras = episode1Preset();
withExtras.units[0] = { ...withExtras.units[0], illustrationRef: 'file-1', voiceRef: 'voice-1' };
withExtras.units[1] = { ...withExtras.units[1], char: ' ' };
withExtras.units[2] = { ...withExtras.units[2], example: { ...withExtras.units[2].example, ja: '' } };
const dv2 = deriveEducationVideo(withExtras);
const img = dv2.project.scenes.find((s) => s.kind === 'image');
checks.push(['삽화 연결 시 image 장면(원장 참조)', !!img && img.ledgerRef === 'file-1' && img.id === `edu-${withExtras.units[0].id}-illust`]);
checks.push(['빈 글자 유닛 제외 + 보고', !dv2.project.scenes.some((s) => s.id.includes(withExtras.units[1].id))
  && dv2.notices.some((n) => n.reason.includes('제외'))]);
checks.push(['음성 연결 시 무음 안내 보고', dv2.notices.some((n) => n.label.includes('음성') && n.reason.includes('무음'))]);
checks.push(['빈 번역 자막은 ko 폴백', dv2.project.subtitles!.ja!.some((c) => c.text === 'ㅗ (o) — 오이')]);
checks.push(['삽화 장면만큼 자막 구간 연장(3~11.5초)', dv2.project.subtitles!.ko![1].startSec === 3 && dv2.project.subtitles!.ko![1].endSec === 11.5]);

// ── 게시 계약(published) — 공개/비공개 경계 + 이북 어댑터 ───────────────────
const pubSrc = episode1Preset();
pubSrc.units[0] = { ...pubSrc.units[0], illustrationRef: 'ledger-secret-1', voiceRef: 'ledger-secret-2' };
pubSrc.units[3] = { ...pubSrc.units[3], char: ' ' }; // 빈 글자 — 게시 제외
const pub = toPublishedEpisode(pubSrc, {
  videoUrl: '/api/learn-public/1/video.mp4?v=1',
  cardUrls: ['/c1.png', '/c2.png', '/c3.png', '/c4.png', '/c5.png'],
  illustrationUrls: { [pubSrc.units[0].id]: '/api/learn-public/1/illust-1.png?v=1' },
}, '2026-07-04T00:00:00.000Z');
checks.push(['게시본 가드 통과', isPublishedEducationEpisode(pub)]);
checks.push(['빈 글자 유닛은 게시 제외(5유닛)', pub.units.length === 5 && pub.cards.length === 5]);
checks.push(['★게시본에 원장 참조(ledgerRef) 부재', !JSON.stringify(pub).includes('ledger-secret')]);
checks.push(['삽화는 공개 사본 URL로', pub.units[0].illustrationUrl === '/api/learn-public/1/illust-1.png?v=1'
  && pub.units[1].illustrationUrl === null]);
checks.push(['카드-유닛 순서 일치', pub.cards.map((c) => c.char).join('') === pub.units.map((u) => u.char).join('')]);

const ebookIn = publishedToEbookInput(pub);
checks.push(['게시본→이북 입력: 스냅샷 가드 통과', isEducationSnapshot(ebookIn.snapshot)]);
checks.push(['이북 입력의 삽화 키는 파생키(원장 아님)', Object.keys(ebookIn.illustrationUrls).every((k) => k.startsWith('pub-illust-'))
  && ebookIn.snapshot.units[0].illustrationRef === 'pub-illust-0']);
const pubPages = buildEbookPages(ebookIn.snapshot, 'ja');
checks.push(['게시본으로도 이북 페이지 생성(표지+5유닛+복습)', pubPages.pages.length === 7 && pubPages.notices.length === 0]);

let failed = 0;
for (const [name, ok] of checks) { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}`); }
console.log(`\n${checks.length - failed}/${checks.length} passed`);
process.exit(failed === 0 ? 0 : 1);
