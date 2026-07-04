// 언어별 폰트 스택 — 순수 데이터 (next/font 의존 없음 → Node 단독 테스트 가능).
//
// 실제 웹폰트 로드(next/font/google)는 app/layout.tsx가 하고 CSS 변수(--font-*)만
// 심는다 — 여기는 그 변수들을 언어별 우선순위로 배열한 스택의 단일 소스.
// CJK 폰트는 next/font가 unicode-range 슬라이스로 쪼개 서빙하므로 실제로 화면에
// 쓰인 글자의 조각만 다운로드된다(subset 로드 원칙). preload는 KR만 — ja/zh는
// 해당 언어 접속에서만 필요해서 첫 로딩을 무겁게 하지 않는다.
//
// 스택 뒤쪽에 --font-noto-sans-kr을 겹쳐두는 이유: 번역이 빈 필드는 한국어 원문으로
// 폴백되므로(product/i18n.ts) 일본어/중국어 페이지에도 한글이 섞일 수 있다 —
// JP/SC 폰트에 없는 한글 글리프가 시스템 폰트로 떨어지지 않게 받쳐준다.

import type { Locale } from './types';

export const LOCALE_FONT_STACKS: Record<Locale, string> = {
  ko: 'var(--font-noto-sans-kr), var(--font-geist-sans), "Apple SD Gothic Neo", "Malgun Gothic", sans-serif',
  ja: 'var(--font-noto-sans-jp), "Hiragino Kaku Gothic ProN", "Yu Gothic", var(--font-noto-sans-kr), sans-serif',
  zh: 'var(--font-noto-sans-sc), "PingFang SC", "Microsoft YaHei", var(--font-noto-sans-kr), sans-serif',
  en: 'var(--font-geist-sans), var(--font-noto-sans-kr), Arial, sans-serif',
  vi: 'var(--font-geist-sans), var(--font-noto-sans-kr), Arial, sans-serif',
};
