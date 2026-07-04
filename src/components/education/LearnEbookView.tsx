'use client';

// 이북 새창 화면 — 이북 하나만 전체 화면으로(단일 책임). 학습 화면의 "이북 새창으로
// 보기"가 여는 별도 창으로, 영상과 나란히 두고 본다. 렌더러는 기존 EbookFlipbook을
// 무수정 재사용하고, 이 컴포넌트는 창 크기에 맞는 페이지 치수 계산만 더한다.
// 입력은 게시 계약뿐(공개/비공개 경계 유지).

import { useEffect, useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { EbookFlipbook } from '@/components/education/EbookFlipbook';
import { LanguagePicker } from '@/components/i18n/LanguagePicker';
import { buildEbookPages } from '@/lib/super-editor/education/ebookPages';
import {
  publishedToEbookInput, type PublishedEducationEpisode,
} from '@/lib/super-editor/education/published';
import { t } from '@/lib/i18n/messages';
import type { Locale } from '@/lib/i18n/types';

interface Props {
  episode: PublishedEducationEpisode;
  locale: Locale;
}

// EbookFlipbook 기본 페이지 비율(320×452)을 유지한 채 창에 맞는 폭만 계산한다.
const RATIO = 452 / 320;
const HEADER_FOOTER_PX = 190; // 헤더 + 페이지 라벨/안내문 여유
const MIN_W = 220;
const MAX_W = 460;

function fitPageWidth(vw: number, vh: number): number {
  // FlipbookShell이 640px 미만에서 1페이지 세로 모드로 전환하므로 그 기준에 맞춰 나눈다
  const spread = vw >= 640 ? 2 : 1;
  const byWidth  = (vw - 64) / spread;
  const byHeight = (vh - HEADER_FOOTER_PX) / RATIO;
  return Math.round(Math.min(MAX_W, Math.max(MIN_W, Math.min(byWidth, byHeight))));
}

export function LearnEbookView({ episode, locale }: Props) {
  const { snapshot, illustrationUrls } = publishedToEbookInput(episode);
  const { pages } = buildEbookPages(snapshot, locale);

  // 창 크기는 클라이언트에서만 알 수 있다 — 마운트 후 측정(SSR은 로딩 표시)
  const [pageW, setPageW] = useState<number | null>(null);
  useEffect(() => {
    const measure = () => setPageW(fitPageWidth(window.innerWidth, window.innerHeight));
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  return (
    <div className="min-h-screen bg-[#fafaf8] flex flex-col">
      <header className="bg-white border-b border-stone-100">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center shrink-0">
            <GraduationCap size={15} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-stone-900 text-sm truncate">
              {episode.title} · {t(locale, 'learn.ebook')}
            </p>
          </div>
          <a
            href={`/learn/korean/${episode.episodeNo}`}
            className="text-xs text-stone-400 hover:text-amber-700 transition-colors shrink-0"
          >
            {t(locale, 'learn.backToLearn')}
          </a>
          <LanguagePicker initialLocale={locale} />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-6">
        {pageW === null ? (
          <p className="text-sm text-stone-400">{t(locale, 'common.loading')}</p>
        ) : (
          <EbookFlipbook
            pages={pages}
            locale={locale}
            illustrationUrls={illustrationUrls}
            pageW={pageW}
            pageH={Math.round(pageW * RATIO)}
          />
        )}
      </main>
    </div>
  );
}
