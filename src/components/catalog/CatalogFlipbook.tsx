'use client';

// 도록 플립북 — 페이지 내용(표지/작품/후면)만 책임진다. 책 넘김 UX(react-pageflip 설정·
// 세로/가로 감지·터치·네비게이션)는 공용 셸(components/flipbook/FlipbookShell)로 추출됐다.
// 외부 인터페이스(props)는 추출 전과 동일 — 호출부(/catalog 등)는 아무것도 바뀌지 않는다.

import { AizetLogo } from '@/components/AizetLogo';
import { CachedImg } from '@/components/ui/CachedImg';
import { FlipbookShell } from '@/components/flipbook/FlipbookShell';

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
  forcePortrait?:   boolean; // 항상 1페이지씩 표시 (표지 정렬 보장)
}

const BASE_W   = 300;
const BASE_H   = 424;
const BASE_M   = 18;
const BASE_CAP = 72;

export default function CatalogFlipbook({
  artworks,
  exhibitionTitle,
  artistName,
  pageW = BASE_W,
  pageH = BASE_H,
  forcePortrait,
}: Props) {
  const scale  = pageW / BASE_W;
  const margin = Math.round(BASE_M * scale);
  const capH   = Math.round(BASE_CAP * scale);
  const fs     = (px: number) => `${Math.round(px * scale)}px`;

  function pageLabel(page: number, totalPages: number): string {
    if (page === 0) return '표지';
    if (page >= totalPages - 1) return '후면';
    return `p.${page} / ${artworks.length}`;
  }

  const pages = [
    /* ── 표지 ── */
    <div
      key="cover"
      style={{ width: pageW, height: pageH }}
      className="relative bg-stone-50 flex flex-col select-none overflow-hidden border border-stone-100"
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-amber-600" />

      <div className="h-full flex flex-col">
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
            <CachedImg
              id={artworks[0].imageUrl}
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
    </div>,

    /* ── 작품 페이지들 ── */
    ...artworks.map((aw, idx) => (
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
          <CachedImg
            id={aw.imageUrl}
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
    )),

    /* ── 후면 ── */
    <div
      key="back"
      style={{ width: pageW, height: pageH }}
      className="relative bg-stone-50 flex flex-col select-none overflow-hidden border border-stone-100"
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-amber-600" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-600" />

      <div className="h-full flex flex-col items-center justify-center gap-5"
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
    </div>,
  ];

  return (
    <FlipbookShell
      pages={pages}
      pageW={pageW}
      pageH={pageH}
      forcePortrait={forcePortrait}
      pageLabel={pageLabel}
    />
  );
}
