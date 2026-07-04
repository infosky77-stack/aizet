'use client';

// 언어 수동 선택기 — 자동 감지(navigator.language)가 틀릴 때의 안전판.
// 헤더/푸터 어디에나 꽂을 수 있는 독립 컴포넌트. 선택은 쿠키(aizet_locale)에 저장되고
// 전체 새로고침으로 서버 컴포넌트까지 같은 언어로 다시 그린다(useLocale.setLocale).

import { useState, useRef, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { SUPPORTED_LOCALES, LOCALE_NATIVE_LABELS, type Locale } from '@/lib/i18n/types';

interface Props {
  /** 서버 컴포넌트가 getRequestLocale()로 알아낸 값 — 넘기면 첫 렌더부터 깜빡임 없음 */
  initialLocale?: Locale;
  className?: string;
}

export function LanguagePicker({ initialLocale, className = '' }: Props) {
  const { locale, setLocale } = useLocale(initialLocale);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // 바깥 클릭으로 닫기
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-stone-600 hover:bg-stone-100 transition-colors"
        aria-label="언어 선택 / Language"
        aria-expanded={open}
      >
        <Globe size={16} />
        <span>{LOCALE_NATIVE_LABELS[locale]}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-36 rounded-xl border border-stone-200 bg-white shadow-lg py-1 z-50">
          {SUPPORTED_LOCALES.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => { setOpen(false); if (l !== locale) setLocale(l); }}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-stone-700 hover:bg-stone-50"
            >
              <span>{LOCALE_NATIVE_LABELS[l]}</span>
              {l === locale && <Check size={14} className="text-amber-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
