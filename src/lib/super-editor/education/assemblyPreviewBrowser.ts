// 조립 미리보기 브라우저 배선(4-b) — 조립 스냅샷 → mp4까지 잇는 단일 진입.
//
// 이 파일엔 새 "로직"이 없다: 브라우저 전용 measure·resolveBitmap만 여기서 구성하고,
// 씬 조립은 4-a(buildPreviewScenes 순수 배선), 인코딩은 buildAssemblyVideoMp4에 위임한다.
// 분해·씬생성·슬롯규칙은 재구현하지 않는다(각각 assemblyCompose·assemblyScenes·4-a 소관).
//
// measure(canvasMeasure)·원장 해석(resolveLedgerRefBlob)·폰트 보장(compose/drawBlocks)은
// education 카드 빌더(buildCardImage.ts)가 쓰는 것과 동일한 브라우저 헬퍼를 그대로 쓴다.

import { resolveLedgerRefBlob } from '../media/resolveImageBytes';
import { composeFontFamily, ensureComposeFontsLoaded, canvasMeasure } from '../compose/drawBlocks';
import type { EducationSnapshot } from './types';
import type { FileEntry } from '../ledger/types';
import { getUnits } from './assemblyDocStore';
import { buildPreviewScenes, type BitmapResolver } from './assemblyPreviewWiring';
import { buildAssemblyVideoMp4, type AssemblyVideoResult } from './buildAssemblyVideo';

export async function renderAssemblyPreviewMp4(
  snap: EducationSnapshot,
  entries: Record<string, FileEntry>,
  opts: { hasBackground?: boolean; onProgress?: (ratio: number) => void } = {},
): Promise<AssemblyVideoResult> {
  // 1) 폰트 패밀리 해석 → 표본 글리프까지 로드 보장(카드 빌더와 동일 관례)
  const family = composeFontFamily();
  const sampleText = getUnits(snap)
    .map((u) => u.resultKo + u.romanization + u.parts.map((p) => p.glyph + p.pronunciation).join(''))
    .join('');
  await ensureComposeFontsLoaded(family, sampleText);

  // 2) 측정용 canvas ctx(buildCardImage·buildAssemblyVideo와 같은 생성 패턴) → MeasureTextFn
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d context 생성 실패');
  const measure = canvasMeasure(ctx, family);

  // 3) 원장 참조 → 비트맵 해석기(브라우저 전용). buildCardImage의 배경/삽화 해석과 동일:
  //    resolveLedgerRefBlob(ref, entries) → Blob|null → createImageBitmap. 실패는 조용히 null
  //    (4-a가 null이면 슬롯을 생략/폴백하도록 계약됨 — 보고는 렌더러 notices 몫).
  const resolveBitmap: BitmapResolver = async (ref) => {
    const blob = await resolveLedgerRefBlob(ref, entries);
    if (!blob) return null;
    try { return await createImageBitmap(blob); } catch { return null; }
  };

  // 4) 순수 배선(4-a)으로 씬·baseSlots 조립 → 5) 렌더러에 위임
  const { scenes, baseSlots } = await buildPreviewScenes(
    snap, measure, resolveBitmap, { hasBackground: !!opts.hasBackground },
  );
  return buildAssemblyVideoMp4(scenes, family, baseSlots, opts.onProgress);
}
