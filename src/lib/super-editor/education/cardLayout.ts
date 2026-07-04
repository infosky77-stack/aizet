// 학습 카드(유닛 1개 → 정사각 이미지 1장)와 영상 장면 카드(16:9)의 순수 배치 계산 —
// DOM/Canvas 모름.
//
// product/layout.ts와 같은 역할 분담: 어디에 무엇이 놓이는지는 전부 여기서 결정하고,
// 그리기(buildCardImage.ts·inflateEducationScenes.ts)는 블록을 순서대로 그릴 뿐이다.
// 글자 폭 측정은 MeasureTextFn 주입식이라 Node 단독 테스트가 가능하다.
//
// 유아·초급 대상 시각 규칙(카드·영상 공용):
//   - 학습 글자가 주인공 — 흰 라운드 판 위에 캔버스에 꽉 차게(shrinkToFit로 넓은 글자만 축소)
//   - 색 역할 고정: 글자=유닛 딥컬러 / 로마자=amber(발음) / 예시 단어=잉크
//   - 유닛마다 파스텔 배경/딥컬러를 순환(UNIT_PALETTES) — 시리즈가 알록달록하게 보인다

import type { MeasureTextFn } from '../product/layout';

export const CARD_SIZE_PX = 1080; // 정사각(SNS 공용 규격)
// 영상 장면 카드 — buildVideoMp4의 16:9 출력(1280×720)과 동일 크기라 풀프레임으로 얹힌다
export const SCENE_W_PX = 1280;
export const SCENE_H_PX = 720;

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
  /** 유닛 순번 — 팔레트 순환용(생략 시 0) */
  unitIndex?: number;
}

export interface CardLayoutResult {
  widthPx:  number;
  heightPx: number;
  blocks:   CardBlock[];
}

// 색 역할 고정 팔레트 — 로마자는 amber(사이트 톤), 예시 단어·본문은 잉크
const ACCENT   = '#b45309'; // amber-700 — 로마자(발음)
const INK      = '#1c1917'; // stone-900 — 예시 단어
const SUB      = '#78716c'; // stone-500 — 회차 제목
const PANEL    = '#ffffff'; // 글자 뒤 라운드 판
const TITLE_BG = '#92400e'; // amber-800 — 인트로/아웃트로 배경
const REVIEW_BG = '#fff8ee';

export interface UnitPalette { bg: string; deep: string }
/** 유닛 순환 팔레트(파스텔 배경 / 딥컬러 글자) — 1편 6유닛 기준 한 바퀴 */
export const UNIT_PALETTES: UnitPalette[] = [
  { bg: '#dbeafe', deep: '#1d4ed8' }, // 하늘 / 파랑
  { bg: '#d1fae5', deep: '#047857' }, // 민트 / 초록
  { bg: '#fef9c3', deep: '#b45309' }, // 레몬 / 앰버
  { bg: '#ffe4e6', deep: '#be123c' }, // 복숭아 / 로즈
  { bg: '#ede9fe', deep: '#6d28d9' }, // 라벤더 / 보라
  { bg: '#ffedd5', deep: '#c2410c' }, // 살구 / 오렌지
];

export function unitPalette(i: number): UnitPalette {
  const n = UNIT_PALETTES.length;
  return UNIT_PALETTES[((i % n) + n) % n];
}

/** maxW에 들어갈 때까지 폰트를 줄인다(최소 minPx) — 긴 예시 단어·넓은 글자 대비 */
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
  const pal = unitPalette(input.unitIndex ?? 0);
  const blocks: CardBlock[] = [];

  blocks.push({ kind: 'rect', x: 0, y: 0, w: S, h: S, color: pal.bg });
  // 상단 포인트 띠 — 카드가 시리즈로 보이게 하는 최소한의 아이덴티티(유닛 컬러 순환)
  blocks.push({ kind: 'rect', x: 0, y: 0, w: S, h: 20, color: pal.deep });

  if (input.episodeTitle.trim()) {
    const size = shrinkToFit(input.episodeTitle.trim(), 34, 22, maxTextW, false, measure);
    blocks.push({ kind: 'text', text: input.episodeTitle.trim(), x: cx, y: 64, fontSizePx: size, bold: false, color: SUB });
  }

  if (input.hasIllustration) {
    // 삽화 카드: 위쪽 절반이 그림, 아래쪽이 글자/발음/단어
    blocks.push({ kind: 'image', x: 140, y: 140, w: S - 280, h: 400 });
    const charSize = shrinkToFit(input.char, 280, 200, maxTextW, true, measure);
    blocks.push({ kind: 'text', text: input.char, x: cx, y: 560, fontSizePx: charSize, bold: true, color: pal.deep });
    blocks.push({ kind: 'text', text: input.romanization, x: cx, y: 852, fontSizePx: 72, bold: true, color: ACCENT });
  } else {
    // 글자 카드: 흰 라운드 판 위에 학습 글자를 꽉 차게 — 글자가 주인공
    const panel = { x: 70, y: 130, w: S - 140, h: 660 };
    blocks.push({ kind: 'rect', ...panel, color: PANEL, radiusPx: 48 });
    const charSize = shrinkToFit(input.char, 620, 460, panel.w - 60, true, measure);
    blocks.push({
      kind: 'text', text: input.char, x: cx,
      y: panel.y + Math.max(0, (panel.h - charSize) / 2),
      fontSizePx: charSize, bold: true, color: pal.deep,
    });
    blocks.push({ kind: 'text', text: input.romanization, x: cx, y: 816, fontSizePx: 96, bold: true, color: ACCENT });
  }

  if (input.exampleKo.trim()) {
    const size = shrinkToFit(input.exampleKo.trim(), input.hasIllustration ? 96 : 112, 48, maxTextW, true, measure);
    blocks.push({ kind: 'text', text: input.exampleKo.trim(), x: cx, y: 930, fontSizePx: size, bold: true, color: INK });
  }

  return { widthPx: S, heightPx: S, blocks };
}

