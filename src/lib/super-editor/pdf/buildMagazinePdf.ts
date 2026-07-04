// 잡지 조판 PDF를 브라우저에서 직접 생성한다 — 도록(buildCatalogPdf)과 같은 pdf-lib 로컬
// 경로. 입력은 "확정(confirmed)된" 게재 항목들의 구조화 필드(page_no + slot)이며, 호출부가
// confirmed 필터를 이미 마친 배열을 넘긴다(이 모듈은 상태를 모르는 순수 조판 엔진).
//
// 배치 규칙 — 콘텐츠 영역을 2×2 쿼터 그리드로 보고 용량을 쿼터 단위로 계산한다:
//   full(전면)=4칸, half(1/2)=2칸(상단→하단), quarter(1/4)=1칸(좌상→우상→좌하→우하).
// 같은 page_no 안에서 큰 슬롯부터 채우고, 4칸을 넘치면 같은 번호의 연속 페이지("N (계속)")로
// 넘긴 뒤 notices로 보고한다. page_no나 slot이 없는 항목은 조판 입력이 불완전하므로
// 어디에도 배치하지 않고 notices로만 보고한다(인쇄물에 잘못 들어가는 것보다 빠지고 경고가 안전).
//
// 이 PDF는 최종 인쇄 원본이 아니라 조판 시안이다 — 그래서 셀 테두리와 빈 지면 표시를 넣어
// 지면 상태가 한눈에 보이게 한다. 이미지는 도록과 동일하게 resizeImage로 축소 후 임베드.

