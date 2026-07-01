'use client';

import { useEffect, useRef, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AizetLogo } from '@/components/AizetLogo';

interface ArtworkEntry {
  id:          string;
  imageUrl:    string;
  title:       string;
  year:        string;
  medium:      string;
  size:        string;
  description: string;
}

interface Props {
  artworks:         ArtworkEntry[];
  exhibitionTitle?: string;
  artistName?:      string;
  pageW?:           number;
  pageH?:           number;
}

const BASE_W  = 300;
const BASE_H  = 424;
const BASE_M  = 18;
const BASE_CAP = 72;

export default function CatalogFlipbook({
  artworks,
  exhibitionTitle,
  artistName,
  pageW = BASE_W,
  pageH = BASE_H,
}: Props) {
  const bookRef = useRef<any>(null);
  const [page, setPage] = useState(0);
  const [isPortrait, setIsPortrait] = useState(false);

  const scale  = pageW / BASE_W;
  const margin = Math.round(BASE_M * scale);
  const capH   = Math.round(BASE_CAP * scale);
  const fs     = (px: number) => `${Math.round(px * scale)}px`;

  useEffect(() => {
    const check = () => setIsPortrait(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const totalPages = artworks.length + 2;

  function pageLabel() {
    if (page === 0) return '표지';
    if (page >= totalPages - 1) return '후면';
    return `p.${page} / ${artworks.length}`;
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 overflow-auto py-8 bg-stone-100">

      <div className="drop-shadow-2xl">
        <HTMLFlipBook
          key={`${String(isPortrait)}-${pageW}`}
          ref={bookRef}
          width={pageW}
          height={pageH}
          size="fixed"
          minWidth={pageW}
          maxWidth={pageW}
          minHeight={pageH}
          maxHeight={pageH}
          showCover
          drawShadow
          flippingTime={650}
          usePortrait={isPortrait}
          startZIndex={0}
          autoSize={false}
          maxShadowOpacity={0.45}
          mobileScrollSupport
          clickEventForward
          useMouseEvents
          swipeDistance={30}
          showPageCorners
          disableFlipByClick={false}
          className=""
          style={{}}
          startPage={0}
          onFlip={(e: any) => setPage(e.data)}
        >
          {/* ── 표지 ── */}
          <div
            style={{ width: pageW, height: pageH }}
            className="relative bg-stone-50 flex flex-col select-none overflow-hidden border border-stone-100"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-600" />

            <div className="shrink-0 flex flex-col items-center gap-2"
              style={{ paddingTop: fs(28), paddingBottom: fs(12), paddingLeft: fs(32), paddingRight: fs(32) }}
            >
              {exhibitionTitle ? (
                <p className="font-black leading-snug tracking-tight text-center text-stone-900"
                  style={{ fontSize: fs(14) }}>
                  {exhibitionTitle}
                </p>
              ) : (
                <p className="italic text-center text-stone-300" style={{ fontSize: fs(12) }}>전시명을 입력하세요</p>
              )}
              <div className="h-px bg-amber-500" style={{ width: fs(32) }} />
            </div>

            <div className="flex-1 min-h-0 flex items-center justify-center bg-white border border-stone-100 shadow-sm overflow-hidden"
              style={{ marginLeft: fs(24), marginRight: fs(24) }}
            >
              {artworks.length > 0 ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={artworks[0].imageUrl}
                  alt={artworks[0].title || '대표 작품'}
                  className="w-full h-full object-contain"
                  draggable={false}
                />
              ) : (
                <p className="text-stone-200 text-center leading-relaxed" style={{ fontSize: fs(10) }}>
                  작품을 추가하면<br />여기에 표시됩니다
                </p>
              )}
            </div>

            <div className="shrink-0 flex flex-col items-center gap-1.5"
              style={{ paddingTop: fs(12), paddingBottom: fs(24), paddingLeft: fs(32), paddingRight: fs(32) }}
            >
              <div className="h-px bg-stone-200" style={{ width: fs(32) }} />
              {artistName ? (
                <p className="text-stone-700 font-medium tracking-[0.25em]" style={{ fontSize: fs(11) }}>{artistName}</p>
              ) : (
                <p className="text-stone-300 tracking-[0.15em]" style={{ fontSize: fs(11) }}>작가명</p>
              )}
              <p className="text-stone-400 tracking-[0.2em] mt-0.5" style={{ fontSize: fs(9) }}>CATALOG</p>
            </div>
          </div>

          {/* ── 작품 페이지들 ── */}
          {artworks.map((aw, idx) => (
            <div
              key={aw.id}
              style={{ width: pageW, height: pageH }}
              className="bg-white flex flex-col select-none overflow-hidden"
            >
              <div
                className="flex items-center justify-center bg-stone-50 overflow-hidden"
                style={{
                  margin: `${margin}px ${margin}px 0`,
                  height: pageH - margin - capH,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={aw.imageUrl}
                  alt={aw.title || `작품 ${idx + 1}`}
                  className="w-full h-full object-contain"
                  draggable={false}
                />
              </div>

              <div
                className="flex flex-col items-center border-t border-stone-100 overflow-hidden"
                style={{ height: capH, paddingLeft: margin, paddingRight: margin }}
              >
                <div className="flex-1 flex flex-col items-center justify-center gap-0.5 w-full">
                  {aw.title ? (
                    <p className="font-bold text-stone-800 text-center leading-tight truncate w-full"
                      style={{ fontSize: fs(10) }}>
                      {aw.title}
                    </p>
                  ) : null}
                  {(aw.year || aw.medium) ? (
                    <p className="text-stone-500 text-center" style={{ fontSize: fs(9) }}>
                      {[aw.year, aw.medium].filter(Boolean).join(',  ')}
                    </p>
                  ) : null}
                  {aw.size ? (
                    <p className="text-stone-400 text-center" style={{ fontSize: fs(8) }}>{aw.size}</p>
                  ) : null}
                  {!aw.title && !aw.year && !aw.medium && (
                    <p className="text-stone-300 italic text-center" style={{ fontSize: fs(9) }}>
                      작품 정보를 입력하세요
                    </p>
                  )}
                </div>
                <p className="text-stone-300 pb-1.5" style={{ fontSize: fs(8) }}>p.{idx + 1}</p>
              </div>
            </div>
          ))}

          {/* ── 후면 ── */}
          <div
            style={{ width: pageW, height: pageH }}
            className="relative bg-stone-50 flex flex-col select-none overflow-hidden border border-stone-100"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-600" />
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-600" />

            <div className="flex-1 flex flex-col items-center justify-center gap-5"
              style={{ paddingLeft: fs(40), paddingRight: fs(40) }}
            >
              {(exhibitionTitle || artistName) && (
                <div className="flex flex-col items-center gap-1.5 text-center">
                  {exhibitionTitle && (
                    <p className="text-stone-600 font-bold tracking-wider" style={{ fontSize: fs(11) }}>{exhibitionTitle}</p>
                  )}
                  {artistName && (
                    <p className="text-stone-400 tracking-[0.2em]" style={{ fontSize: fs(10) }}>{artistName}</p>
                  )}
                </div>
              )}

              <div className="h-px bg-amber-400" style={{ width: fs(32) }} />

              <div className="flex flex-col items-center gap-2">
                <div style={{ fontSize: fs(20) }}>
                  <AizetLogo className="font-black tracking-tight" zetColor="#44403c" />
                </div>
                <p className="text-stone-400 tracking-[0.25em]" style={{ fontSize: fs(9) }}>FULL AUTO CATALOG</p>
              </div>

              <div className="h-px bg-stone-200" style={{ width: fs(24) }} />

              <p className="text-stone-300 tracking-wider" style={{ fontSize: fs(8) }}>aizet.co.kr</p>
            </div>
          </div>
        </HTMLFlipBook>
      </div>

      {/* 페이지 네비게이션 */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => bookRef.current?.pageFlip()?.flipPrev()}
          disabled={page === 0}
          className="w-8 h-8 rounded-full bg-white shadow-sm hover:bg-amber-50 hover:text-amber-600 text-stone-500 disabled:opacity-30 transition-colors flex items-center justify-center"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-xs font-semibold text-stone-500 tabular-nums min-w-[80px] text-center">
          {pageLabel()}
        </span>
        <button
          onClick={() => bookRef.current?.pageFlip()?.flipNext()}
          disabled={page >= totalPages - 1}
          className="w-8 h-8 rounded-full bg-white shadow-sm hover:bg-amber-50 hover:text-amber-600 text-stone-500 disabled:opacity-30 transition-colors flex items-center justify-center"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <p className="text-[11px] text-stone-400">
        클릭하거나 드래그해서 페이지를 넘기세요
      </p>
    </div>
  );
}
