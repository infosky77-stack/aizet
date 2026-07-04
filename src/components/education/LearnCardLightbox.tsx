'use client';

// 학습 카드 확대 보기 — 학습 화면 전용 경량 오버레이(단일 책임: 카드 크게 보기 + 넘기기).
// OutputPreviewOverlay는 [절대 보존]이라 쓰지 않고 자체 구현한다 — 회원 편집기 골격과
// 학습자 화면이 서로 끌려가지 않게 분리(입력도 게시 계약의 cards뿐, 원장 개념 없음).

import { useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { t } from '@/lib/i18n/messages';
import type { Locale } from '@/lib/i18n/types';

interface Props {
  cards: { char: string; url: string }[];
  index: number;
  locale: Locale;
  onNavigate: (index: number) => void;
  onClose: () => void;
}

export function LearnCardLightbox({ cards, index, locale, onNavigate, onClose }: Props) {
  const card = cards[index];
  const prev = useCallback(
    () => onNavigate((index - 1 + cards.length) % cards.length),
    [index, cards.length, onNavigate],
  );
  const next = useCallback(
    () => onNavigate((index + 1) % cards.length),
    [index, cards.length, onNavigate],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, prev, next]);

  // 오버레이가 떠 있는 동안 뒤 화면 스크롤 잠금
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, []);

  if (!card) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 flex flex-col items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={card.char}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        aria-label={t(locale, 'common.close')}
      >
        <X size={26} />
      </button>

      {/* eslint-disable-next-line @next/next/no-img-element -- 게시 사본은 크기 고정 1080²라 최적화 불필요 */}
      <img
        src={card.url}
        alt={card.char}
        onClick={(e) => e.stopPropagation()}
        className="max-w-full max-h-[82vh] rounded-2xl shadow-2xl select-none"
      />

      <div className="mt-4 flex items-center gap-6" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={prev}
          className="p-2.5 rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors"
          aria-label="previous"
        >
          <ChevronLeft size={22} />
        </button>
        <p className="text-white font-bold text-lg min-w-16 text-center">
          {card.char}
          <span className="ml-2 text-white/50 text-sm font-normal">{index + 1} / {cards.length}</span>
        </p>
        <button
          onClick={next}
          className="p-2.5 rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors"
          aria-label="next"
        >
          <ChevronRight size={22} />
        </button>
      </div>
    </div>
  );
}
