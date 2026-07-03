// 슈퍼에디터 PDF 빌더 공용 유틸 — 도록(buildCatalogPdf)과 잡지 조판(buildMagazinePdf)이 공유.
// 브라우저 전용(폰트를 fetch로 가져옴). 좌표 헬퍼는 fpdf의 top-left 셀 좌표계를 흉내내는
// 도록 이식 당시의 근사치를 그대로 유지한다 — 두 빌더의 텍스트 배치가 같은 규칙을 따르게.

import { PDFFont, PDFPage, rgb } from 'pdf-lib';

export const MM = 72 / 25.4; // mm → pt

export const PAGE_SIZES_MM: Record<string, [number, number]> = {
  A4: [210, 297],
  A5: [148, 210],
};

export const GRAY_TITLE = rgb(18 / 255, 18 / 255, 18 / 255);
export const GRAY_META  = rgb(115 / 255, 115 / 255, 115 / 255);
export const GRAY_SIZE  = rgb(160 / 255, 160 / 255, 160 / 255);
export const GRAY_DESC  = rgb(100 / 255, 100 / 255, 100 / 255);
export const GRAY_LINE  = rgb(190 / 255, 190 / 255, 190 / 255);
export const GRAY_SEP   = rgb(215 / 255, 215 / 255, 215 / 255);

let fontBytesPromise: Promise<ArrayBuffer> | null = null;
/** NotoSansKR 폰트 바이트 — 모듈 수준 캐시(같은 세션에서 여러 PDF를 만들어도 fetch 1회).
 *  임베드는 반드시 subset:false 로 할 것 — subset:true 는 한글 글리프 누락 버그가 실측 재현됨
 *  (자세한 내력은 buildCatalogPdf.ts 주석 참고). */
export function loadFontBytes(): Promise<ArrayBuffer> {
  if (!fontBytesPromise) {
    fontBytesPromise = fetch('/fonts/NotoSansKR.ttf').then((res) => {
      if (!res.ok) throw new Error('한글 폰트를 불러오지 못했습니다');
      return res.arrayBuffer();
    });
  }
  return fontBytesPromise;
}

export function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && font.widthOfTextAtSize(candidate, size) > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// fromTop(페이지 상단부터의 거리, pt) 위치에 베이스라인이 오도록 pdf-lib 좌표(하단원점)로 변환.
// fpdf의 top-left 셀 좌표계를 그대로 흉내내는 근사치 — size의 ~80%를 베이스라인 오프셋으로 사용.
export function baselineY(pageHeight: number, fromTop: number, size: number): number {
  return pageHeight - fromTop - size * 0.8;
}

export function drawCenteredLine(
  page: PDFPage, font: PDFFont, text: string, size: number,
  color: ReturnType<typeof rgb>, centerX: number, y: number,
): void {
  if (!text) return;
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: centerX - width / 2, y, size, font, color });
}
