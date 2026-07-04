// 학습 카드 이미지를 브라우저에서 직접 생성한다 — 상세페이지·조판 PDF·영상과 같은
// 로컬 경로(서버 왕복 0), 산출물 빌더 공용 계약(output/types.ts)의 bytes+notices 준수.
//
// 역할 분담: 이 모듈은 "폰트 보장 + 원장 해석 + Canvas 그리기"만 한다. 배치는 전부
// cardLayout.ts(순수 계산)가 결정한다. 한글은 Canvas fillText로 코드가 직접 얹는다
// (AI 이미지 생성의 한글 깨짐을 원천 회피 — 삽화는 글자 없는 그림만 담당).
//
// 삽화가 없거나(ref null) 해석에 실패한 유닛도 글자 카드로 완성한다 — 실패는 조용히
// 넘기지 않고 notices로 보고(계약의 핵심). 글자가 빈 유닛만 카드에서 제외한다.

import { resolveLedgerRefBlob } from '../media/resolveImageBytes';
import { layoutEducationCard, CARD_SIZE_PX, type CardBlock } from './cardLayout';
import type { EducationSnapshot } from './types';
import type { FileEntry } from '../ledger/types';
import type { OutputNotice } from '../output/types';

export interface EducationCardImage {
  unitId:   string;
  char:     string;
  filename: string;
  /** PNG — 텍스트 선명도 우선(카드는 평면 색+글자 위주라 용량도 무난) */
  bytes:    Uint8Array;
}

/** output 계약의 다장(多張) 변형 — 카드마다 bytes, notices는 세트 공용 */
export interface EducationCardsResult {
  cards:    EducationCardImage[];
  notices:  OutputNotice[];
  widthPx:  number;
  heightPx: number;
}

// next/font는 해시된 폰트 패밀리명을 CSS 변수(--font-noto-sans-kr)에 심는다 —
// Canvas font 문자열은 CSS 변수를 못 읽으므로 계산값을 꺼내 실제 패밀리명을 얻는다.
// 변수가 없으면(이론상) OS 한글 폰트 폴백 — 어느 쪽이든 한글은 선명하게 나온다.
// (export: inflateEducationScenes가 영상 장면 카드를 같은 폰트·그리기로 만든다)
export function cardFontFamily(): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue('--font-noto-sans-kr').trim();
  return `${v || '"Noto Sans KR"'}, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`;
}

export const fontString = (family: string, sizePx: number, bold: boolean) =>
  `${bold ? '700' : '400'} ${sizePx}px ${family}`;

/** 카드에 쓰는 대표 크기들의 글리프 로드를 기다린다 — 첫 카드부터 웹폰트로 그려지게 */
export async function ensureFontsLoaded(family: string, sampleText: string): Promise<void> {
  try {
    await Promise.all([400, 700].map((w) => document.fonts.load(`${w} 64px ${family}`, sampleText || '한')));
    await document.fonts.ready;
  } catch { /* 폰트 API 실패 시 OS 폴백으로 진행 — 그리기는 막지 않는다 */ }
}

function drawContain(ctx: CanvasRenderingContext2D, bmp: ImageBitmap, x: number, y: number, w: number, h: number): void {
  const scale = Math.min(w / bmp.width, h / bmp.height);
  const dw = bmp.width * scale, dh = bmp.height * scale;
  ctx.drawImage(bmp, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

export function drawBlock(ctx: CanvasRenderingContext2D, block: CardBlock, family: string, bmp: ImageBitmap | null): void {
  if (block.kind === 'rect') {
    ctx.fillStyle = block.color;
    if (block.radiusPx) {
      ctx.beginPath();
      ctx.roundRect(block.x, block.y, block.w, block.h, block.radiusPx);
      ctx.fill();
    } else {
      ctx.fillRect(block.x, block.y, block.w, block.h);
    }
  } else if (block.kind === 'image') {
    if (bmp) drawContain(ctx, bmp, block.x, block.y, block.w, block.h);
  } else {
    ctx.font = fontString(family, block.fontSizePx, block.bold);
    ctx.fillStyle = block.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(block.text, block.x, block.y);
  }
}

function toPngBytes(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) { reject(new Error('PNG 인코딩 실패')); return; }
      resolve(new Uint8Array(await blob.arrayBuffer()));
    }, 'image/png');
  });
}

export async function buildEducationCardImages(
  snapshot: EducationSnapshot,
  entries: Record<string, FileEntry>,
): Promise<EducationCardsResult> {
  const notices: OutputNotice[] = [];
  const cards: EducationCardImage[] = [];
  const family = cardFontFamily();
  await ensureFontsLoaded(family, snapshot.units.map((u) => u.char + u.exampleKo).join(''));

  const canvas = document.createElement('canvas');
  canvas.width = CARD_SIZE_PX;
  canvas.height = CARD_SIZE_PX;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d context 생성 실패');

  const measure = (text: string, sizePx: number, bold: boolean): number => {
    ctx.font = fontString(family, sizePx, bold);
    return ctx.measureText(text).width;
  };

  for (const [i, unit] of snapshot.units.entries()) {
    const label = `${i + 1}번 유닛${unit.char ? ` (${unit.char})` : ''}`;
    if (!unit.char.trim()) {
      notices.push({ refId: unit.id, label, reason: '학습 글자가 비어 있어 카드에서 제외했습니다' });
      continue;
    }

    // 삽화 해석 — 실패해도 글자 카드로 완성하고 보고만 한다
    let bmp: ImageBitmap | null = null;
    if (unit.illustrationRef) {
      const blob = await resolveLedgerRefBlob(unit.illustrationRef, entries);
      if (blob) {
        try { bmp = await createImageBitmap(blob); }
        catch { /* 아래 공통 보고 */ }
      }
      if (!bmp) {
        notices.push({ refId: unit.id, label, reason: '삽화를 해석하지 못해 글자 카드로 만들었습니다' });
      }
    }

    const layout = layoutEducationCard({
      episodeTitle: snapshot.title,
      char: unit.char.trim(),
      romanization: unit.romanization.trim(),
      exampleKo: unit.exampleKo,
      hasIllustration: bmp !== null,
      unitIndex: i,
    }, measure);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const block of layout.blocks) drawBlock(ctx, block, family, bmp);
    bmp?.close();

    cards.push({
      unitId: unit.id,
      char: unit.char.trim(),
      filename: `${snapshot.title || '카드'}-${i + 1}-${unit.char.trim()}.png`,
      bytes: await toPngBytes(canvas),
    });
  }

  return { cards, notices, widthPx: CARD_SIZE_PX, heightPx: CARD_SIZE_PX };
}
