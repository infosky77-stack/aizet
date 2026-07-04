// 제품 상세페이지 순수 레이아웃 엔진 — 섹션 목록 → 배치 블록(좌표·크기) 계산만 한다.
// Canvas/DOM을 전혀 모르므로 Node 단독으로 단위 테스트할 수 있다(잡지 조판 엔진과 같은 위상).
//
// - 텍스트 폭 측정은 measure 함수 주입으로 해결: 브라우저에선 canvas measureText,
//   테스트에선 근사 함수를 넣는다.
// - 이미지 실제 크기는 imageSizes(sectionId → 픽셀 크기)로 주입: 원장 해석은 빌더 몫이다.
//   ledgerRef가 있는데 크기가 없으면 "해석 실패"로 보고 자리표시 블록을 깐다(경고는 빌더가 담당).
// - 내용이 비어 배치할 수 없는 섹션은 조용히 누락시키지 않고 skipped로 보고한다
//   (output/types.ts notices 계약으로 빌더가 승격).

import type { ProductDetailSnapshot, ProductSection } from './types';
import type { ProductTemplate } from './templates';

/** (text, fontSizePx, bold) → 렌더 폭(px). 브라우저: canvas measureText / 테스트: 근사 */
export type MeasureTextFn = (text: string, fontSizePx: number, bold: boolean) => number;

export type ProductLayoutBlock =
  | { type: 'rect'; x: number; y: number; w: number; h: number; color: string; radiusPx?: number }
  | { type: 'text'; x: number; y: number; text: string; fontSizePx: number; bold: boolean;
      color: string; align: 'left' | 'center' } // y는 줄 상단, align center면 x는 중심선
  | { type: 'image'; sectionId: string; x: number; y: number; w: number; h: number }
  | { type: 'imagePlaceholder'; x: number; y: number; w: number; h: number; label: string };

export interface ProductLayoutSkip {
  sectionId: string;
  /** 사람이 읽는 섹션 표시(예: "특징 (3번째 섹션)") */
  label:  string;
  reason: string;
}

export interface ProductLayoutResult {
  widthPx:  number;
  heightPx: number;
  blocks:   ProductLayoutBlock[];
  skipped:  ProductLayoutSkip[];
}

/** 쿠팡/네이버 업로드에서 문제가 없는 안전 높이 — 초과 시 빌더가 notice로 알린다(v1은 분할 없음) */
export const MAX_RECOMMENDED_HEIGHT_PX = 16000;

export const SECTION_KIND_LABELS: Record<ProductSection['kind'], string> = {
  headline: '헤드라인',
  image:    '이미지',
  text:     '설명',
  features: '특징',
};

/** measure 기반 줄바꿈 — 공백 단위 우선, 한 단어가 폭을 넘으면 글자 단위로 강제 분리 */
export function wrapByMeasure(
  text: string, fontSizePx: number, bold: boolean, maxW: number, measure: MeasureTextFn,
): string[] {
  const lines: string[] = [];
  for (const rawLine of text.split('\n')) {
    const words = rawLine.split(' ').filter((w) => w.length > 0);
    if (words.length === 0) { lines.push(''); continue; }
    let current = '';
    const pushWord = (word: string) => {
      const candidate = current ? `${current} ${word}` : word;
      if (measure(candidate, fontSizePx, bold) <= maxW) { current = candidate; return; }
      if (current) { lines.push(current); current = ''; }
      // 단어 자체가 폭 초과 — 글자 단위 분리(한글 장문 대응)
      if (measure(word, fontSizePx, bold) <= maxW) { current = word; return; }
      let chunk = '';
      for (const ch of word) {
        if (measure(chunk + ch, fontSizePx, bold) <= maxW) { chunk += ch; }
        else { if (chunk) lines.push(chunk); chunk = ch; }
      }
      current = chunk;
    };
    words.forEach(pushWord);
    if (current) lines.push(current);
  }
  return lines;
}

function sectionLabel(section: ProductSection, index: number): string {
  return `${SECTION_KIND_LABELS[section.kind]} (${index + 1}번째 섹션)`;
}

