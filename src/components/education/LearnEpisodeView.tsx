'use client';

// 학습 화면 본체 — 영상 플레이어 + 이북 플립북을 나란히(데스크톱 2단 / 모바일 세로 스택).
// 입력은 게시 계약(PublishedEducationEpisode)뿐 — 원장 개념이 없다(공개/비공개 경계).
// 이북은 편집기와 같은 렌더러(EbookFlipbook)를 게시본→스냅샷 어댑터로 재사용한다.

import { GraduationCap } from 'lucide-react';
import { EbookFlipbook } from '@/components/education/EbookFlipbook';
import { LanguagePicker } from '@/components/i18n/LanguagePicker';
import { buildEbookPages } from '@/lib/super-editor/education/ebookPages';
import {
  publishedToEbookInput, type PublishedEducationEpisode,
} from '@/lib/super-editor/education/published';
import type { Locale } from '@/lib/i18n/types';

interface Props {
  episode: PublishedEducationEpisode;
  /** 서버(getRequestLocale)가 해석한 열람 언어 — LanguagePicker가 바꾸면 전체 리로드 */
  locale: Locale;
}

export function LearnEpisodeView({ episode, locale }: Props) {
  const { snapshot, illustrationUrls } = publishedToEbookInput(episode);
  const { pages } = buildEbookPages(snapshot, locale);

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      {/* 헤더 */}
      <header className="bg-white border-b border-stone-100">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-600 flex items-center justify-center shrink-0">
            <GraduationCap size={17} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-stone-900 truncate">{episode.title}</h1>
            <p className="text-xs text-stone-400">3분 한국어 · 제{episode.episodeNo}편</p>
          </div>
          <LanguagePicker initialLocale={locale} />
        </div>
      </header>

      {/* 본문 — 데스크톱 2단(영상|이북), 모바일 세로 스택 */}
      <main className="mx-auto max-w-6xl px-4 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-stone-700">영상으로 배우기</h2>
          {episode.videoUrl ? (
            <video
              src={episode.videoUrl}
              controls
              playsInline
              preload="metadata"
              className="w-full aspect-video rounded-2xl bg-black shadow-sm"
            />
          ) : (
            <div className="w-full aspect-video rounded-2xl bg-stone-100 flex items-center justify-center">
              <p className="text-sm text-stone-400">영상이 아직 준비되지 않았습니다</p>
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3 min-w-0">
          <h2 className="text-sm font-bold text-stone-700">이북으로 배우기</h2>
          <div className="rounded-2xl overflow-hidden border border-stone-100 flex flex-col">
            <EbookFlipbook pages={pages} locale={locale} illustrationUrls={illustrationUrls} />
          </div>
        </section>
      </main>
    </div>
  );
}
