// 칸칸 HTML 상세 — 순수 모듈 테스트 (htmlTheme 토큰 매핑 / published 게시 변환)
import { PRODUCT_TEMPLATES, getProductTemplate } from '../src/lib/super-editor/product/templates';
import { detailThemeVars, responsiveSize } from '../src/lib/super-editor/product/htmlTheme';
import {
  toPublishedDetail, isPublishedProductDetail,
} from '../src/lib/super-editor/product/published';
import { emptyProductDetail, newProductSection } from '../src/lib/super-editor/product/types';

const checks: [string, boolean][] = [];

// ── htmlTheme — 템플릿 토큰이 CSS 변수로 빠짐없이 매핑되는지 ────────────────
const clean = PRODUCT_TEMPLATES.clean;
const vars = detailThemeVars(clean);
checks.push(['색상 6종이 그대로 매핑', vars['--pd-bg'] === clean.colors.background
  && vars['--pd-accent'] === clean.colors.accent && vars['--pd-divider'] === clean.colors.divider]);
checks.push(['최대 폭 = 템플릿 widthPx', vars['--pd-max-w'] === '860px']);
checks.push(['헤드라인 clamp: 상한이 템플릿 원래값', vars['--pd-fs-headline'].endsWith(`${clean.fontSizePx.headline}px)`)]);
checks.push(['본문 행간 = (body+lineGap)/body (JPEG와 같은 공식)',
  vars['--pd-lh-body'] === ((clean.fontSizePx.body + clean.spacingPx.lineGap) / clean.fontSizePx.body).toFixed(2)]);
checks.push(['모든 템플릿이 매핑 가능(크래시 없음)',
  Object.values(PRODUCT_TEMPLATES).every((t) => Object.keys(detailThemeVars(t)).length >= 16)]);
checks.push(['모르는 템플릿 id → 기본 템플릿 매핑(폴백 경로)',
  detailThemeVars(getProductTemplate('unknown-id'))['--pd-bg'] === PRODUCT_TEMPLATES.clean.colors.background]);

// responsiveSize 형식: clamp(하한px, vw, 원래px)
const size = responsiveSize(44, 860, 0.68);
checks.push(['responsiveSize: clamp(30px, 5.12vw, 44px)', size === 'clamp(30px, 5.12vw, 44px)']);

// ── toPublishedDetail — ledgerRef → src 치환, 빈 섹션 제외+보고 ─────────────
const snap = emptyProductDetail('테스트 상품');
snap.sections = [
  newProductSection('headline', { text: '멋진 상품', subText: '캐치프레이즈' }),
  newProductSection('image',    { ledgerRef: 'file-1', text: '대표 이미지' }),
  newProductSection('text',     { text: '첫 문단\n\n둘째 문단' }),
  newProductSection('features', { items: [{ title: '특징1', body: '설명1' }, { title: '', body: '' }] }),
  newProductSection('image',    { ledgerRef: 'file-missing' }), // 해석 실패 케이스
  newProductSection('text',     { text: '   ' }),               // 빈 본문 케이스
];
const srcMap = { [snap.sections[1].id]: '/api/shop-public/u1/detail-p1-sec-a.jpg?v=1' };
const { detail, skipped } = toPublishedDetail(snap, srcMap);

checks.push(['게시본 섹션 수 4 (이미지실패·빈본문 제외)', detail.sections.length === 4]);
checks.push(['이미지 섹션 src가 공개 URL로 치환', detail.sections[1].src === srcMap[snap.sections[1].id]]);
checks.push(['게시본에 ledgerRef 개념 없음(원장 비노출)', !JSON.stringify(detail).includes('ledgerRef')]);
checks.push(['features 빈 카드 걸러짐', detail.sections[3].items.length === 1]);
checks.push(['제외 2건이 skipped로 보고(조용한 누락 금지)', skipped.length === 2]);
checks.push(['skipped에 사람이 읽는 라벨', skipped.every((s) => s.label.includes('번째 섹션'))]);
checks.push(['title/templateId 보존', detail.title === '테스트 상품' && detail.templateId === 'clean']);

// 전부 빈 스냅샷 → 섹션 0 + 전부 보고
const emptySnap = emptyProductDetail('');
const emptyResult = toPublishedDetail(emptySnap, {});
checks.push(['빈 스냅샷: 게시 섹션 0, 전 섹션 보고',
  emptyResult.detail.sections.length === 0 && emptyResult.skipped.length === emptySnap.sections.length]);

// ── isPublishedProductDetail 가드 ───────────────────────────────────────────
checks.push(['변환 결과는 가드 통과', isPublishedProductDetail(detail)]);
checks.push(['깨진 JSON(배열 아님) 거부', !isPublishedProductDetail({ version: 1, sections: 'x' })]);
checks.push(['다른 version 거부', !isPublishedProductDetail({ version: 2, sections: [] })]);
checks.push(['null/원시값 거부', !isPublishedProductDetail(null) && !isPublishedProductDetail('{}')]);

let failed = 0;
for (const [name, ok] of checks) { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}`); }
console.log(`\n${checks.length - failed}/${checks.length} passed`);
process.exit(failed === 0 ? 0 : 1);