export function layoutProductDetail(
  snapshot: ProductDetailSnapshot,
  template: ProductTemplate,
  imageSizes: Record<string, { width: number; height: number }>,
  measure: MeasureTextFn,
): ProductLayoutResult {
  const W = template.widthPx;
  const { pagePadX, pagePadY, sectionGap, lineGap } = template.spacingPx;
  const font   = template.fontSizePx;
  const colors = template.colors;
  const contentW = W - 2 * pagePadX;

  const blocks:  ProductLayoutBlock[] = [];
  const skipped: ProductLayoutSkip[]  = [];
  let y = pagePadY;
  let placedCount = 0;

  // 줄 묶음을 세로로 쌓는 공용 헬퍼 — 쌓은 뒤의 y를 반환
  const stackLines = (
    lines: string[], fontSizePx: number, bold: boolean, color: string,
    align: 'left' | 'center', startY: number,
  ): number => {
    let cy = startY;
    const anchorX = align === 'center' ? W / 2 : pagePadX;
    for (const line of lines) {
      if (line !== '') {
        blocks.push({ type: 'text', x: anchorX, y: cy, text: line, fontSizePx, bold, color, align });
      }
      cy += fontSizePx + lineGap;
    }
    return cy;
  };

  snapshot.sections.forEach((section, idx) => {
    const startBlockCount = blocks.length;
    const label = sectionLabel(section, idx);

    if (section.kind === 'headline') {
      if (!section.text.trim()) {
        skipped.push({ sectionId: section.id, label, reason: '제품명이 비어 있어 제외했습니다' });
        return;
      }
      blocks.push({ type: 'rect', x: W / 2 - 32, y, w: 64, h: 6, color: colors.accent, radiusPx: 3 });
      y += 6 + 28;
      const titleLines = wrapByMeasure(section.text.trim(), font.headline, true, contentW, measure);
      y = stackLines(titleLines, font.headline, true, colors.textPrimary, 'center', y);
      if (section.subText.trim()) {
        y += 10;
        const subLines = wrapByMeasure(section.subText.trim(), font.subHeadline, false, contentW, measure);
        y = stackLines(subLines, font.subHeadline, false, colors.textSecondary, 'center', y);
      }

    } else if (section.kind === 'image') {
      if (!section.ledgerRef) {
        skipped.push({ sectionId: section.id, label, reason: '이미지가 지정되지 않아 제외했습니다' });
        return;
      }
      const size = imageSizes[section.id];
      if (size && size.width > 0 && size.height > 0) {
        const h = Math.round(contentW * (size.height / size.width));
        blocks.push({ type: 'image', sectionId: section.id, x: pagePadX, y, w: contentW, h });
        y += h;
      } else {
        // 해석 실패 — 자리표시(경고는 빌더가 notices로 승격)
        const h = Math.round(contentW * 0.75);
        blocks.push({ type: 'imagePlaceholder', x: pagePadX, y, w: contentW, h, label: '이미지를 불러오지 못했습니다' });
        y += h;
      }
      if (section.text.trim()) {
        y += 14;
        const capLines = wrapByMeasure(section.text.trim(), font.caption, false, contentW, measure);
        y = stackLines(capLines, font.caption, false, colors.textSecondary, 'center', y);
      }

    } else if (section.kind === 'text') {
      if (!section.text.trim()) {
        skipped.push({ sectionId: section.id, label, reason: '내용이 비어 있어 제외했습니다' });
        return;
      }
      const bodyLines = wrapByMeasure(section.text.trim(), font.body, false, contentW, measure);
      y = stackLines(bodyLines, font.body, false, colors.textPrimary, 'left', y);

    } else { // features
      const items = section.items.filter((it) => it.title.trim() || it.body.trim());
      if (items.length === 0) {
        skipped.push({ sectionId: section.id, label, reason: '특징 항목이 비어 있어 제외했습니다' });
        return;
      }
      const CARD_PAD  = 28;
      const CHIP      = 44;              // 번호 칩(정사각) 한 변
      const TEXT_X    = pagePadX + CARD_PAD + CHIP + 20; // 카드 안 텍스트 시작
      const textW     = contentW - CARD_PAD * 2 - CHIP - 20;
      items.forEach((item, i) => {
        if (i > 0) y += 20;
        const cardTop = y;
        let iy = cardTop + CARD_PAD;
        const titleLines = item.title.trim()
          ? wrapByMeasure(item.title.trim(), font.featureTitle, true, textW, measure) : [];
        const bodyLines = item.body.trim()
          ? wrapByMeasure(item.body.trim(), font.featureBody, false, textW, measure) : [];
        // 카드 높이 선계산 → 카드 rect를 텍스트보다 먼저 push(그리기 순서 = 배열 순서)
        const titleH = titleLines.length * (font.featureTitle + lineGap);
        const bodyH  = bodyLines.length * (font.featureBody + lineGap);
        const innerH = Math.max(CHIP, titleH + (titleH && bodyH ? 6 : 0) + bodyH);
        const cardH  = innerH + CARD_PAD * 2;
        blocks.push({ type: 'rect', x: pagePadX, y: cardTop, w: contentW, h: cardH, color: colors.surface, radiusPx: 16 });
        blocks.push({ type: 'rect', x: pagePadX + CARD_PAD, y: iy, w: CHIP, h: CHIP, color: colors.accent, radiusPx: 12 });
        // 번호 — 칩 중앙(글꼴 상단 기준이므로 반 칸 내림)
        blocks.push({
          type: 'text', x: pagePadX + CARD_PAD + CHIP / 2, y: iy + (CHIP - font.featureTitle) / 2,
          text: String(i + 1), fontSizePx: font.featureTitle, bold: true, color: '#ffffff', align: 'center',
        });
        for (const line of titleLines) {
          blocks.push({ type: 'text', x: TEXT_X, y: iy, text: line, fontSizePx: font.featureTitle, bold: true, color: colors.textPrimary, align: 'left' });
          iy += font.featureTitle + lineGap;
        }
        if (titleLines.length && bodyLines.length) iy += 6;
        for (const line of bodyLines) {
          blocks.push({ type: 'text', x: TEXT_X, y: iy, text: line, fontSizePx: font.featureBody, bold: false, color: colors.textSecondary, align: 'left' });
          iy += font.featureBody + lineGap;
        }
        y = cardTop + cardH;
      });
    }

    if (blocks.length > startBlockCount) {
      placedCount += 1;
      y += sectionGap;
    }
  });

  if (placedCount === 0) {
    // 배치된 섹션이 하나도 없어도 빈 이미지 대신 안내 한 줄은 남긴다(잡지 조판과 같은 방침)
    const h = 400;
    blocks.push({
      type: 'text', x: W / 2, y: h / 2 - font.body / 2,
      text: '표시할 섹션이 없습니다 — 섹션에 내용을 입력해주세요',
      fontSizePx: font.body, bold: false, color: colors.textSecondary, align: 'center',
    });
    return { widthPx: W, heightPx: h, blocks, skipped };
  }

  // 마지막 sectionGap을 걷어내고 하단 여백으로 마감
  const heightPx = Math.round(y - sectionGap + pagePadY);
  return { widthPx: W, heightPx, blocks, skipped };
}