// ── 영상 장면 카드(16:9) ─────────────────────────────────────────────────────
// toVideoScenes가 정한 장면 구성을 바꾸지 않고 "겉모습"만 결정한다 — 어떤 장면을
// 어떤 카드로 그릴지는 inflateEducationScenes(브라우저 어댑터)가 장면 id로 정한다.

export type SceneCardSpec =
  | { kind: 'title';   text: string }                                        // 인트로/아웃트로
  | { kind: 'char';    char: string; romanization: string; unitIndex: number }
  | { kind: 'example'; text: string; unitIndex: number }
  | { kind: 'review';  chars: string[] };

export function layoutEducationSceneCard(spec: SceneCardSpec, measure: MeasureTextFn): CardLayoutResult {
  const W = SCENE_W_PX, H = SCENE_H_PX, cx = W / 2;
  const blocks: CardBlock[] = [];

  if (spec.kind === 'title') {
    blocks.push({ kind: 'rect', x: 0, y: 0, w: W, h: H, color: TITLE_BG });
    const size = shrinkToFit(spec.text, 100, 48, W - 160, true, measure);
    blocks.push({ kind: 'text', text: spec.text, x: cx, y: (H - size) / 2, fontSizePx: size, bold: true, color: PANEL });
    return { widthPx: W, heightPx: H, blocks };
  }

  if (spec.kind === 'char') {
    const pal = unitPalette(spec.unitIndex);
    blocks.push({ kind: 'rect', x: 0, y: 0, w: W, h: H, color: pal.bg });
    blocks.push({ kind: 'rect', x: 0, y: 0, w: W, h: 16, color: pal.deep });
    const panel = { x: 250, y: 64, w: W - 500, h: 512 };
    blocks.push({ kind: 'rect', ...panel, color: PANEL, radiusPx: 40 });
    const size = shrinkToFit(spec.char, 440, 320, panel.w - 60, true, measure);
    blocks.push({
      kind: 'text', text: spec.char, x: cx,
      y: panel.y + Math.max(0, (panel.h - size) / 2),
      fontSizePx: size, bold: true, color: pal.deep,
    });
    if (spec.romanization.trim()) {
      blocks.push({ kind: 'text', text: spec.romanization.trim(), x: cx, y: 606, fontSizePx: 84, bold: true, color: ACCENT });
    }
    return { widthPx: W, heightPx: H, blocks };
  }

  if (spec.kind === 'example') {
    const pal = unitPalette(spec.unitIndex);
    blocks.push({ kind: 'rect', x: 0, y: 0, w: W, h: H, color: pal.bg });
    blocks.push({ kind: 'rect', x: 0, y: 0, w: W, h: 16, color: pal.deep });
    const size = shrinkToFit(spec.text, 180, 64, W - 160, true, measure);
    blocks.push({ kind: 'text', text: spec.text, x: cx, y: (H - size) / 2, fontSizePx: size, bold: true, color: pal.deep });
    return { widthPx: W, heightPx: H, blocks };
  }

  // review — 배운 글자를 나란히, 각자 자기 유닛 컬러로(알록달록 총정리)
  blocks.push({ kind: 'rect', x: 0, y: 0, w: W, h: H, color: REVIEW_BG });
  blocks.push({ kind: 'rect', x: 0, y: 0, w: W, h: 16, color: ACCENT });
  const n = Math.max(spec.chars.length, 1);
  const slotW = (W - 160) / n;
  const size = Math.max(64, Math.min(150, Math.floor(slotW - 24)));
  spec.chars.forEach((ch, i) => {
    blocks.push({
      kind: 'text', text: ch, x: 80 + slotW * i + slotW / 2, y: (H - size) / 2,
      fontSizePx: size, bold: true, color: unitPalette(i).deep,
    });
  });
  return { widthPx: W, heightPx: H, blocks };
}
