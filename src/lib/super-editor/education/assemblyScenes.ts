// 조립 장면 파생(순수) — AssemblyUnit 하나를 "공식 나열" 모션 장면(MotionScene)으로 변환한다.
// Canvas/원장/렌더를 전혀 모르고, 글자 폭은 MeasureTextFn 주입식(cardLayout과 동일 원칙).
//
// 확정 연출(겹침 원천 차단): 부품·기호·완성을 한 줄에 나란히 —  [ㄱ] [+] [ㅏ] [→] [가]
//   - 부품과 완성이 처음부터 서로 다른 x 구간을 차지하므로 겹침이 물리적으로 불가능하다.
//     (이동·착지·합체 없음 — 이전 정밀 착지/glyphAnatomy 방식은 폐기)
//   - 흐름: 부품이 순서대로 페이드인(발음 라벨과 함께) → + 기호 → 화살표(→) →
//     완성 글자만 팝(스케일 바운스). 등장한 요소는 사라지지 않고 공식 전체가 끝까지 남는다.
//   - syllable(ㄱ+ㅏ→가)·word(가+방→가방)·sentence 전부 같은 나열 문법 하나로 처리 —
//     kind는 기본 글자 크기만 다르다(3·4·5편 공용, 부품 수 제한 없음).
//   - 공식 전체 폭이 행 최대 폭을 넘으면 모든 요소를 같은 비율로 축소(가독 최우선 크기 유지).
//
// 자막 큐는 장면과 같은 산수로 파생(toVideoScenes 원칙 — 타이밍 불일치 원천 차단).

import type { MeasureTextFn } from '../compose/blocks';
import type { MotionBlock, MotionKeyframe, MotionScene } from '../compose/motion';
import { BACKGROUND_SLOT, ILLUSTRATION_SLOT, SCENE_W_PX, SCENE_H_PX, unitPalette } from './cardLayout';
import type { AssemblyUnit } from './types';
import type { SubtitleCue } from '../video/types';
import { SUPPORTED_LOCALES, type Locale } from '../../i18n/types';

// ── 타임라인 상수(초) ────────────────────────────────────────────────────────
export const PART_STEP_SEC = 0.8; // 부품 하나 등장 간격(발음 라벨 동반)
export const PLUS_SEC = 0.4;      // + 기호 등장 구간
export const ARROW_SEC = 0.4;     // 화살표(→) 등장 구간
export const POP_SEC = 0.3;       // 완성 글자 팝(스케일 바운스)
export const HOLD_SEC = 1.5;      // 완성 홀드(로마자·뜻 이미지)
export const FADE_SEC = 0.25;     // 요소 공통 페이드인 길이

/** 부품 수에 따른 장면 타임라인 — 장면·자막·검증이 같은 산수를 쓴다 */
export interface AssemblyTimeline {
  partAtSec: number[];
  plusAtSec: number;
  arrowAtSec: number;
  resultAtSec: number;
  durationSec: number;
}

export function assemblyTimeline(partCount: number): AssemblyTimeline {
  const partAtSec = Array.from({ length: partCount }, (_, i) => i * PART_STEP_SEC);
  const plusAtSec = partCount * PART_STEP_SEC;
  const arrowAtSec = plusAtSec + PLUS_SEC;
  const resultAtSec = arrowAtSec + ARROW_SEC;
  return { partAtSec, plusAtSec, arrowAtSec, resultAtSec, durationSec: resultAtSec + POP_SEC + HOLD_SEC };
}

// ── 한글 음절 분해(순수 유니코드 산수) ──────────────────────────────────────
// 착지 좌표에는 더 이상 쓰지 않지만, C단계 편집 UI의 "결과 글자 → 부품 자동 분해"에
// 필요한 범용 산수라 유지한다.
const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const JUNG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ'];
const JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

export function decomposeSyllable(ch: string): { cho: string; jung: string; jong: string | null } | null {
  const code = ch.codePointAt(0);
  if (code === undefined || code < 0xac00 || code > 0xd7a3) return null;
  const idx = code - 0xac00;
  const jong = JONG[idx % 28];
  return {
    cho: CHO[Math.floor(idx / 588)],
    jung: JUNG[Math.floor((idx % 588) / 28)],
    jong: jong || null,
  };
}

// ── 장면 파생 ────────────────────────────────────────────────────────────────
const W = SCENE_W_PX, H = SCENE_H_PX;
const ACCENT = '#b45309'; // 발음·로마자(카드 팔레트와 동일 역할색)
const SUB = '#78716c';    // 기호(+·→)
const PLUS_GLYPH = '+';
const ARROW_GLYPH = '→';

/** 조립 장면을 만들 수 있는 유닛인가 — 부족하면 편 단위 파생이 notices로 제외한다 */
export function isUsableAssemblyUnit(unit: AssemblyUnit): boolean {
  return unit.resultKo.trim().length > 0
    && unit.parts.filter((p) => p.glyph.trim()).length >= 2;
}

