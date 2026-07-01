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
}

const PAGE_W = 300;
const PAGE_H = 424; // A4 비율
const MARGIN = 18;
const CAP_H  = 72;

export default function CatalogFlipbook({ artworks, exhibitionTitle, artistName }: Props) {
  const bookRef = useRef<any>(null);
  const [page, setPage] = useState(0);
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const check = () => setIsPortrait(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // 표지 + 작품 페이지들 + 후면
  const totalPages = artworks.length + 2;

  function pageLabel() {
    if (page === 0) return '표지';
    if (page >= totalPages - 1) return '후면';
    return `p.${page} / ${artworks.length}`;
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 overflow-auto py-8 bg-stone-100">

      {/* 플립북 본체 */}
      <div className="drop-shadow-2xl">
        <HTMLFlipBook
          key={String(isPortrait)}
          ref={bookRef}
          width={PAGE_W}
          height={PAGE_H}
          size="fixed"
          minWidth={PAGE_W}
          maxWidth={PAGE_W}
          minHeight={PAGE_H}
          maxHeight={PAGE_H}
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
            style={{ width: PAGE_W, height: PAGE_H }}
            className="relative bg-stone-50 flex flex-col items-center justify-center select-none overflow-hidden border border-stone-100"
          >
            {/* 상단 앰버 포인트 라인 */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-600" />

            <div className="flex flex-col items-center gap-4 px-10 text-center">
              {/* 전시명 */}
              {exhibitionTitle ? (
                <p className="text-stone-900 font-black text-lg leading-snug tracking-tight">
                  {exhibitionTitle}
                </p>
              ) : (
                <p className="text-stone-300 text-sm italic">전시명을 입력하세요</p>
              )}

              {/* 앰버 구분선 */}
              <div className="w-8 h-px bg-amber-500" />

              {/* 작가명 */}
              {artistName ? (
                <p className="text-stone-600 text-[11px] tracking-[0.25em]">{artistName}</p>
              ) : (
                <p className="text-stone-300 text-[11px] tracking-[0.15em]">작가명</p>
              )}
            </div>

            {/* 하단 브랜드 */}
            <div className="absolute bottom-5 flex flex-col items-center gap-1.5">
              <div className="w-6 h-px bg-stone-200" />
              <p className="text-stone-400 text-[9px] tracking-[0.2em]">CATALOG</p>
            </div>
          </div>

          {/* ── 작품 페이지들 ── */}
          {artworks.map((aw, idx) => (
            <div
              key={aw.id}
              style={{ width: PAGE_W, height: PAGE_H }}
              className="bg-white flex flex-col select-none overflow-hidden"
            >
              {/* 이미지 영역 */}
              <div
                className="flex items-center justify-center bg-stone-50 overflow-hidden"
                style={{
                  margin: `${MARGIN}px ${MARGIN}px 0`,
                  height: PAGE_H - MARGIN - CAP_H,
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

              {/* 캡션 영역 */}
              <div
                className="flex flex-col items-center border-t border-stone-100 overflow-hidden"
                style={{ height: CAP_H, paddingLeft: MARGIN, paddingRight: MARGIN }}
              >
                <div className="flex-1 flex flex-col items-center justify-center gap-0.5 w-full">
                  {aw.title ? (
                    <p className="text-[10px] font-bold text-stone-800 text-center leading-tight truncate w-full">
                      {aw.title}
                    </p>
                  ) : null}
                  {(aw.year || aw.medium) ? (
                    <p className="text-[9px] text-stone-500 text-center">
                      {[aw.year, aw.medium].filter(Boolean).join(',  ')}
                    </p>
                  ) : null}
                  {aw.size ? (
                    <p className="text-[8px] text-stone-400 text-center">{aw.size}</p>
                  ) : null}
                  {!aw.title && !aw.year && !aw.medium && (
                    <p className="text-[9px] text-stone-300 italic text-center">
                      작품 정보를 입력하세요
                    </p>
                  )}
                </div>
                <p className="text-[8px] text-stone-300 pb-1.5">p.{idx + 1}</p>
              </div>
            </div>
          ))}

          {/* ── 후면 ── */}
          <div
            style={{ width: PAGE_W, height: PAGE_H }}
            className="relative bg-stone-50 flex flex-col items-center justify-center select-none overflow-hidden border border-stone-100"
          >
            {/* 하단 앰버 포인트 라인 */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-600" />

            <div className="flex flex-col items-center gap-3">
              <AizetLogo className="text-xl font-black tracking-tight" zetColor="#44403c" />
              <div className="w-6 h-px bg-stone-200" />
              <p className="text-stone-400 text-[9px] tracking-[0.2em]">FULL AUTO CATALOG</p>
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
