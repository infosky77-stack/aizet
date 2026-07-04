'use client';

// 클라이언트에서 접속 언어 읽기/변경 — 서버 컴포넌트는 lib/i18n/server.ts(getRequestLocale)를 쓴다.
//
// 쿠키+navigator.language는 React 밖의 외부 저장소이므로 useSyncExternalStore로 읽는다:
// 서버 스냅샷(initialLocale ?? ko)으로 hydration을 통과한 뒤 클라이언트 감지값으로
// 자연스럽게 재렌더된다. 언어가 첫 화면부터 중요한 페이지는 서버 컴포넌트에서
// getRequestLocale() 결과를 initialLocale로 내려줄 것(그러면 깜빡임 없음).

import { useCallback, useSyncExternalStore } from 'react';
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE_SEC, resolveLocale } from '@/lib/i18n/detect';
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/types';

function readCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

// 언어 변경은 항상 전체 새로고침(setLocale)이므로 구독할 변경 이벤트가 없다
const subscribeNoop = () => () => {};

export function useLocale(initialLocale?: Locale) {
  const locale = useSyncExternalStore<Locale>(
    subscribeNoop,
    () => resolveLocale(readCookie(LOCALE_COOKIE), navigator.language),
    () => initialLocale ?? DEFAULT_LOCALE,
  );

  /** 수동 언어 선택 — 쿠키에 굳히고 전체 새로고침(서버 컴포넌트도 같은 언어로 다시 그린다) */
  const setLocale = useCallback((next: Locale) => {
    document.cookie =
      `${LOCALE_COOKIE}=${next}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE_SEC}; samesite=lax`;
    window.location.reload();
  }, []);

  return { locale, setLocale };
}
