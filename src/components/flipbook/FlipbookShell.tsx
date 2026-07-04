'use client';

// 플립북(책 넘김) 공용 셸 — 도메인 무관 골격(단일 책임: 넘김 UX만).
// CatalogFlipbook에서 react-pageflip 설정·세로/가로 감지·터치 스와이프·네비게이션을
// 추출한 것으로, 페이지 안에 무엇이 그려지는지는 전혀 모른다(OutputPreviewOverlay와
// 같은 "골격은 내용을 모른다" 관례). 소비자: 도록(CatalogFlipbook)·이북(EbookFlipbook).
//
// pages: 표지~마지막까지의 완성된 페이지 요소들 — 각 요소는 pageW×pageH 크기의 블록이어야
// 한다(react-pageflip이 자식 하나를 페이지 하나로 취급).

import { useEffect, useRef, useState, type ReactNode } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  pages: ReactNode[];
  pageW: number;
  pageH: number;
  /** 항상 1페이지씩 표시(표지 정렬 보장). 생략하면 화면 폭으로 자동 판단 */
  forcePortrait?: boolean;
  /** 하단 가운데 라벨 — 기본: 표지 / p.N / 후면 */
  pageLabel?: (page: number, totalPages: number) => string;
  /** 하단 안내문 */
  hint?: string;
}

function defaultPageLabel(page: number, totalPages: number): string {
  if (page === 0) return '표지';
  if (page >= totalPages - 1) return '후면';
  return `p.${page} / ${totalPages - 2}`;
}

export function FlipbookShell({
  pages, pageW, pageH, forcePortrait,
  pageLabel = defaultPageLabel,
  hint = '클릭하거나 드래그해서 페이지를 넘기세요',
}: Props) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- react-pageflip이 ref 타입을 제공하지 않음
  const bookRef    = useRef<any>(null);
  const bookWrapRef = useRef<HTMLDivElement>(null);
  const touchRef   = useRef<{ x: number; y: number; locked: boolean } | null>(null);
  const [page, setPage] = useState(0);
  const [isPortrait, setIsPortrait] = useState(false);

  const portraitMode = forcePortrait ?? isPortrait;
  const totalPages = pages.length;

  // 화면 크기 감지 (모바일: 640px 미만 → 1페이지 세로 모드)
  useEffect(() => {
    const check = () => setIsPortrait(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // 커스텀 터치 핸들러 — react-pageflip 내부 스와이프 대신 사용
  // 왼쪽 스와이프 → 다음 장 / 오른쪽 스와이프 → 이전 장 (일관된 방향 보장)
  useEffect(() => {
    const el = bookWrapRef.current;
    if (!el) return;

    const onStart = (e: TouchEvent) => {
      touchRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        locked: false,
      };
    };

    const onMove = (e: TouchEvent) => {
      if (!touchRef.current) return;
      const dx = Math.abs(e.touches[0].clientX - touchRef.current.x);
      const dy = Math.abs(e.touches[0].clientY - touchRef.current.y);
      // 수평 스와이프가 확실히 우세할 때만 스크롤 차단
      if (!touchRef.current.locked && dx > 8 && dx > dy) {
        touchRef.current.locked = true;
      }
      if (touchRef.current.locked) e.preventDefault();
    };

    const onEnd = (e: TouchEvent) => {
      if (!touchRef.current) return;
      const dx = e.changedTouches[0].clientX - touchRef.current.x;
      const dy = e.changedTouches[0].clientY - touchRef.current.y;
      const wasLocked = touchRef.current.locked;
      touchRef.current = null;

      // 수평 스와이프가 아니거나 너무 짧으면 무시
      if (!wasLocked || Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;

      if (dx < 0) {
        bookRef.current?.pageFlip()?.flipNext(); // 왼쪽 스와이프 → 다음 장
      } else {
        bookRef.current?.pageFlip()?.flipPrev(); // 오른쪽 스와이프 → 이전 장
      }
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    // capture: true — react-pageflip 내부 핸들러보다 먼저 실행, preventDefault 우선권 확보
    el.addEventListener('touchmove', onMove, { passive: false, capture: true });
    el.addEventListener('touchend', onEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove, { capture: true } as EventListenerOptions);
      el.removeEventListener('touchend', onEnd);
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 overflow-auto py-8 bg-stone-100">

      {/* bookWrapRef — 커스텀 터치 핸들러 대상 영역 */}
      <div ref={bookWrapRef} className="drop-shadow-2xl">
        <HTMLFlipBook
          key={`${String(portraitMode)}-${pageW}`}
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
          flippingTime={600}
          usePortrait={portraitMode}
          startZIndex={0}
          autoSize={false}
          maxShadowOpacity={0.45}
          mobileScrollSupport
          clickEventForward
          useMouseEvents
          swipeDistance={999}
          showPageCorners
          disableFlipByClick={false}
          className=""
          style={{}}
          startPage={0}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- react-pageflip 이벤트 타입 미제공
          onFlip={(e: any) => setPage(e.data)}
        >
          {pages}
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
          {pageLabel(page, totalPages)}
        </span>
        <button
          onClick={() => bookRef.current?.pageFlip()?.flipNext()}
          disabled={page >= totalPages - 1}
          className="w-8 h-8 rounded-full bg-white shadow-sm hover:bg-amber-50 hover:text-amber-600 text-stone-500 disabled:opacity-30 transition-colors flex items-center justify-center"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <p className="text-[11px] text-stone-400">{hint}</p>
    </div>
  );
}
