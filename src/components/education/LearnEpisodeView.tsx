'use client';

// 학습 화면 본체 — 유튜브식 1단 구성: 큰 영상(주인공) → 제목/이북 새창 단추/언어 선택 →
// 설명 박스(LearnDescription). 이북은 이 화면에 겹치지 않고 별도 라우트(/ebook)를
// 새 창으로 띄워 영상과 나란히 본다. 입력은 게시 계약(PublishedEducationEpisode)뿐 —
// 원장 개념이 없다(공개/비공개 경계).

import { GraduationCap, BookOpen } from 'lucide-react';
import { LanguagePicker } from '@/components/i18n/LanguagePicker';
import { LearnDescription } from '@/components/education/LearnDescription';
import { t } from '@/lib/i18n/messages';
import type { PublishedEducationEpisode } from '@/lib/super-editor/education/published';
import type { Locale } from '@/lib/i18n/types';

interface Props {
  episode: PublishedEducationEpisode;
  /** 서버(getRequestLocale)가 해석한 열람 언어 — LanguagePicker가 바꾸면 전체 리로드 */
  locale: Locale;
}

export function LearnEpisodeView({ episode, locale }: Props) {
  return (
    <div className="min-h-screen bg-[#fafaf8]">
      {/* 슬림 헤더 — 브랜드만(제목은 유튜브처럼 영상 아래) */}
      <header className="bg-white border-b border-stone-100">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center shrink-0">
            <GraduationCap size={15} className="text-white" />
          </div>
          <p className="font-bold text-stone-900 text-sm">{t(locale, 'learn.series')}</p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl pb-12">
        {/* 영상 히어로 — 컬럼 폭을 꽉 채움, 모바일은 좌우 여백 없이(유튜브식) */}
        <div className="sm:px-4 sm:pt-5">
          {episode.videoUrl ? (
            <video
              src={episode.videoUrl}
              controls
              playsInline
              preload="metadata"
              className="w-full aspect-video bg-black sm:rounded-2xl sm:shadow-sm"
            />
          ) : (
            <div className="w-full aspect-video bg-stone-100 sm:rounded-2xl flex items-center justify-center">
              <p className="text-sm text-stone-400">{t(locale, 'learn.videoPending')}</p>
            </div>
          )}
        </div>

        {/* 제목 + 이북 새창 단추 + 언어 선택 */}
        <div className="px-4 pt-4 flex flex-col gap-4">
          <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
            <div className="flex-1 min-w-52">
              <h1 className="text-lg sm:text-xl font-bold text-stone-900 leading-snug">{episode.title}</h1>
              <p className="text-xs text-stone-400 mt-1">
                {t(locale, 'learn.series')} · {t(locale, 'learn.episodeLabel').replace('{n}', String(episode.episodeNo))}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={`/learn/korean/${episode.episodeNo}/ebook`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition-colors shadow-sm"
              >
                <BookOpen size={16} />
                {t(locale, 'learn.openEbook')}
              </a>
              <LanguagePicker initialLocale={locale} />
            </div>
          </div>

          {/* 설명 박스 — 글자 칩 + 카드 스트립 + 사용 안내 */}
          <LearnDescription episode={episode} locale={locale} />
        </div>
      </main>
    </div>
  );
}
