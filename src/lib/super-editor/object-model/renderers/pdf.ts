// AIZET Object Model — 두 번째 렌더러: Press PDF(1차, A4 텍스트 + 한글 폰트 임베드).
//
// ⚠ 서버 전용(fontLoader가 fs 사용). pdf-lib 기본 폰트는 한글을 못 찍으므로 모든 텍스트는
// 임베드한 한글 폰트(NanumGothic Regular)로만 그린다. 폰트 임베드는 subset:false 필수 —
// subset:true는 한글 복합 글리프(컴포넌트 참조)를 서브셋에 못 담아 글자 윤곽이 비는 치명적
// 버그가 발생한다(진단 확인, 그려진 글자의 34~54%가 빈 칸으로 렌더됨). 파일이 커지지만(약 2MB)
// 글자 정상성이 우선. 자간(/W 폭)이 넓어지는 문제는 별도 후속 처리한다.
// 렌더러는 Object Model(블록)을 읽기만 하고, 레이아웃 상수(마진·폰트크기)는 이 파일 내부
// 상수로 둔다(블록엔 꾸밈이 없다). 모르는 kind는 건너뛴다.
//
// 1차 범위: image는 실제 임베드 대신 자리표시 사각형 + alt/caption 텍스트만(SVG data URI 등은
// pdf-lib가 임베드 불가 — 실제 이미지 임베드는 다음 단계).