export interface AssemblySceneOptions {
  /** 유닛 순번 — 색 팔레트 순환(카드와 동일) */
  unitIndex?: number;
  /** 회차 배경(backgroundRef) 사용 여부 — true면 BACKGROUND_SLOT cover + 반투명 판 */
  hasBackground?: boolean;
}

/** 행 항목 — 공식 한 줄의 원소(부품/기호/화살표/완성) */
interface RowItem {
  role: 'part' | 'plus' | 'arrow' | 'result';
  text: string;
  fontPx: number;
  color: string;
  /** role='part'일 때 부품 순번(발음 라벨·등장 시각용) */
  partIndex?: number;
}

export function layoutAssemblyScene(
  unit: AssemblyUnit, measure: MeasureTextFn, opts: AssemblySceneOptions = {},
): MotionScene {
  const pal = unitPalette(opts.unitIndex ?? 0);
  const partList = unit.parts
    .map((p) => ({ glyph: p.glyph.trim(), pron: p.pronunciation.trim() }))
    .filter((p) => p.glyph);
  const result = unit.resultKo.trim();
  const tl = assemblyTimeline(partList.length);
  const hasImage = !!unit.imageRef;

  // 크기: kind별 기본 크기에서 시작 — 공식 전체 폭이 행 최대 폭을 넘으면 전 요소 동비율 축소.
  // (measure는 폰트 크기에 선형이므로 축소 배율은 1회 계산으로 충분하다)
  const baseResultPx = unit.kind === 'syllable' ? 300 : unit.kind === 'word' ? 230 : 120;
  const rowMaxW = hasImage ? W * 0.54 : W * 0.82; // 판(W*0.88) 안쪽, 이미지 있으면 우측 양보
  const rowCenterX = hasImage ? W * 0.33 : W / 2;

  const sizesAt = (k: number) => {
    const resultPx = Math.max(40, Math.round(baseResultPx * k));
    return {
      resultPx,
      partPx: Math.round(resultPx * 0.8),
      symbolPx: Math.round(resultPx * 0.42),
      gapPx: Math.round(resultPx * 0.16),
    };
  };
  const rowItems = (s: ReturnType<typeof sizesAt>): RowItem[] => {
    const items: RowItem[] = [];
    partList.forEach((p, i) => {
      if (i > 0) items.push({ role: 'plus', text: PLUS_GLYPH, fontPx: s.symbolPx, color: SUB });
      items.push({ role: 'part', text: p.glyph, fontPx: s.partPx, color: pal.deep, partIndex: i });
    });
    items.push({ role: 'arrow', text: ARROW_GLYPH, fontPx: s.symbolPx, color: SUB });
    items.push({ role: 'result', text: result, fontPx: s.resultPx, color: pal.deep });
    return items;
  };
  const rowWidth = (items: RowItem[], gapPx: number) =>
    items.reduce((sum, it) => sum + measure(it.text, it.fontPx, true), 0) + gapPx * (items.length - 1);

  const baseSizes = sizesAt(1);
  const baseW = rowWidth(rowItems(baseSizes), baseSizes.gapPx);
  const sizes = baseW > rowMaxW ? sizesAt(rowMaxW / baseW) : baseSizes;
  const items = rowItems(sizes);
  const totalW = rowWidth(items, sizes.gapPx);

  // 좌표 규약: drawComposeBlock 텍스트는 x=중앙 정렬, y=글자 상단(top) — 행은 세로 중앙 정렬
  const centerY = H * 0.5;
  const topOf = (fontPx: number) => centerY - fontPx / 2;
  let cursor = rowCenterX - totalW / 2;
  const placed = items.map((it) => {
    const w = measure(it.text, it.fontPx, true);
    const x = cursor + w / 2;
    cursor += w + sizes.gapPx;
    return { ...it, x };
  });

  const blocks: MotionBlock[] = [];

  // 바닥: 배경 cover(있으면) + 판 — 정지 블록(키프레임 없음)
  if (opts.hasBackground) {
    blocks.push({ block: { kind: 'image', slot: BACKGROUND_SLOT, fit: 'cover', x: 0, y: 0, w: W, h: H }, keyframes: [] });
    blocks.push({ block: { kind: 'rect', x: W * 0.06, y: H * 0.08, w: W * 0.88, h: H * 0.84, color: 'rgba(255,255,255,0.92)', radiusPx: 28 }, keyframes: [] });
  } else {
    blocks.push({ block: { kind: 'rect', x: 0, y: 0, w: W, h: H, color: pal.bg }, keyframes: [] });
    blocks.push({ block: { kind: 'rect', x: W * 0.06, y: H * 0.08, w: W * 0.88, h: H * 0.84, color: '#ffffff', radiusPx: 28 }, keyframes: [] });
  }

  const fadeIn = (atSec: number): MotionKeyframe[] => [{ atSec, alpha: 0 }, { atSec: atSec + FADE_SEC, alpha: 1 }];
  const pronPx = Math.max(22, Math.round(sizes.resultPx * 0.12));

  for (const it of placed) {
    if (it.role === 'result') {
      // 완성만 팝 — 스케일 바운스. scale은 fontSizePx 배율(top 기준)이라 y를 배율에 맞춰
      // 함께 움직여 시각적 세로 중심을 고정한다.
      const popY = (scale: number) => centerY - (it.fontPx * scale) / 2;
      blocks.push({
        block: { kind: 'text', text: it.text, x: it.x, y: topOf(it.fontPx), fontSizePx: it.fontPx, bold: true, color: it.color },
        keyframes: [
          { atSec: tl.resultAtSec, scale: 0.6, alpha: 0, y: popY(0.6) },
          { atSec: tl.resultAtSec + POP_SEC * 0.6, scale: 1.08, alpha: 1, y: popY(1.08) },
          { atSec: tl.resultAtSec + POP_SEC, scale: 1, y: popY(1) },
        ],
        fromSec: tl.resultAtSec,
      });
      continue;
    }

    const atSec = it.role === 'part' ? tl.partAtSec[it.partIndex!]
      : it.role === 'plus' ? tl.plusAtSec
        : tl.arrowAtSec;
    blocks.push({
      block: { kind: 'text', text: it.text, x: it.x, y: topOf(it.fontPx), fontSizePx: it.fontPx, bold: true, color: it.color },
      keyframes: fadeIn(atSec),
      fromSec: atSec,
    });

    // 발음 라벨 — 부품 아래, 부품과 함께 등장해 끝까지 남는다(공식 전체가 교재처럼 보이도록)
    if (it.role === 'part') {
      const pron = partList[it.partIndex!].pron;
      if (pron) {
        blocks.push({
          block: { kind: 'text', text: `“${pron}”`, x: it.x, y: centerY + sizes.partPx / 2 + 16, fontSizePx: pronPx, bold: false, color: ACCENT },
          keyframes: fadeIn(atSec),
          fromSec: atSec,
        });
      }
    }
  }

  // 로마자 — 완성 아래, 팝이 끝난 뒤 페이드인
  const rom = unit.romanization.trim();
  const resultItem = placed.find((it) => it.role === 'result');
  if (rom && resultItem) {
    blocks.push({
      block: { kind: 'text', text: rom, x: resultItem.x, y: centerY + sizes.resultPx / 2 + 18, fontSizePx: Math.max(26, Math.round(sizes.resultPx * 0.15)), bold: true, color: ACCENT },
      keyframes: fadeIn(tl.resultAtSec + POP_SEC),
      fromSec: tl.resultAtSec + POP_SEC,
    });
  }

  // 뜻 실사 이미지 — 완성과 함께 우측에 등장
  if (hasImage) {
    blocks.push({
      block: { kind: 'image', slot: ILLUSTRATION_SLOT, fit: 'contain', x: W * 0.62, y: H * 0.26, w: W * 0.30, h: H * 0.48, radiusPx: 24 },
      keyframes: [],
      fromSec: tl.resultAtSec,
    });
  }

  return { durationSec: tl.durationSec, blocks };
}

