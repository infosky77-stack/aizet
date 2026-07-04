'use client';

// 학습 화면 설명 박스 — 유튜브 영상 설명란 위치의 학습 안내(단일 책임: 설명 표시).
// ① 이번 편 요약: 글자 칩(글자+로마자) ② 이미지 설명: 게시된 카드 PNG 스트립(누르면
// 확대 — LearnCardLightbox) ③ 사용 안내: 5개국어 3단계(t 사전). 입력은 게시 계약뿐.

import { useState } from 'react';
import { t } from '@/lib/i18n/messages';
import { LearnCardLightbox } from '@/components/education/LearnCardLightbox';
import type { PublishedEducationEpisode } from '@/lib/super-editor/education/published';
import type { Locale } from '@/lib/i18n/types';

interface Props {
  episode: PublishedEducationEpisode;
  locale: Locale;
}

export function LearnDescription({ episode, locale }: Props) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const steps = ['learn.guideStep1', 'learn.guideStep2', 'learn.guideStep3'] as const;

  return (
    <section className="bg-stone-100/80 rounded-2xl p-4 sm:p-5 flex flex-col gap-5">
      {/* ① 이번 편에서 배우기 — 글자 칩 */}
      <div className="flex flex-col gap-2.5">
        <h2 className="text-sm font-bold text-stone-800">{t(locale, 'learn.aboutTitle')}</h2>
        <div className="flex flex-wrap gap-2">
          {episode.units.map((u, i) => (
            <span
              key={`${u.char}-${i}`}
              className="inline-flex items-baseline gap-1.5 bg-white border border-stone-200 rounded-xl px-3 py-1.5"
            >
              <span className="text-xl font-black text-stone-900">{u.char}</span>
              <span className="text-xs text-amber-700 font-semibold">{u.romanization}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ② 이미지 설명 — 게시된 카드 스트립(가로 스크롤, 누르면 확대) */}
      {episode.cards.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <p className="text-xs text-stone-500">{t(locale, 'learn.cardsHint')}</p>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {episode.cards.map((card, i) => (
              <button
                key={`${card.char}-${i}`}
                onClick={() => setLightbox(i)}
                className="shrink-0 w-32 sm:w-40 rounded-xl overflow-hidden border border-stone-200 bg-white hover:border-amber-400 hover:shadow-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                aria-label={card.char}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- 게시 사본 썸네일(고정 규격) */}
                <img src={card.url} alt={card.char} className="w-full aspect-square object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ③ 사용 안내 — 처음 온 학습자용 3단계 */}
      <div className="flex flex-col gap-2.5 border-t border-stone-200 pt-4">
        <h2 className="text-sm font-bold text-stone-800">{t(locale, 'learn.guideTitle')}</h2>
        <ol className="flex flex-col gap-2">
          {steps.map((key, i) => (
            <li key={key} className="flex items-start gap-2.5">
              <span className="shrink-0 w-5 h-5 rounded-full bg-amber-600 text-white text-[11px] font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-stone-600 leading-relaxed">{t(locale, key)}</p>
            </li>
          ))}
        </ol>
      </div>

      {lightbox !== null && (
        <LearnCardLightbox
          cards={episode.cards}
          index={lightbox}
          locale={locale}
          onNavigate={setLightbox}
          onClose={() => setLightbox(null)}
        />
      )}
    </section>
  );
}