import { PDFDocument, PDFFont, PDFPage, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { resolveLedgerRefBlob } from '../media/resolveImageBytes';
import { resizeImageToJpeg } from '../media/resizeImage';
import {
  MM, PAGE_SIZES_MM, loadFontBytes, baselineY, drawCenteredLine,
  GRAY_TITLE, GRAY_META, GRAY_SIZE, GRAY_SEP,
} from './shared';
import type { FileEntry } from '../ledger/types';
import type { PlacementKind, PlacementSlot } from '../placements/types';
import type { OutputBuildResult, OutputNotice } from '../output/types';

const MARGIN   = 12 * MM;
const GAP      = 4  * MM;
const CELL_PAD = 2  * MM;
const CAPTION_H = 6 * MM; // 이미지 셀 하단 캡션 띠

const KIND_LABELS: Record<PlacementKind, string> = { ad: '광고', manuscript: '원고' };
const SLOT_UNITS:  Record<PlacementSlot, number> = { full: 4, half: 2, quarter: 1 };

export interface MagazinePlacementInput {
  id:         string;
  kind:       PlacementKind;
  party_name: string;
  size_spec:  string;
  page_no:    number | null;
  slot:       PlacementSlot | null;
  sort_order: number | null;
  created_at: number;
  ledger_ref: string | null;
}

export interface MagazinePdfInput {
  title:       string;
  paper_size?: string; // 'A4' | 'A5', 기본 A4
  /** confirmed 상태 항목만 — 필터는 호출부 책임 */
  placements:  MagazinePlacementInput[];
}

/** 산출물 빌더 공용 계약(output/types.ts)을 그대로 구현 — refId에는 placement id가 들어간다 */
export type MagazinePdfResult = OutputBuildResult;

interface CellRect { x: number; fromTop: number; w: number; h: number }

function noticeLabel(p: MagazinePlacementInput): string {
  return `${KIND_LABELS[p.kind]} · ${p.party_name || '이름 없음'}`;
}

// 쿼터 인덱스: 0=좌상, 1=우상, 2=좌하, 3=우하
function quarterRect(q: number, W: number, H: number): CellRect {
  const cw = (W - 2 * MARGIN - GAP) / 2;
  const ch = (H - 2 * MARGIN - GAP) / 2;
  const col = q % 2;
  const row = q < 2 ? 0 : 1;
  return {
    x:       MARGIN + col * (cw + GAP),
    fromTop: MARGIN + row * (ch + GAP),
    w: cw,
    h: ch,
  };
}

function halfRect(top: boolean, W: number, H: number): CellRect {
  const ch = (H - 2 * MARGIN - GAP) / 2;
  return {
    x:       MARGIN,
    fromTop: top ? MARGIN : MARGIN + ch + GAP,
    w: W - 2 * MARGIN,
    h: ch,
  };
}

function fullRect(W: number, H: number): CellRect {
  return { x: MARGIN, fromTop: MARGIN, w: W - 2 * MARGIN, h: H - 2 * MARGIN };
}

// 물리 페이지 하나의 점유 상태 — 쿼터 4칸 boolean. 배치되면 어느 영역(rect)에 넣을지도 결정.
interface PhysicalPage {
  used: [boolean, boolean, boolean, boolean];
  items: { placement: MagazinePlacementInput; rect: CellRect }[];
  /** 같은 page_no의 몇 번째 물리 페이지인지(0 = 원래 페이지, 1부터 "(계속)") */
  seq: number;
}

// 이 물리 페이지에 slot을 넣어본다 — 들어가면 rect 반환, 안 들어가면 null.
function tryPlace(page: PhysicalPage, slot: PlacementSlot, W: number, H: number): CellRect | null {
  const u = page.used;
  if (slot === 'full') {
    if (u.some(Boolean)) return null;
    u.fill(true);
    return fullRect(W, H);
  }
  if (slot === 'half') {
    if (!u[0] && !u[1]) { u[0] = u[1] = true; return halfRect(true, W, H); }
    if (!u[2] && !u[3]) { u[2] = u[3] = true; return halfRect(false, W, H); }
    return null;
  }
  const q = u.findIndex((v) => !v);
  if (q === -1) return null;
  u[q] = true;
  return quarterRect(q, W, H);
}

function drawCellBorder(page: PDFPage, rect: CellRect, H: number, dashed: boolean): void {
  page.drawRectangle({
    x: rect.x,
    y: H - rect.fromTop - rect.h,
    width: rect.w,
    height: rect.h,
    borderWidth: 0.15 * MM,
    borderColor: GRAY_SEP,
    ...(dashed ? { borderDashArray: [2, 2] } : {}),
  });
}

// 자리표시 셀 — 이미지가 없는(또는 못 불러온) 항목. 종류/이름/크기를 중앙에 쌓는다.
function drawPlaceholderCell(
  page: PDFPage, font: PDFFont, rect: CellRect, H: number, p: MagazinePlacementInput,
): void {
  drawCellBorder(page, rect, H, false);
  const centerX = rect.x + rect.w / 2;
  const midTop = rect.fromTop + rect.h / 2;
  drawCenteredLine(page, font, KIND_LABELS[p.kind], 8.5, GRAY_META, centerX, baselineY(H, midTop - 8 * MM, 8.5));
  drawCenteredLine(page, font, p.party_name || '이름 없음', 11, GRAY_TITLE, centerX, baselineY(H, midTop - 1.5 * MM, 11));
  if (p.size_spec.trim()) {
    drawCenteredLine(page, font, p.size_spec.trim(), 8, GRAY_SIZE, centerX, baselineY(H, midTop + 5 * MM, 8));
  }
}

// 이미지 셀 — 캡션 띠를 남기고 contain-fit으로 배치.
async function drawImageCell(
  pdfDoc: PDFDocument, page: PDFPage, font: PDFFont, rect: CellRect, H: number,
  p: MagazinePlacementInput, imageBlob: Blob,
): Promise<void> {
  const resized = await resizeImageToJpeg(imageBlob);
  const jpg = await pdfDoc.embedJpg(resized.bytes);

  drawCellBorder(page, rect, H, false);
  const innerW = rect.w - 2 * CELL_PAD;
  const innerH = rect.h - 2 * CELL_PAD - CAPTION_H;
  const imgRatio  = resized.width / resized.height;
  const areaRatio = innerW / innerH;
  let placedW: number, placedH: number;
  if (imgRatio > areaRatio) {
    placedW = innerW;
    placedH = innerW / imgRatio;
  } else {
    placedH = innerH;
    placedW = innerH * imgRatio;
  }
  const imgX = rect.x + CELL_PAD + (innerW - placedW) / 2;
  const imgFromTop = rect.fromTop + CELL_PAD + (innerH - placedH) / 2;
  page.drawImage(jpg, { x: imgX, y: H - imgFromTop - placedH, width: placedW, height: placedH });

  const caption = `${KIND_LABELS[p.kind]} · ${p.party_name || '이름 없음'}`;
  drawCenteredLine(
    page, font, caption, 7.5, GRAY_META,
    rect.x + rect.w / 2, baselineY(H, rect.fromTop + rect.h - CELL_PAD - 4 * MM, 7.5),
  );
}

export async function buildMagazinePdf(
  input: MagazinePdfInput,
  entries: Record<string, FileEntry>,
): Promise<MagazinePdfResult> {
  const [wMm, hMm] = PAGE_SIZES_MM[input.paper_size ?? 'A4'] ?? PAGE_SIZES_MM.A4;
  const W = wMm * MM;
  const H = hMm * MM;

  const notices: OutputNotice[] = [];

  // ── 1) 배치 계획(레이아웃 계산만, 그리기 전) ────────────────────────────
  const placeable: MagazinePlacementInput[] = [];
  for (const p of input.placements) {
    if (p.page_no == null || p.slot == null) {
      notices.push({
        refId: p.id, label: noticeLabel(p),
        reason: '게재 페이지 또는 배치(전면/1/2/1/4)가 미지정이라 조판에서 제외했습니다',
      });
    } else {
      placeable.push(p);
    }
  }

  // page_no 오름차순 그룹, 그룹 안은 큰 슬롯부터(전면→1/2→1/4), 동급은 sort_order→생성순
  const byPage = new Map<number, MagazinePlacementInput[]>();
  for (const p of placeable) {
    const list = byPage.get(p.page_no!) ?? [];
    list.push(p);
    byPage.set(p.page_no!, list);
  }
  const pageNos = [...byPage.keys()].sort((a, b) => a - b);

  const plannedPages: { pageNo: number; physical: PhysicalPage }[] = [];
  for (const pageNo of pageNos) {
    const items = byPage.get(pageNo)!.sort((a, b) => {
      const units = SLOT_UNITS[b.slot!] - SLOT_UNITS[a.slot!];
      if (units !== 0) return units;
      const sa = a.sort_order ?? Number.MAX_SAFE_INTEGER;
      const sb = b.sort_order ?? Number.MAX_SAFE_INTEGER;
      if (sa !== sb) return sa - sb;
      return a.created_at - b.created_at;
    });

    const physicals: PhysicalPage[] = [{ used: [false, false, false, false], items: [], seq: 0 }];
    for (const p of items) {
      let placedOn: PhysicalPage | null = null;
      for (const phys of physicals) {
        const rect = tryPlace(phys, p.slot!, W, H);
        if (rect) { phys.items.push({ placement: p, rect }); placedOn = phys; break; }
      }
      if (!placedOn) {
        const next: PhysicalPage = { used: [false, false, false, false], items: [], seq: physicals.length };
        const rect = tryPlace(next, p.slot!, W, H)!; // 빈 페이지에는 어떤 슬롯이든 반드시 들어간다
        next.items.push({ placement: p, rect });
        physicals.push(next);
        placedOn = next;
      }
      // 원래 지정한 물리 페이지(seq 0)가 아니라 연속 페이지에 실렸으면 — 새로 만들었든
      // 기존 연속 페이지의 빈 칸에 들어갔든 — 사용자가 지정한 지면과 다르므로 항상 경고한다.
      if (placedOn.seq > 0) {
        notices.push({
          refId: p.id, label: noticeLabel(p),
          reason: `${pageNo}페이지 용량(쿼터 4칸) 초과 — "${pageNo} (계속)" 페이지로 배치했습니다`,
        });
      }
    }
    for (const phys of physicals) plannedPages.push({ pageNo, physical: phys });
  }

  // ── 2) 그리기 ───────────────────────────────────────────────────────────
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const fontBytes = await loadFontBytes();
  // subset: false — 도록과 동일. subset:true는 한글 글리프 누락 버그(shared.ts 주석 참고)
  const font = await pdfDoc.embedFont(fontBytes, { subset: false });

  if (plannedPages.length === 0) {
    // 배치 가능한 항목이 하나도 없어도 빈 PDF 대신 안내 페이지 한 장은 남긴다
    const page = pdfDoc.addPage([W, H]);
    drawCenteredLine(page, font, '조판할 수 있는 확정 항목이 없습니다', 11, GRAY_META, W / 2, H / 2);
    return { bytes: await pdfDoc.save(), notices };
  }

  for (const { pageNo, physical } of plannedPages) {
    const page = pdfDoc.addPage([W, H]);

    for (const { placement, rect } of physical.items) {
      const blob = await resolveLedgerRefBlob(placement.ledger_ref, entries);
      if (blob) {
        try {
          await drawImageCell(pdfDoc, page, font, rect, H, placement, blob);
          continue;
        } catch {
          notices.push({
            refId: placement.id, label: noticeLabel(placement),
            reason: '연결된 이미지를 넣지 못해 자리표시로 대체했습니다',
          });
        }
      } else if (placement.ledger_ref) {
        notices.push({
          refId: placement.id, label: noticeLabel(placement),
          reason: '연결된 이미지를 찾지 못해 자리표시로 대체했습니다',
        });
      }
      drawPlaceholderCell(page, font, rect, H, placement);
    }

    // 빈 지면 표시 — 조판 시안이므로 남는 쿼터를 점선 테두리로 보여준다
    for (let q = 0; q < 4; q++) {
      if (!physical.used[q]) {
        const rect = quarterRect(q, W, H);
        drawCellBorder(page, rect, H, true);
        drawCenteredLine(
          page, font, '빈 지면', 7.5, GRAY_SEP,
          rect.x + rect.w / 2, baselineY(H, rect.fromTop + rect.h / 2, 7.5),
        );
      }
    }

    // 하단 페이지 번호(잡지의 실제 페이지 번호) — 연속 페이지는 "(계속)" 표기
    const label = physical.seq === 0 ? String(pageNo) : `${pageNo} (계속)`;
    drawCenteredLine(page, font, label, 9, GRAY_META, W / 2, MARGIN * 0.35);
  }

  return { bytes: await pdfDoc.save(), notices };
}
