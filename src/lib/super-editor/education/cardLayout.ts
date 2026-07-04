// 학습 카드(유닛 1개 → 정사각 이미지 1장)의 순수 배치 계산 — DOM/Canvas 모름.
//
// product/layout.ts와 같은 역할 분담: 어디에 무엇이 놓이는지는 전부 여기서 결정하고,
// 그리기(buildCardImage.ts)는 블록을 순서대로 그릴 뿐이다. 글자 폭 측정은 MeasureTextFn
// 주입식이라 Node 단독 테스트가 가능하다.
//
// 카드 구성: 상단 회차 제목(작게) → 삽화(있으면) → 학습 글자(크게) → 로마자 → 예시 단어.
// 삽화가 없으면(memberAi 잠금·수동 업로드 전) 글자를 더 크게 중앙 배치 — 글자만으로도
// 완성된 카드가 나온다.

import type { MeasureTextFn } from '../product/layout';

export const CARD_SIZE_PX = 1080; // 정사각(SNS 공용 규격)

export type CardBlock =
  | { kind: 'rect';  x: number; y: number; w: number; h: number; color: string; radiusPx?: number }
  /** 삽화 슬롯 — contain-fit 배치는 그리기 쪽 책임 */
  | { kind: 'image'; x: number; y: number; w: number; h: number }
  /** x는 중앙 기준(textAlign center) */
  | { kind: 'text';  text: string; x: number; y: number; fontSizePx: number; bold: boolean; color: string };

export interface CardLayoutInput {
  /** 카드 상단에 작게 들어가는 회차 제목(스냅샷 title) */
  episodeTitle: string;
  char: string;
  romanization: string;
  exampleKo: string;
  hasIllustration: boolean;
}

export interface CardLayoutResult {
  widthPx:  number;
  heightPx: number;
  blocks:   CardBlock[];
}

// 색은 사이트 톤(stone/amber 계열)과 맞춘 고정 팔레트 — 템플릿화는 필요해질 때
const BG        = '#fff8ee';
const ACCENT    = '#b45309'; // amber-700
const INK       = '#1c1917'; // stone-900
const SUB       = '#78716c'; // stone-500

/** maxW에 들어갈 때까지 폰트를 줄인다(최소 minPx) — 긴 예시 단어 대비 */
export function shrinkToFit(
  text: string, startPx: number, minPx: number, maxW: number,
  bold: boolean, measure: MeasureTextFn,
): number {
  let size = startPx;
  while (size > minPx && measure(text, size, bold) > maxW) size -= 4;
  return Math.max(size, minPx);
}

export function layoutEducationCard(input: CardLayoutInput, measure: MeasureTextFn): CardLayoutResult {
  const S = CARD_SIZE_PX;
  const maxTextW = S - 160; // 좌우 여백 80씩
  const cx = S / 2;
  const blocks: CardBlock[] = [];

  blocks.push({ kind: 'rect', x: 0, y: 0, w: S, h: S, color: BG });
  // 상단 포인트 띠 — 카드가 시리즈로 보이게 하는 최소한의 아이덴티티
  blocks.push({ kind: 'rect', x: 0, y: 0, w: S, h: 14, color: ACCENT });

  if (input.episodeTitle.trim()) {
    const size = shrinkToFit(input.episodeTitle.trim(), 34, 22, maxTextW, false, measure);
    blocks.push({ kind: 'text', text: input.episodeTitle.trim(), x: cx, y: 64, fontSizePx: size, bold: false, color: SUB });
  }

  if (input.hasIllustration) {
    // 삽화 카드: 위쪽 절반이 그림, 아래쪽이 글자/발음/단어
    blocks.push({ kind: 'image', x: 140, y: 140, w: S - 280, h: 420 });
    blocks.push({ kind: 'text', text: input.char, x: cx, y: 600, fontSizePx: 230, bold: true, color: INK });
    blocks.push({ kind: 'text', text: input.romanization, x: cx, y: 855, fontSizePx: 54, bold: false, color: ACCENT });
  } else {
    // 글자 카드: 학습 글자가 주인공 — 더 크게, 중앙 위쪽
    blocks.push({ kind: 'text', text: input.char, x: cx, y: 250, fontSizePx: 400, bold: true, color: INK });
    blocks.push({ kind: 'text', text: input.romanization, x: cx, y: 700, fontSizePx: 64, bold: false, color: ACCENT });
  }

  if (input.exampleKo.trim()) {
    const size = shrinkToFit(input.exampleKo.trim(), 84, 40, maxTextW, true, measure);
    blocks.push({ kind: 'text', text: input.exampleKo.trim(), x: cx, y: 930, fontSizePx: size, bold: true, color: INK });
  }

  return { widthPx: S, heightPx: S, blocks };
}
