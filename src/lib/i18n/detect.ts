// 접속 언어 결정 — 순수 로직만 (Next/브라우저 API import 없음 → Node 단독 테스트 가능).
//
// 우선순위: ① aizet_locale 쿠키(수동 선택 — LanguagePicker만 기록)
//          ② Accept-Language 헤더(서버) / navigator.language(클라이언트) 자동 감지
//          ③ ko (기본)
// 쿠키는 수동 선택 시에만 기록한다 — 자동 감지값을 쿠키로 굳히면 나중에 브라우저
// 언어를 바꾼 사용자가 옛 감지값에 갇히기 때문이다.
// 서버(lib/i18n/server.ts)와 클라이언트(hooks/useLocale.ts)가 같은 resolveLocale을 쓴다.

import { DEFAULT_LOCALE, isLocale, type Locale } from './types';

export const LOCALE_COOKIE = 'aizet_locale';
export const LOCALE_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 365; // 1년

/** BCP 47 태그를 지원 언어로 정규화 — 'ko-KR'→'ko', 'zh-Hant-TW'→'zh'. 미지원 언어는 null */
export function normalizeLanguageTag(tag: string | null | undefined): Locale | null {
  if (!tag) return null;
  const primary = tag.trim().toLowerCase().split('-')[0];
  return isLocale(primary) ? primary : null;
}

/** Accept-Language 헤더 파싱 — q값 내림차순으로 훑어 첫 지원 언어. 단일 태그(navigator.language)도 처리 */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null;
  const entries = header
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';');
      const qParam = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
      const q = qParam ? parseFloat(qParam.slice(2)) : 1;
      return { tag, q: Number.isFinite(q) ? q : 0 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { tag } of entries) {
    const locale = normalizeLanguageTag(tag);
    if (locale) return locale;
  }
  return null;
}

/** 우선순위 합성 — cookieValue(수동 선택)가 유효하면 그대로, 아니면 자동 감지, 그것도 없으면 ko */
export function resolveLocale(
  cookieValue: string | null | undefined,
  languageHint: string | null | undefined,
): Locale {
  if (isLocale(cookieValue)) return cookieValue;
  return localeFromAcceptLanguage(languageHint) ?? DEFAULT_LOCALE;
}
