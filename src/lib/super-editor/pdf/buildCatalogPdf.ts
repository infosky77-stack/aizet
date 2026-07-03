// 도록(작품집) PDF를 브라우저에서 직접 생성한다 — scripts/render-catalog.py(fpdf2 서버 렌더)와
// 동일한 레이아웃(여백·순서·캡션 구성)을 pdf-lib로 이식한 것. 서버 왕복 없이 pdf-lib만으로 조립하고,
// 이미지는 resizeImage.ts로 미리 축소·JPEG 압축한 뒤 임베드한다 — 51MB대였던 산출물을 수 MB로 줄이는
// 핵심이 여기(원본 그대로 박아넣지 않는 것)에 있다.
//
// 폰트 관련: render-catalog.py는 NotoSansKR.ttf 한 파일을 style=''와 style='B' 양쪽에 그대로 등록한다
// (별도 Bold 웨이트 파일이 없음 — 즉 원본도 시각적으로는 "가짜 볼드"). 그래서 여기서도 같은 폰트 객체를
// bold 자리에 재사용한다 — 이건 생략이 아니라 원본과 동일한 동작이다.

import { PDFDocument } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { resolveArtworkImageBlob, type ArtworkImageRef } from './resolveImageBytes';
import { resizeImageToJpeg } from './resizeImage';
import {
  MM, PAGE_SIZES_MM, loadFontBytes, wrapText, baselineY, drawCenteredLine,
  GRAY_TITLE, GRAY_META, GRAY_SIZE, GRAY_DESC, GRAY_LINE, GRAY_SEP,
} from './shared';
import type { FileEntry } from '../ledger/types';

const MARGIN = 22 * MM;
const GAP    = 7  * MM;
const CAP_H  = 42 * MM;

export interface CatalogArtworkInput extends ArtworkImageRef {
  title:       string;
  year:        string;
  medium:      string;
  size:        string;
  description: string;
}

export interface CatalogPdfInput {
  exhibition_title: string;
  artist_name:      string;
  paper_size:       string;
  artworks:         CatalogArtworkInput[];
}

export async function buildCatalogPdf(
  snapshot: CatalogPdfInput,
  entries: Record<string, FileEntry>,
): Promise<Uint8Array> {
  const [wMm, hMm] = PAGE_SIZES_MM[snapshot.paper_size] ?? PAGE_SIZES_MM.A4;
  const W = wMm * MM;
  const H = hMm * MM;
  const IMG_W = W - 2 * MARGIN;
  const IMG_H = H - 2 * MARGIN - GAP - CAP_H;
  const centerX = W / 2;

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const fontBytes = await loadFontBytes();
  // subset: false — 일부러 켜지 않음. NotoSansKR.ttf(합자/복합 글리프가 많은 한글 폰트)를
  // pdf-lib@1.17.1 + @pdf-lib/fontkit@1.1.1(둘 다 현재 최신)로 subset:true 임베드하면 일부
  // 한글 음절의 글리프가 누락되어 텍스트가 깨져 보이는 버그를 실측 재현으로 확인했다
  // (예: "김다사랑" → "다사"만 렌더링). subset:false는 완전히 정상 렌더링됨을 확인.
  // 대신 압축된 풀폰트(~5.3MB)가 PDF마다 고정 비용으로 붙는다 — 그래도 이미지 리사이즈가
  // 지배적 요인이라 51MB대 원본 대비로는 여전히 큰 폭 축소.
  const font = await pdfDoc.embedFont(fontBytes, { subset: false });
  const boldFont = font; // render-catalog.py와 동일하게 같은 폰트를 볼드 자리에도 사용

  const exhibitionTitle = snapshot.exhibition_title.trim();
  const artistName      = snapshot.artist_name.trim();

  // ── 표지 ─────────────────────────────────────────────────────────────
  if (exhibitionTitle || artistName) {
    const page = pdfDoc.addPage([W, H]);
    let cursor = H * 0.42; // 상단으로부터의 거리(pt)

    if (exhibitionTitle) {
      const lines = wrapText(exhibitionTitle, boldFont, 20, IMG_W);
      for (const line of lines) {
        drawCenteredLine(page, boldFont, line, 20, GRAY_TITLE, centerX, baselineY(H, cursor, 20));
        cursor += 11 * MM;
      }
      cursor += 5 * MM;
    }

    page.drawLine({
      start: { x: W * 0.35, y: H - cursor },
      end:   { x: W * 0.65, y: H - cursor },
      thickness: 0.25 * MM,
      color: GRAY_LINE,
    });
    cursor += 7 * MM;

    if (artistName) {
      drawCenteredLine(page, font, artistName, 12, GRAY_META, centerX, baselineY(H, cursor, 12));
    }
  }

  // ── 작품 페이지 ──────────────────────────────────────────────────────
  for (const artwork of snapshot.artworks) {
    let blob: Blob;
    try {
      blob = await resolveArtworkImageBlob(artwork, entries);
    } catch {
      continue; // render-catalog.py와 동일하게, 못 불러온 이미지는 건너뛴다
    }

    let resized;
    try {
      resized = await resizeImageToJpeg(blob);
    } catch {
      continue;
    }

    const jpg = await pdfDoc.embedJpg(resized.bytes);
    const page = pdfDoc.addPage([W, H]);

    const imgRatio  = resized.width / resized.height;
    const areaRatio = IMG_W / IMG_H;
    let placedW: number, placedH: number;
    if (imgRatio > areaRatio) {
      placedW = IMG_W;
      placedH = IMG_W / imgRatio;
    } else {
      placedH = IMG_H;
      placedW = IMG_H * imgRatio;
    }
    const imgX = MARGIN + (IMG_W - placedW) / 2;
    const imgYFromTop = MARGIN + (IMG_H - placedH) / 2;
    page.drawImage(jpg, {
      x: imgX,
      y: H - imgYFromTop - placedH,
      width: placedW,
      height: placedH,
    });

    let cursor = MARGIN + IMG_H + GAP; // 캡션 영역 시작(상단으로부터)

    page.drawLine({
      start: { x: MARGIN, y: H - (cursor - 1.5 * MM) },
      end:   { x: W - MARGIN, y: H - (cursor - 1.5 * MM) },
      thickness: 0.2 * MM,
      color: GRAY_SEP,
    });

    const title = artwork.title.trim();
    if (title) {
      drawCenteredLine(page, boldFont, title, 10.5, GRAY_TITLE, centerX, baselineY(H, cursor, 10.5));
      cursor += 7 * MM;
    }

    const metaParts = [artwork.year.trim(), artwork.medium.trim()].filter(Boolean);
    if (metaParts.length > 0) {
      drawCenteredLine(page, font, metaParts.join(',  '), 8.5, GRAY_META, centerX, baselineY(H, cursor, 8.5));
      cursor += 5.5 * MM;
    }

    const size = artwork.size.trim();
    if (size) {
      drawCenteredLine(page, font, size, 8, GRAY_SIZE, centerX, baselineY(H, cursor, 8));
      cursor += 5 * MM;
    }

    const description = artwork.description.trim();
    if (description) {
      const lines = wrapText(description, font, 7.5, IMG_W);
      let descCursor = cursor + 1.5 * MM;
      for (const line of lines) {
        drawCenteredLine(page, font, line, 7.5, GRAY_DESC, centerX, baselineY(H, descCursor, 7.5));
        descCursor += 4.5 * MM;
      }
    }
  }

  return pdfDoc.save();
}
