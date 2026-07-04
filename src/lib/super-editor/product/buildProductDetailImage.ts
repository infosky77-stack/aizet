// 제품 상세페이지(세로형 긴 이미지)를 브라우저에서 직접 생성한다 — 조판 PDF·영상과 같은
// 로컬 경로(서버 왕복 0), 산출물 빌더 공용 계약(output/types.ts) 구현.
//
// 역할 분담: 이 모듈은 "원장 해석 + Canvas 그리기"만 한다. 어디에 무엇이 놓이는지는 전부
// layout.ts(순수 계산)가 결정하므로, 배치 규칙을 바꿀 때 이 파일은 손대지 않는다.
// 산출물은 JPEG 한 장(v1) — 쿠팡/네이버 상세는 이미지 업로드가 실사용 단위라 PDF보다 먼저다.
// 높이가 MAX_RECOMMENDED_HEIGHT_PX를 넘으면 자르지 않고 notices로만 알린다(분할 출력은 보류).

import { resolveLedgerRefBlob } from '../media/resolveImageBytes';
import {
  layoutProductDetail, productSectionLabel, MAX_RECOMMENDED_HEIGHT_PX,
  type MeasureTextFn, type ProductLayoutBlock,
} from './layout';
import { getProductTemplate } from './templates';
import type { ProductDetailSnapshot } from './types';
import type { FileEntry } from '../ledger/types';
import type { OutputBuildResult, OutputNotice } from '../output/types';

/** 산출물 빌더 공용 계약 + 이미지 고유 필드 — refId에는 section id가 들어간다 */
export interface ProductDetailImageResult extends OutputBuildResult {
  widthPx:  number;
  heightPx: number;
}

// 사이트 본문과 같은 계열의 한글 스택 — 웹폰트가 없어도 OS 한글 폰트로 폴백된다
const FONT_FAMILY  = '"Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
const JPEG_QUALITY = 0.9;

function fontString(sizePx: number, bold: boolean): string {
  return `${bold ? '700' : '400'} ${sizePx}px ${FONT_FAMILY}`;
}

function roundRectPath(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawBlock(
  ctx: CanvasRenderingContext2D, block: ProductLayoutBlock,
  bitmaps: Record<string, ImageBitmap>, dividerColor: string,
): void {
  if (block.type === 'rect') {
    ctx.fillStyle = block.color;
    if (block.radiusPx) { roundRectPath(ctx, block.x, block.y, block.w, block.h, block.radiusPx); ctx.fill(); }
    else ctx.fillRect(block.x, block.y, block.w, block.h);

  } else if (block.type === 'text') {
    ctx.font = fontString(block.fontSizePx, block.bold);
    ctx.fillStyle = block.color;
    ctx.textBaseline = 'top';
    ctx.textAlign = block.align === 'center' ? 'center' : 'left';
    ctx.fillText(block.text, block.x, block.y);

  } else if (block.type === 'image') {
    const bmp = bitmaps[block.sectionId];
    if (bmp) ctx.drawImage(bmp, block.x, block.y, block.w, block.h);

  } else { // imagePlaceholder
    ctx.save();
    ctx.strokeStyle = dividerColor;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    roundRectPath(ctx, block.x + 1, block.y + 1, block.w - 2, block.h - 2, 12);
    ctx.stroke();
    ctx.restore();
    ctx.font = fontString(18, false);
    ctx.fillStyle = dividerColor;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(block.label, block.x + block.w / 2, block.y + block.h / 2);
  }
}

export async function buildProductDetailImage(
  snapshot: ProductDetailSnapshot,
  entries: Record<string, FileEntry>,
): Promise<ProductDetailImageResult> {
  const template = getProductTemplate(snapshot.templateId);
  const notices: OutputNotice[] = [];

  // ── 1) 원장 해석: image 섹션의 ledger_ref → ImageBitmap (EXIF 회전 반영) ──
  const bitmaps: Record<string, ImageBitmap> = {};
  const imageSizes: Record<string, { width: number; height: number }> = {};
  for (const [idx, section] of snapshot.sections.entries()) {
    if (section.kind !== 'image' || !section.ledgerRef) continue;
    const blob = await resolveLedgerRefBlob(section.ledgerRef, entries);
    if (blob) {
      try {
        const bmp = await createImageBitmap(blob, { imageOrientation: 'from-image' });
        bitmaps[section.id] = bmp;
        imageSizes[section.id] = { width: bmp.width, height: bmp.height };
        continue;
      } catch { /* 디코드 실패 — 아래 notice로 */ }
    }
    notices.push({
      refId: section.id, label: productSectionLabel(section, idx),
      reason: '연결된 이미지를 불러오지 못해 자리표시로 대체했습니다',
    });
  }

  try {
    // ── 2) 배치 계산(순수) — measure는 실제 렌더와 같은 Canvas 폰트로 주입 ──
    // 웹폰트가 아직 로드 전이면 measure/render가 폴백 폰트로 어긋날 수 있어 로드를 기다린다
    try { await document.fonts.ready; } catch { /* 미지원 브라우저 — 폴백 폰트로 진행 */ }
    const measureCanvas = document.createElement('canvas');
    const mctx = measureCanvas.getContext('2d');
    if (!mctx) throw new Error('canvas 2d context 생성 실패');
    const measure: MeasureTextFn = (text, sizePx, bold) => {
      mctx.font = fontString(sizePx, bold);
      return mctx.measureText(text).width;
    };

    const layout = layoutProductDetail(snapshot, template, imageSizes, measure);
    for (const skip of layout.skipped) {
      notices.push({ refId: skip.sectionId, label: skip.label, reason: skip.reason });
    }
    if (layout.heightPx > MAX_RECOMMENDED_HEIGHT_PX) {
      notices.push({
        label: '산출물 높이',
        reason: `세로 ${layout.heightPx.toLocaleString()}px — 권장 한도(${MAX_RECOMMENDED_HEIGHT_PX.toLocaleString()}px)를 넘어 일부 플랫폼에서 업로드가 거부될 수 있습니다. 섹션을 줄여주세요`,
      });
    }

    // ── 3) 그리기 + JPEG 인코딩 ──
    const canvas = document.createElement('canvas');
    canvas.width  = layout.widthPx;
    canvas.height = layout.heightPx;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas 2d context 생성 실패');

    ctx.fillStyle = template.colors.background;
    ctx.fillRect(0, 0, layout.widthPx, layout.heightPx);
    for (const block of layout.blocks) {
      drawBlock(ctx, block, bitmaps, template.colors.divider);
    }

    const outBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('JPEG 인코딩 실패'))),
        'image/jpeg',
        JPEG_QUALITY,
      );
    });
    const bytes = new Uint8Array(await outBlob.arrayBuffer());
    return { bytes, notices, widthPx: layout.widthPx, heightPx: layout.heightPx };
  } finally {
    for (const bmp of Object.values(bitmaps)) bmp.close();
  }
}
