'use client';

// 교육 이북 플립북 — 페이지 내용만 책임진다(넘김 UX는 공용 셸 FlipbookShell).
// 내용은 ebookPages.ts 페이지 모델을 그대로 그린다 — 인쇄 PDF(buildEbookPdf)와 같은
// 단일 소스라 화면과 인쇄물이 항상 일치한다. locale에 따라 해당 언어 웹폰트 스택을
// 적용한다(lib/i18n/fontStacks — 칸칸 HTML 상세와 동일 방식). 표시 전용·상태 없음.

import { FlipbookShell } from '@/components/flipbook/FlipbookShell';
import { LOCALE_FONT_STACKS } from '@/lib/i18n/fontStacks';
import type { Locale } from '@/lib/i18n/types';
import type { EbookPage } from '@/lib/super-editor/education/ebookPages';

interface Props {
  pages:  EbookPage[];
  locale: Locale;
  /** illustrationRef → 표시 URL — 해석은 호출부(원장을 아는 쪽) 책임, 없으면 글자만 */
  illustrationUrls: Record<string, string>;
  pageW?: number;
  pageH?: number;
}

const BASE_W = 320;
const BASE_H = 452;

export function EbookFlipbook({ pages, locale, illustrationUrls, pageW = BASE_W, pageH = BASE_H }: Props) {
  const scale = pageW / BASE_W;
  const fs = (px: number) => `${Math.round(px * scale)}px`;
  const unitCount = pages.filter((p) => p.kind === 'unit').length;

  function pageLabel(page: number, totalPages: number): string {
    if (page === 0) return '표지';
    if (page >= totalPages - 1) return '복습';
    return `p.${page} / ${unitCount}`;
  }

  const rendered = pages.map((page, i) => {
    if (page.kind === 'cover') {
      return (
        // 페이지 루트는 크기/배경만 — 배치는 내부 h-full 래퍼가 담당
        // (react-pageflip이 페이지 루트의 flex 배치를 무력화함 — CatalogFlipbook과 같은 구조)
        <div key="cover" style={{ width: pageW, height: pageH }}
          className="relative bg-[#fff8ee] select-none overflow-hidden border border-stone-100">
          <div className="absolute top-0 left-0 right-0 bg-amber-700" style={{ height: fs(5) }} />
          <div className="h-full flex flex-col items-center">
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center"
              style={{ paddingLeft: fs(28), paddingRight: fs(28) }}>
              <p className="font-black leading-snug text-stone-900" style={{ fontSize: fs(19) }}>{page.title}</p>
              <p className="text-stone-400" style={{ fontSize: fs(11) }}>제{page.episodeNo}편</p>
              <p className="font-bold text-amber-700 tracking-widest" style={{ fontSize: fs(26) }}>
                {page.chars.join(' ')}
              </p>
            </div>
            <p className="text-stone-300 tracking-[0.2em]" style={{ fontSize: fs(8), paddingBottom: fs(18) }}>
              AIZET · 3분 한국어
            </p>
          </div>
        </div>
      );
    }

    if (page.kind === 'unit') {
      const imgUrl = page.illustrationRef ? illustrationUrls[page.illustrationRef] : undefined;
      return (
        <div key={page.unitId} style={{ width: pageW, height: pageH }}
          className="bg-white select-none overflow-hidden">
          <div className="h-full flex flex-col items-center">
            <p className="text-stone-300 truncate max-w-full" style={{ fontSize: fs(8), paddingTop: fs(12) }}>
              {/* 상단 러닝헤드는 표지 제목 — cover가 항상 pages[0]이다 */}
              {(pages[0] as Extract<EbookPage, { kind: 'cover' }>).title}
            </p>
            {imgUrl && (
              <div className="flex items-center justify-center overflow-hidden bg-stone-50 rounded shrink-0"
                style={{ width: pageW - 2 * Math.round(24 * scale), height: fs(150), marginTop: fs(8) }}>
                {/* eslint-disable-next-line @next/next/no-img-element -- 로컬 blob/원장 URL */}
                <img src={imgUrl} alt={`${page.char} 삽화`} className="w-full h-full object-contain" draggable={false} />
              </div>
            )}
            <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-1">
              <p className="font-black text-stone-900 leading-none" style={{ fontSize: fs(imgUrl ? 88 : 140) }}>
                {page.char}
              </p>
              <p className="text-amber-700 font-semibold" style={{ fontSize: fs(16) }}>{page.romanization}</p>
            </div>
            {page.exampleKo && (
              <div className="flex flex-col items-center" style={{ paddingBottom: fs(10) }}>
                <p className="font-bold text-stone-800" style={{ fontSize: fs(20) }}>{page.exampleKo}</p>
                {page.exampleTranslated && (
                  <p className="text-stone-500" style={{ fontSize: fs(12) }}>{page.exampleTranslated}</p>
                )}
              </div>
            )}
            <p className="text-stone-300" style={{ fontSize: fs(8), paddingBottom: fs(10) }}>{page.index}</p>
          </div>
        </div>
      );
    }

    return (
      <div key={`review-${i}`} style={{ width: pageW, height: pageH }}
        className="relative bg-[#fff8ee] select-none overflow-hidden border border-stone-100">
        <div className="absolute top-0 left-0 right-0 bg-amber-700" style={{ height: fs(5) }} />
        <div className="h-full flex flex-col items-center">
          <p className="font-black text-stone-900" style={{ fontSize: fs(16), paddingTop: fs(22) }}>복습</p>
          <div className="flex-1 w-full grid grid-cols-2 content-center gap-y-4"
            style={{ paddingLeft: fs(24), paddingRight: fs(24) }}>
            {page.items.map((item) => (
              <div key={item.char} className="flex flex-col items-center gap-0.5">
                <p className="font-black text-stone-900 leading-none" style={{ fontSize: fs(30) }}>{item.char}</p>
                <p className="text-amber-700" style={{ fontSize: fs(10) }}>{item.romanization}</p>
              </div>
            ))}
          </div>
          <p className="text-stone-300 tracking-[0.2em]" style={{ fontSize: fs(8), paddingBottom: fs(18) }}>
            AIZET · 3분 한국어
          </p>
        </div>
      </div>
    );
  });

  return (
    <div lang={locale} style={{ fontFamily: LOCALE_FONT_STACKS[locale] }} className="flex-1 flex flex-col min-h-0">
      <FlipbookShell pages={rendered} pageW={pageW} pageH={pageH} pageLabel={pageLabel} />
    </div>
  );
}
