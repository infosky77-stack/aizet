// 모션 모델 — ComposeBlock에 시간축(키프레임)을 더한 범용 언어(순수 계산, DOM/Canvas 모름).
//
// blocks.ts(정지 블록)와 같은 원칙의 확장: "시각 t의 화면"을 정지 ComposeBlock[]으로
// 환원한다(blocksAtTime). 그리는 쪽(drawBlocks·조립 렌더러)은 매 프레임 이 함수를 불러
// 기존 drawComposeBlock으로 찍기만 하면 되므로, 드로잉 계층은 모션을 전혀 모른다.
// education 조립 장면이 첫 사용자이고, 이후 어떤 콘텐츠든 키프레임만 계산하면 재사용.
//
// 보간 규칙(예측 가능성 우선):
//   - 속성별 트랙: 속성 p는 "p를 명시한 키프레임들"만으로 보간한다. 첫 키프레임 이전은
//     첫 값, 마지막 이후는 마지막 값, 트랙이 비면 원본 블록 값 — 희소 키프레임이 안전하다.
//   - scale: 텍스트는 fontSizePx 배율, rect/image는 중심 고정 크기 배율.
//   - alpha: 색 문자열(rgba)에 구워서 적용 — 드로잉 계층 수정 없이 투명도를 얻는다.
//     이미지 블록은 색이 없어 alpha 미지원(조립 연출은 글자·판 페이드만 쓴다).

import type { ComposeBlock } from './blocks';

export type MotionEasing = 'linear' | 'easeInOutCubic';

export interface MotionKeyframe {
  atSec: number;
  x?: number;
  y?: number;
  /** 크기 배율 — 텍스트: fontSizePx, rect/image: 중심 고정 w/h */
  scale?: number;
  /** 0(투명)~1(불투명) — 텍스트·rect 색에 곱해서 적용 */
  alpha?: number;
}

export interface MotionBlock {
  block: ComposeBlock;
  /** atSec 오름차순. 비어 있으면 정지 블록(기존 카드와 동일하게 그려진다) */
  keyframes: MotionKeyframe[];
  easing?: MotionEasing;
  /** 표시 구간 — 밖의 시각에는 그리지 않는다(생략 시 항상 표시) */
  fromSec?: number;
  untilSec?: number;
}

export interface MotionScene {
  durationSec: number;
  blocks: MotionBlock[];
}

export function easeInOutCubic(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
}

const EASE: Record<MotionEasing, (t: number) => number> = {
  linear: (t) => Math.min(1, Math.max(0, t)),
  easeInOutCubic,
};

type NumericProp = 'x' | 'y' | 'scale' | 'alpha';

/** 속성별 트랙 보간 — p를 명시한 키프레임만 사용, 구간 밖은 양끝 값 고정 */
function trackValue(
  keyframes: MotionKeyframe[], prop: NumericProp, tSec: number,
  ease: (t: number) => number,
): number | undefined {
  const track = keyframes.filter((k) => k[prop] !== undefined);
  if (track.length === 0) return undefined;
  if (tSec <= track[0].atSec) return track[0][prop];
  const last = track[track.length - 1];
  if (tSec >= last.atSec) return last[prop];
  for (let i = 0; i < track.length - 1; i++) {
    const a = track[i], b = track[i + 1];
    if (tSec >= a.atSec && tSec <= b.atSec) {
      const span = b.atSec - a.atSec;
      const r = span <= 0 ? 1 : ease((tSec - a.atSec) / span);
      return (a[prop] as number) + ((b[prop] as number) - (a[prop] as number)) * r;
    }
  }
  return last[prop];
}

/** 색 문자열에 알파 곱하기 — #rgb/#rrggbb/rgb()/rgba() 지원, 그 외 형식은 원본 유지 */
export function applyAlphaToColor(color: string, alpha: number): string {
  const a = Math.min(1, Math.max(0, alpha));
  if (a >= 1) return color;
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim());
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].split('').map((c) => c + c).join('') : hex[1];
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
    return `rgba(${r},${g},${b},${round3(a)})`;
  }
  const fn = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(color.trim());
  if (fn) {
    const base = fn[4] !== undefined ? Number(fn[4]) : 1;
    return `rgba(${fn[1]},${fn[2]},${fn[3]},${round3(base * a)})`;
  }
  return color; // 알 수 없는 형식 — 알파 미적용(조용한 실패 대신 원본 그대로)
}

const round3 = (n: number) => Math.round(n * 1000) / 1000;

/** 시각 t의 블록 하나를 정지 ComposeBlock으로 환원 — 표시 구간 밖이면 null */
function blockAtTime(mb: MotionBlock, tSec: number): ComposeBlock | null {
  if (mb.fromSec !== undefined && tSec < mb.fromSec) return null;
  if (mb.untilSec !== undefined && tSec >= mb.untilSec) return null;
  if (mb.keyframes.length === 0) return mb.block;

  const ease = EASE[mb.easing ?? 'easeInOutCubic'];
  const x = trackValue(mb.keyframes, 'x', tSec, ease);
  const y = trackValue(mb.keyframes, 'y', tSec, ease);
  const scale = trackValue(mb.keyframes, 'scale', tSec, ease);
  const alpha = trackValue(mb.keyframes, 'alpha', tSec, ease);
  const b = mb.block;

  if (b.kind === 'text') {
    return {
      ...b,
      x: x ?? b.x,
      y: y ?? b.y,
      fontSizePx: scale !== undefined ? Math.max(1, Math.round(b.fontSizePx * scale)) : b.fontSizePx,
      color: alpha !== undefined ? applyAlphaToColor(b.color, alpha) : b.color,
    };
  }
  // rect/image — scale은 중심 고정 크기 배율
  const w = scale !== undefined ? b.w * scale : b.w;
  const h = scale !== undefined ? b.h * scale : b.h;
  const bx = (x ?? b.x) + (b.w - w) / 2;
  const by = (y ?? b.y) + (b.h - h) / 2;
  if (b.kind === 'rect') {
    return {
      ...b, x: bx, y: by, w, h,
      color: alpha !== undefined ? applyAlphaToColor(b.color, alpha) : b.color,
    };
  }
  return { ...b, x: bx, y: by, w, h }; // image — alpha 미지원(머리말 참고)
}

/** 시각 t의 장면 전체를 정지 블록 목록으로 환원 — 그리기는 기존 drawComposeBlock 몫 */
export function blocksAtTime(scene: MotionScene, tSec: number): ComposeBlock[] {
  const out: ComposeBlock[] = [];
  for (const mb of scene.blocks) {
    const b = blockAtTime(mb, tSec);
    if (b) out.push(b);
  }
  return out;
}