/** 장면과 같은 산수의 자막 큐 — 부품 발음 구간(완성 등장 전) + 완성(로마자·뜻) 구간 */
export function assemblySceneCues(unit: AssemblyUnit, startSec: number): Record<Locale, SubtitleCue[]> {
  const partList = unit.parts
    .map((p) => ({ glyph: p.glyph.trim(), pron: p.pronunciation.trim() }))
    .filter((p) => p.glyph);
  const tl = assemblyTimeline(partList.length);
  const head = partList
    .map((p) => (p.pron ? `${p.glyph} “${p.pron}”` : p.glyph))
    .join(' + ');
  const result = unit.resultKo.trim();
  const rom = unit.romanization.trim();
  const resultKo = rom ? `${result} (${rom})` : result;

  const out = {} as Record<Locale, SubtitleCue[]>;
  for (const locale of SUPPORTED_LOCALES) {
    const cues: SubtitleCue[] = [];
    if (head) cues.push({ startSec, endSec: startSec + tl.resultAtSec, text: head });
    const meaning = locale === 'ko' ? '' : (unit.meaning[locale as keyof typeof unit.meaning] ?? '').trim();
    cues.push({
      startSec: startSec + tl.resultAtSec,
      endSec: startSec + tl.durationSec,
      text: meaning ? `${resultKo} — ${meaning}` : resultKo,
    });
    out[locale] = cues;
  }
  return out;
}
