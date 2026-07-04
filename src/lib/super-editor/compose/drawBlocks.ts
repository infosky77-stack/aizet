// 범용 합성 드로잉 — ComposeBlock[]을 Canvas 2D에 순서대로 그린다(브라우저 전용).
// 배치는 전부 layout(순수 계산)이 결정했고, 여기는 "어떻게 찍는가"만 안다.
// buildCardImage(교육 카드)·inflateEducationScenes(영상 장면)가 첫 사용자이며,
// 이후 콘텐츠(책·앨범·홍보영상)도 이 파일을 그대로 재사용한다.
//
// 한글 선명도 계약: 글자는 next/font 웹폰트로 코드가 직접 얹는다 —
// composeFontFamily()로 해시 패밀리명을 해석하고 ensureComposeFontsLoaded()로
// document.fonts.ready까지 기다린 뒤 그린다(첫 장부터 웹폰트 보장).

import type { ComposeBlock } from './blocks';

// next/font는 해시된 폰트 패밀리명을 CSS 변수에 심는다 — Canvas font 문자열은 CSS 변수를
// 못 읽으므로 계산값을 꺼내 실제 패밀리명을 얻는다. 변수가 없으면 OS 한글 폰트 폴백.
export function composeFontFamily(cssVar = '--font-noto-sans-kr'): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
  return `${v || '"Noto Sans KR"'}, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`;
}

export const fontString = (family: string, sizePx: number, bold: boolean) =>
  `${bold ? '700' : '400'} ${sizePx}px ${family}`;

/** 대표 굵기의 글리프 로드를 기다린다 — 첫 장부터 웹폰트로 그려지게 */
export async function ensureComposeFontsLoaded(family: string, sampleText: string): Promise<void> {
  try {
    await Promise.all([400, 700].map((w) => document.fonts.load(`${w} 64px ${family}`, sampleText || '한')));
    await document.fonts.ready;
  } catch { /* 폰트 API 실패 시 OS 폴백으로 진행 — 그리기는 막지 않는다 */ }
}

/** 캔버스 컨텍스트 기반 MeasureTextFn — layout(순수 계산)에 주입한다 */
export function canvasMeasure(ctx: CanvasRenderingContext2D, family: string) {
  return (text: string, sizePx: number, bold: boolean): number => {
    ctx.font = fontString(family, sizePx, bold);
    return ctx.measureText(text).width;
  };
}

function drawImageFit(
  ctx: CanvasRenderingContext2D, bmp: ImageBitmap,
  x: number, y: number, w: number, h: number,
  fit: 'contain' | 'cover',
): void {
  if (fit === 'cover') {
    // 슬롯을 가득 채우고 넘치는 부분은 소스 crop — 배경용
    const scale = Math.max(w / bmp.width, h / bmp.height);
    const sw = w / scale, sh = h / scale;
    ctx.drawImage(bmp, (bmp.width - sw) / 2, (bmp.height - sh) / 2, sw, sh, x, y, w, h);
  } else {
    const scale = Math.min(w / bmp.width, h / bmp.height);
    const dw = bmp.width * scale, dh = bmp.height * scale;
    ctx.drawImage(bmp, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  }
}

/**
 * 블록 하나를 그린다. images는 slot 이름 → 비트맵(없으면 해당 이미지 블록은 조용히 생략 —
 * 실패 보고는 비트맵을 준비하는 호출부 책임, 잡지 조판과 같은 계약).
 */
export function drawComposeBlock(
  ctx: CanvasRenderingContext2D,
  block: ComposeBlock,
  family: string,
  images: Record<string, ImageBitmap | null | undefined> = {},
): void {
  if (block.kind === 'rect') {
    ctx.fillStyle = block.color;
    if (block.radiusPx) {
      ctx.beginPath();
      ctx.roundRect(block.x, block.y, block.w, block.h, block.radiusPx);
      ctx.fill();
    } else {
      ctx.fillRect(block.x, block.y, block.w, block.h);
    }
    return;
  }

  if (block.kind === 'image') {
    const bmp = images[block.slot];
    if (!bmp) return;
    if (block.radiusPx) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(block.x, block.y, block.w, block.h, block.radiusPx);
      ctx.clip();
      drawImageFit(ctx, bmp, block.x, block.y, block.w, block.h, block.fit ?? 'contain');
      ctx.restore();
    } else {
      drawImageFit(ctx, bmp, block.x, block.y, block.w, block.h, block.fit ?? 'contain');
    }
    return;
  }

  ctx.font = fontString(family, block.fontSizePx, block.bold);
  ctx.fillStyle = block.color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(block.text, block.x, block.y);
}
