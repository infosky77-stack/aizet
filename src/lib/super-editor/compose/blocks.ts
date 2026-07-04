// 범용 합성 블록 모델 — "배경 + 그림 + 글자" 카드류 산출물의 공용 언어(순수 타입·계산,
// DOM/Canvas 모름). education 카드·영상 장면이 첫 사용자이고, 이후 책·앨범·홍보영상 등
// 어떤 콘텐츠든 자기 layout 함수(블록 배치 계산)만 작성하면 드로잉(drawBlocks.ts)·폰트
// 보장·미리보기를 그대로 재사용한다.
//
// 원칙(도메인 공통):
//   - 배치(layout)는 순수 계산 — 글자 폭은 MeasureTextFn 주입식이라 Node 단독 테스트 가능
//   - 한글 등 글자는 반드시 코드(text 블록)로 얹는다 — AI 생성 이미지에 글자를 넣지 않는다
//   - 이미지 블록은 원장 바이트를 직접 모른다 — slot 이름만 선언하고, 해석·비트맵은
//     그리기 호출부가 Record<slot, ImageBitmap>으로 주입한다

export type MeasureTextFn = (text: string, fontSizePx: number, bold: boolean) => number;

export type ComposeBlock =
  /** 단색 판 — color는 rgba() 허용(반투명 판), radiusPx로 라운드 */
  | { kind: 'rect';  x: number; y: number; w: number; h: number; color: string; radiusPx?: number }
  /**
   * 이미지 슬롯 — slot 이름으로 어떤 비트맵을 쓸지 선언(예: 'background', 'illustration').
   * fit: contain(기본, 여백 유지) | cover(슬롯을 가득 채우고 넘치는 부분 crop).
   * radiusPx가 있으면 라운드로 클리핑. 배치만 알고 바이트는 모른다.
   */
  | { kind: 'image'; x: number; y: number; w: number; h: number; slot: string; fit?: 'contain' | 'cover'; radiusPx?: number }
  /** x는 중앙 기준(textAlign center) */
  | { kind: 'text';  text: string; x: number; y: number; fontSizePx: number; bold: boolean; color: string };

export interface ComposeLayout {
  widthPx:  number;
  heightPx: number;
  blocks:   ComposeBlock[];
}

/** maxW에 들어갈 때까지 폰트를 줄인다(최소 minPx) — 긴 단어·넓은 글자 대비 */
export function shrinkToFit(
  text: string, startPx: number, minPx: number, maxW: number,
  bold: boolean, measure: MeasureTextFn,
): number {
  let size = startPx;
  while (size > minPx && measure(text, size, bold) > maxW) size -= 4;
  return Math.max(size, minPx);
}
