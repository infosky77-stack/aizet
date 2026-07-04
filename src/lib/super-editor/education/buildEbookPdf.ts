// 이북 인쇄용 PDF를 브라우저에서 직접 생성한다 — 도록/잡지 PDF와 같은 pdf-lib 로컬 경로
// (서버 왕복 0), 산출물 빌더 공용 계약(output/types.ts) 구현.
//
// 내용은 ebookPages.ts의 페이지 모델을 그대로 소비한다 — 화면 플립북과 같은 단일 소스라
// "화면에서 본 책"과 "인쇄한 책"이 항상 같다. 이 모듈은 좌표 계산과 그리기만 한다.
// 삽화 해석 실패는 글자만으로 페이지를 완성하고 notices로 보고(카드 빌더와 동일 원칙).

import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { resolveLedgerRefBlob } from '../media/resolveImageBytes';
import { resizeImageToJpeg } from '../media/resizeImage';
import {
  MM, PAGE_SIZES_MM, loadFontBytes, wrapText, baselineY, drawCenteredLine,
  GRAY_TITLE, GRAY_META, GRAY_SIZE,
} from '../pdf/shared';
import { buildEbookPages, type EbookPage } from './ebookPages';
import type { EducationSnapshot } from './types';
import type { Locale } from '../../i18n/types';
import type { FileEntry } from '../ledger/types';
import type { OutputBuildResult, OutputNotice } from '../output/types';

const ACCENT = rgb(180 / 255, 83 / 255, 9 / 255); // amber-700 — 카드와 같은 포인트색

export async function buildEbookPdf(
  snapshot: EducationSnapshot,
  entries: Record<string, FileEntry>,
  locale: Locale,
): Promise<OutputBuildResult> {
  const { pages, notices: pageNotices } = buildEbookPages(snapshot, locale);
  const notices: OutputNotice[] = [...pageNotices];

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  // subset:false — 한글 글리프 누락 버그 회피(pdf/shared.ts·buildCatalogPdf.ts 내력 참고)
  const font = await pdfDoc.embedFont(await loadFontBytes(), { subset: false });

  const [wMM, hMM] = PAGE_SIZES_MM.A5;
  const W = wMM * MM, H = hMM * MM;
  const cx = W / 2;

  for (const page of pages) {
    const p = pdfDoc.addPage([W, H]);

    if (page.kind === 'cover') {
      p.drawRectangle({ x: 0, y: H - 4 * MM, width: W, height: 4 * MM, color: ACCENT });
      const titleLines = wrapText(page.title || '한국어 이북', font, 22, W - 40 * MM);
      titleLines.forEach((line, i) => {
        drawCenteredLine(p, font, line, 22, GRAY_TITLE, cx, baselineY(H, 42 * MM + i * 11 * MM, 22));
      });
      drawCenteredLine(p, font, `제${page.episodeNo}편`, 12, GRAY_META, cx, baselineY(H, 60 * MM, 12));
      // 배울 글자 나열 — 표지의 얼굴
      drawCenteredLine(p, font, page.chars.join('  '), 34, ACCENT, cx, baselineY(H, 100 * MM, 34));
      drawCenteredLine(p, font, 'AIZET · 3분 한국어', 9, GRAY_SIZE, cx, baselineY(H, hMM * MM - 18 * MM, 9));

    } else if (page.kind === 'unit') {
      drawCenteredLine(p, font, snapshot.title, 9, GRAY_SIZE, cx, baselineY(H, 12 * MM, 9));

      // 삽화 — 해석 실패/미연결이어도 글자만으로 페이지 완성
      let drewImage = false;
      if (page.illustrationRef) {
        const blob = await resolveLedgerRefBlob(page.illustrationRef, entries);
        if (blob) {
          try {
            const resized = await resizeImageToJpeg(blob, 1200);
            const img = await pdfDoc.embedJpg(resized.bytes);
            const boxW = W - 50 * MM, boxH = 62 * MM;
            const scale = Math.min(boxW / img.width, boxH / img.height);
            const dw = img.width * scale, dh = img.height * scale;
            p.drawImage(img, {
              x: cx - dw / 2,
              y: H - 22 * MM - boxH + (boxH - dh) / 2,
              width: dw, height: dh,
            });
            drewImage = true;
          } catch { /* 아래 공통 보고 */ }
        }
        if (!drewImage) {
          notices.push({
            refId: page.unitId,
            label: `${page.index}번 페이지 (${page.char})`,
            reason: '삽화를 해석하지 못해 글자만으로 인쇄합니다',
          });
        }
      }

      // 글자/로마자/예시 — 삽화 유무에 따라 세로 배치만 달라진다(카드와 같은 규칙)
      const charTop  = drewImage ? 96 * MM : 58 * MM;
      const charSize = drewImage ? 64 : 110;
      drawCenteredLine(p, font, page.char, charSize, GRAY_TITLE, cx, baselineY(H, charTop, charSize));
      drawCenteredLine(p, font, page.romanization, 16, ACCENT, cx, baselineY(H, charTop + (drewImage ? 30 : 48) * MM, 16));
      if (page.exampleKo) {
        drawCenteredLine(p, font, page.exampleKo, 22, GRAY_TITLE, cx, baselineY(H, 168 * MM, 22));
        if (page.exampleTranslated) {
          drawCenteredLine(p, font, page.exampleTranslated, 13, GRAY_META, cx, baselineY(H, 178 * MM, 13));
        }
      }
      drawCenteredLine(p, font, `${page.index}`, 9, GRAY_SIZE, cx, baselineY(H, hMM * MM - 12 * MM, 9));

    } else {
      // 복습 — 배운 글자 전체를 2열 그리드로
      p.drawRectangle({ x: 0, y: H - 4 * MM, width: W, height: 4 * MM, color: ACCENT });
      drawCenteredLine(p, font, '복습', 18, GRAY_TITLE, cx, baselineY(H, 24 * MM, 18));
      page.items.forEach((item, i) => {
        const col = i % 2, row = Math.floor(i / 2);
        const x = W / 4 + col * (W / 2);
        const top = 48 * MM + row * 34 * MM;
        drawCenteredLine(p, font, item.char, 30, GRAY_TITLE, x, baselineY(H, top, 30));
        drawCenteredLine(p, font, item.romanization, 11, ACCENT, x, baselineY(H, top + 14 * MM, 11));
      });
      drawCenteredLine(p, font, 'AIZET · 3분 한국어', 9, GRAY_SIZE, cx, baselineY(H, hMM * MM - 18 * MM, 9));
    }
  }

  return { bytes: await pdfDoc.save(), notices };
}
