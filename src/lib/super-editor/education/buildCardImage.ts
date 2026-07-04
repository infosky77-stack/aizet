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
import {
  composeFontFamily, ensureComposeFontsLoaded, canvasMeasure, drawComposeBlock,
} from '../compose/drawBlocks';
import { layoutEducationCard, CARD_SIZE_PX, ILLUSTRATION_SLOT, BACKGROUND_SLOT } from './cardLayout';
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

// 폰트 해석(next/font 해시 패밀리)·fonts.ready 보장·블록 드로잉은 공용 합성 모듈
// (compose/drawBlocks.ts)이 소유한다 — 여기는 원장 해석과 카드 순회만 남는다.

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
  const family = composeFontFamily();
  await ensureComposeFontsLoaded(family, snapshot.units.map((u) => u.char + u.exampleKo).join(''));

  const canvas = document.createElement('canvas');
  canvas.width = CARD_SIZE_PX;
  canvas.height = CARD_SIZE_PX;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d context 생성 실패');

  const measure = canvasMeasure(ctx, family);

  // 회차 공통 배경 — 한 번 해석해 전 카드에 재사용. 실패해도 팔레트 배경으로 완성(보고만)
  let bgBmp: ImageBitmap | null = null;
  if (snapshot.backgroundRef) {
    const blob = await resolveLedgerRefBlob(snapshot.backgroundRef, entries);
    if (blob) {
      try { bgBmp = await createImageBitmap(blob); } catch { /* 아래 공통 보고 */ }
    }
    if (!bgBmp) {
      notices.push({ refId: 'background', label: '배경 이미지', reason: '배경을 해석하지 못해 기본 배경으로 만들었습니다' });
    }
  }

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
      hasBackground: bgBmp !== null,
    }, measure);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const block of layout.blocks) {
      drawComposeBlock(ctx, block, family, { [ILLUSTRATION_SLOT]: bmp, [BACKGROUND_SLOT]: bgBmp });
    }
    bmp?.close();

    cards.push({
      unitId: unit.id,
      char: unit.char.trim(),
      filename: `${snapshot.title || '카드'}-${i + 1}-${unit.char.trim()}.png`,
      bytes: await toPngBytes(canvas),
    });
  }

  bgBmp?.close();
  return { cards, notices, widthPx: CARD_SIZE_PX, heightPx: CARD_SIZE_PX };
}
