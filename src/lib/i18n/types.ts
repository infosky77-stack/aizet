// 다국어(i18n) 도메인 타입 단일 소스 (서버 모듈 import 없음 — 클라이언트 번들 안전).
//
// 전 사이트(쇼핑몰 상세페이지 · 사이트 UI · 학습 콘텐츠)가 공유하는 뼈대다.
// - ko가 항상 원문(단일 소스)이고 나머지 언어는 파생물이다.
// - 표시 폴백 체인: 요청 언어 → en → ko. "번역이 없어서 빈 화면"은 계약 위반이므로
//   resolveText는 어떤 입력에도 항상 문자열을 돌려준다.
// - 학습 도메인의 StudyLang은 여기서 ko를 뺀 부분집합으로 파생된다(types/korean.ts).
//   지원 언어를 늘릴 땐 SUPPORTED_LOCALES 한 곳만 늘린다.

export const SUPPORTED_LOCALES = ['ko', 'en', 'zh', 'ja', 'vi'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'ko';

/** 언어 선택기에 표시하는 자국어 표기 — 번역하지 않는다(자기 언어는 자기 표기로 찾는 게 관례) */
export const LOCALE_NATIVE_LABELS: Record<Locale, string> = {
  ko: '한국어',
  en: 'English',
  zh: '中文',
  ja: '日本語',
  vi: 'Tiếng Việt',
};

/** 회원 콘텐츠의 다국어 텍스트 — ko 원문이 도메인 필드에 따로 있으면 여기엔 번역만 담긴다 */
export type LocalizedText = Partial<Record<Locale, string>>;

export function isLocale(v: unknown): v is Locale {
  return typeof v === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(v);
}

/**
 * 폴백 체인: 요청 언어 → en → ko → 아무 언어나 첫 값 → ''.
 * 빈 문자열('')은 "번역 없음"으로 취급해 다음 후보로 넘어간다 — 조용한 빈 칸 방지의 마지막 방어선.
 */
export function resolveText(localized: LocalizedText | null | undefined, locale: Locale): string {
  if (!localized) return '';
  for (const l of [locale, 'en', DEFAULT_LOCALE, ...SUPPORTED_LOCALES] as Locale[]) {
    const v = localized[l];
    if (v) return v;
  }
  return '';
}