import { PDFDocument, PDFFont, PDFPage, PageSizes, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import type { HeadingData, ImageData, ListData, ListItemData, ParagraphData } from '../types';
import type { BlockNode, DocumentTree } from '../types';
import type { BinaryRenderer } from './types';
import { loadKoreanFontBytes } from './fontLoader';

// ── 레이아웃 상수(pt) ─────────────────────────────────────────────────────────
const MARGIN = 50;
const [PAGE_W, PAGE_H] = PageSizes.A4; // [595.28, 841.89]
const CONTENT_W = PAGE_W - MARGIN * 2;

const HEADING_SIZE: Record<number, number> = { 1: 24, 2: 18, 3: 14 };
const BODY_SIZE = 11;
const BODY_LINE = BODY_SIZE * 1.5;       // 본문 줄간격
const HEADING_LINE_FACTOR = 1.3;
const SPACE_BEFORE_HEADING = 12;
const SPACE_AFTER_HEADING = 6;
const SPACE_AFTER_PARAGRAPH = 8;
const IMAGE_BOX_H = 200;
const CAPTION_SIZE = 9;
const SPACE_AFTER_IMAGE = 12;

const COLOR_TEXT    = rgb(0.1, 0.1, 0.1);
const COLOR_MUTED   = rgb(0.5, 0.5, 0.5);
const COLOR_BOX     = rgb(0.9, 0.9, 0.9);

// ── 그리기 컨텍스트 ───────────────────────────────────────────────────────────
interface Ctx {
  doc:  PDFDocument;
  font: PDFFont;
  page: PDFPage;
  y:    number; // 다음 콘텐츠 상단(위에서 아래로 내려감)
}

function newPage(ctx: Ctx): void {
  ctx.page = ctx.doc.addPage([PAGE_W, PAGE_H]);
  ctx.y = PAGE_H - MARGIN;
}

/** needed(pt)만큼 세로 공간이 없으면 새 페이지로 넘긴다. */
function ensureSpace(ctx: Ctx, needed: number): void {
  if (ctx.y - needed < MARGIN) newPage(ctx);
}

/**
 * 폭(maxWidth) 안에 들어가도록 줄 배열로 분할. 공백 단어 기준으로 채우되, 한 단어(한글 문장처럼
 * 공백 없는 긴 토큰)가 maxWidth보다 넓으면 글자 단위로 쪼갠다(한글은 글자 사이에서 끊어도 됨).
 */
function wrapText(font: PDFFont, size: number, text: string, maxWidth: number): string[] {
  const widthOf = (s: string) => font.widthOfTextAtSize(s, size);
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';

  for (const word of words) {
    if (widthOf(word) > maxWidth) {
      // 긴 토큰 → 글자 단위 분할
      if (cur) { lines.push(cur); cur = ''; }
      let chunk = '';
      for (const ch of word) {
        const cand = chunk + ch;
        if (chunk && widthOf(cand) > maxWidth) { lines.push(chunk); chunk = ch; }
        else chunk = cand;
      }
      cur = chunk;
      continue;
    }
    const cand = cur ? `${cur} ${word}` : word;
    if (cur && widthOf(cand) > maxWidth) { lines.push(cur); cur = word; }
    else cur = cand;
  }
  if (cur) lines.push(cur);
  return lines;
}

/** 여러 줄을 현재 커서에서 아래로 그린다(줄마다 페이지 넘침 검사). */
function drawLines(ctx: Ctx, lines: string[], size: number, lineHeight: number, color = COLOR_TEXT): void {
  for (const line of lines) {
    ensureSpace(ctx, lineHeight);
    // baseline은 상단에서 size만큼 내린 위치(어센트 근사)
    ctx.page.drawText(line, { x: MARGIN, y: ctx.y - size, size, font: ctx.font, color });
    ctx.y -= lineHeight;
  }
}

// ── 블록 렌더 ─────────────────────────────────────────────────────────────────
function renderBlock(ctx: Ctx, node: BlockNode): void {
  switch (node.kind) {
    case 'heading': {
      const d = node.data as HeadingData;
      const size = HEADING_SIZE[d.level] ?? HEADING_SIZE[3];
      ctx.y -= SPACE_BEFORE_HEADING;
      drawLines(ctx, wrapText(ctx.font, size, d.text ?? '', CONTENT_W), size, size * HEADING_LINE_FACTOR);
      ctx.y -= SPACE_AFTER_HEADING;
      break;
    }
    case 'paragraph': {
      const d = node.data as ParagraphData;
      drawLines(ctx, wrapText(ctx.font, BODY_SIZE, d.text ?? '', CONTENT_W), BODY_SIZE, BODY_LINE);
      ctx.y -= SPACE_AFTER_PARAGRAPH;
      break;
    }
    case 'image': {
      const d = node.data as ImageData;
      const captionLines = d.caption ? wrapText(ctx.font, CAPTION_SIZE, d.caption, CONTENT_W) : [];
      const captionH = captionLines.length * (CAPTION_SIZE * 1.4);
      // 이미지 박스 + 캡션이 한 페이지에 들어가도록 통째 공간 확보
      ensureSpace(ctx, IMAGE_BOX_H + captionH + SPACE_AFTER_IMAGE);
      // 자리표시 사각형(연회색)
      const boxTop = ctx.y;
      ctx.page.drawRectangle({ x: MARGIN, y: boxTop - IMAGE_BOX_H, width: CONTENT_W, height: IMAGE_BOX_H, color: COLOR_BOX });
      // 박스 중앙에 alt(회색)
      const alt = d.alt ?? '';
      if (alt) {
        const w = ctx.font.widthOfTextAtSize(alt, BODY_SIZE);
        ctx.page.drawText(alt, {
          x: MARGIN + (CONTENT_W - w) / 2,
          y: boxTop - IMAGE_BOX_H / 2 - BODY_SIZE / 2,
          size: BODY_SIZE, font: ctx.font, color: COLOR_MUTED,
        });
      }
      ctx.y -= IMAGE_BOX_H;
      // 캡션(박스 아래, 회색)
      if (captionLines.length) {
        ctx.y -= 4;
        drawLines(ctx, captionLines, CAPTION_SIZE, CAPTION_SIZE * 1.4, COLOR_MUTED);
      }
      ctx.y -= SPACE_AFTER_IMAGE;
      break;
    }
    case 'list': {
      const d = node.data as ListData;
      const items = node.children.filter((c) => c.kind === 'list_item');
      items.forEach((c, i) => {
        const marker = d.ordered ? `${i + 1}. ` : '• ';
        const text = marker + ((c.data as ListItemData).text ?? '');
        drawLines(ctx, wrapText(ctx.font, BODY_SIZE, text, CONTENT_W), BODY_SIZE, BODY_LINE);
        ctx.y -= 2;
      });
      ctx.y -= SPACE_AFTER_PARAGRAPH;
      break;
    }
    // list_item은 list 안에서만 렌더. 최상위 stray는 무시. 그 외 모르는 kind도 건너뜀.
    default:
      break;
  }
}

export const renderPdf: BinaryRenderer = async (tree: DocumentTree): Promise<Uint8Array> => {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const font = await doc.embedFont(loadKoreanFontBytes(), { subset: false });

  const ctx: Ctx = { doc, font, page: doc.addPage([PAGE_W, PAGE_H]), y: PAGE_H - MARGIN };
  for (const node of tree.blocks) renderBlock(ctx, node);

  return doc.save();
};
