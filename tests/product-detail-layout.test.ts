// 제품 상세페이지 레이아웃 엔진 테스트 — 순수 계산(layout.ts)을 Node 단독으로 검증.
// measure는 근사 함수(글자 수 × 크기 × 0.62)로 주입 — 엔진은 measure 값만 신뢰하므로 충분.
import {
  layoutProductDetail, wrapByMeasure, MAX_RECOMMENDED_HEIGHT_PX,
  type ProductLayoutBlock, type MeasureTextFn,
} from '../src/lib/super-editor/product/layout';
import { emptyProductDetail, newProductSection, isProductDetailSnapshot } from '../src/lib/super-editor/product/types';
import { getProductTemplate, PRODUCT_TEMPLATES } from '../src/lib/super-editor/product/templates';

const measure: MeasureTextFn = (text, size) => text.length * size * 0.62;
const tpl = getProductTemplate('clean');
const contentW = tpl.widthPx - 2 * tpl.spacingPx.pagePadX;

const checks: [string, boolean][] = [];
const byType = (blocks: ProductLayoutBlock[], type: ProductLayoutBlock['type']) =>
  blocks.filter((b) => b.type === type);

// ── types 가드/기본 골격 ────────────────────────────────────────────────
const empty = emptyProductDetail('수제 딸기잼');
checks.push(['emptyProductDetail은 version 1 가드 통과', isProductDetailSnapshot(empty)]);
checks.push(['기본 골격은 5섹션(헤드라인/이미지/설명/특징/이미지)', empty.sections.length === 5]);
checks.push(['구형/임의 스냅샷은 가드 거부', !isProductDetailSnapshot({ canvas: { blocks: [] } })]);
checks.push(['모르는 템플릿 id → clean 폴백', getProductTemplate('없는템플릿').id === 'clean']);
checks.push(['템플릿 프리셋 2종', Object.keys(PRODUCT_TEMPLATES).length === 2]);

// ── 기본 골격 레이아웃: 제목만 채워진 상태 → 헤드라인만 배치, 나머지 4섹션 skip ──
{
  const r = layoutProductDetail(empty, tpl, {}, measure);
  checks.push(['빈 골격: 헤드라인만 배치되고 4섹션 skip', r.skipped.length === 4]);
  checks.push(['빈 골격: 제목 텍스트 블록 존재',
    byType(r.blocks, 'text').some((b) => b.type === 'text' && b.text === '수제 딸기잼')]);
  checks.push(['빈 골격: 이미지 블록 없음', byType(r.blocks, 'image').length === 0]);
  checks.push(['skip 사유에 섹션 라벨 포함', r.skipped.every((s) => s.label.includes('번째 섹션'))]);
}

// ── 완전 구성 스냅샷 ───────────────────────────────────────────────────
const full = {
  version: 1 as const,
  title: '수제 딸기잼',
  templateId: 'clean',
  sections: [
    newProductSection('headline', { id: 's1', text: '수제 딸기잼 500g', subText: '설탕은 줄이고 과육은 그대로' }),
    newProductSection('image',    { id: 's2', ledgerRef: 'file-hero', text: '대표 이미지 캡션' }),
    newProductSection('text',     { id: 's3', text: '국내산 딸기만 사용합니다.\n\n매일 아침 소량씩 끓입니다.' }),
    newProductSection('features', { id: 's4', items: [
      { title: '국내산 원료', body: '논산 설향 딸기 100%' },
      { title: '저당 레시피', body: '' },
    ] }),
    newProductSection('image',    { id: 's5', ledgerRef: 'file-broken' }), // 해석 실패 케이스
  ],
};
{
  const sizes = { s2: { width: 1000, height: 500 } }; // s5는 의도적으로 누락(해석 실패)
  const r = layoutProductDetail(full, tpl, sizes, measure);

  checks.push(['완전 구성: skip 없음', r.skipped.length === 0]);
  const img = byType(r.blocks, 'image');
  checks.push(['해석된 이미지 1개 배치', img.length === 1]);
  checks.push(['이미지 높이 = 폭 비율 유지(1000×500 → contentW/2)',
    img[0].type === 'image' && img[0].w === contentW && img[0].h === Math.round(contentW / 2)]);
  checks.push(['해석 실패 이미지는 자리표시 블록', byType(r.blocks, 'imagePlaceholder').length === 1]);

  const texts = byType(r.blocks, 'text');
  checks.push(['캡션 텍스트 배치', texts.some((b) => b.type === 'text' && b.text === '대표 이미지 캡션')]);
  checks.push(['features: 카드 rect 2 + 번호 칩 2 = rect 4 이상',
    byType(r.blocks, 'rect').length >= 5]); // 헤드라인 포인트 바 1 + 카드 2 + 칩 2
  checks.push(['features: 번호 텍스트 1,2 존재',
    texts.some((b) => b.type === 'text' && b.text === '1') && texts.some((b) => b.type === 'text' && b.text === '2')]);
  const headlineBlock = texts.find((b) => b.type === 'text' && b.text === '수제 딸기잼 500g');
  checks.push(['본문은 좌측 정렬, 헤드라인은 중앙 정렬',
    texts.some((b) => b.type === 'text' && b.align === 'left')
    && headlineBlock?.type === 'text' && headlineBlock.align === 'center']);
  checks.push(['높이는 안전 한계 이내', r.heightPx > 0 && r.heightPx <= MAX_RECOMMENDED_HEIGHT_PX]);

  // 카드 rect가 카드 안 텍스트보다 먼저(그리기 순서 = 배열 순서) — 첫 카드 기준
  const cardIdx  = r.blocks.findIndex((b) => b.type === 'rect' && b.color === tpl.colors.surface);
  const titleIdx = r.blocks.findIndex((b) => b.type === 'text' && b.text === '국내산 원료');
  checks.push(['카드 배경이 텍스트보다 먼저 그려짐', cardIdx !== -1 && titleIdx > cardIdx]);
}

// ── 모든 섹션이 비면: 안내 블록 + 전 섹션 skip ─────────────────────────
{
  const blank = { ...empty, sections: [newProductSection('text'), newProductSection('features', { items: [] })] };
  const r = layoutProductDetail(blank, tpl, {}, measure);
  checks.push(['전부 빈 섹션: 전 섹션 skip 보고', r.skipped.length === 2]);
  checks.push(['전부 빈 섹션: 안내 텍스트 1블록 + 최소 높이',
    r.blocks.length === 1 && r.heightPx === 400]);
}

// ── 줄바꿈(wrapByMeasure) ──────────────────────────────────────────────
{
  const long = '아주 긴 설명 문장이 폭을 넘어가면 자동으로 줄바꿈이 일어나야 합니다';
  const lines = wrapByMeasure(long, 24, false, 300, measure);
  checks.push(['긴 문장은 여러 줄로 분리', lines.length > 1]);
  checks.push(['모든 줄이 최대 폭 이하', lines.every((l) => measure(l, 24, false) <= 300)]);
  checks.push(['내용 보존(공백 제외)', lines.join('').replace(/ /g, '') === long.replace(/ /g, '')]);
  const oneWord = wrapByMeasure('공백없는아주아주아주아주아주긴한글단어', 24, false, 120, measure);
  checks.push(['공백 없는 장문은 글자 단위 강제 분리', oneWord.length > 1
    && oneWord.join('') === '공백없는아주아주아주아주아주긴한글단어']);
}

// ── 섹션이 늘면 높이도 는다(단조 증가) ────────────────────────────────
{
  const one = { ...full, sections: full.sections.slice(0, 2) };
  const r1 = layoutProductDetail(one, tpl, { s2: { width: 1000, height: 500 } }, measure);
  const r2 = layoutProductDetail(full, tpl, { s2: { width: 1000, height: 500 } }, measure);
  checks.push(['섹션 추가 시 높이 증가', r2.heightPx > r1.heightPx]);
}

let failed = 0;
for (const [name, ok] of checks) { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}`); }
console.log(`\n${checks.length - failed}/${checks.length} passed`);
process.exit(failed === 0 ? 0 : 1);
