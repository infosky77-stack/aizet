// i18n 뼈대 테스트 — 언어 감지(쿠키/Accept-Language) · 폴백 체인 · UI 사전 커버리지
import {
  resolveText, isLocale, SUPPORTED_LOCALES, DEFAULT_LOCALE, LOCALE_NATIVE_LABELS,
} from '../src/lib/i18n/types';
import {
  normalizeLanguageTag, localeFromAcceptLanguage, resolveLocale,
} from '../src/lib/i18n/detect';
import { t } from '../src/lib/i18n/messages';
import { ko, type MessageKey } from '../src/lib/i18n/messages/ko';

const checks: [string, boolean][] = [];

// ── isLocale 가드 ─────────────────────────────────────────────────────────
checks.push(['ko/en/zh/ja/vi 5개 언어', SUPPORTED_LOCALES.length === 5]);
checks.push(['기본 언어는 ko', DEFAULT_LOCALE === 'ko']);
checks.push(['isLocale: 지원 언어 통과', SUPPORTED_LOCALES.every((l) => isLocale(l))]);
checks.push(['isLocale: 미지원 언어 거부', !isLocale('fr') && !isLocale('') && !isLocale(null)]);
checks.push(['모든 언어에 자국어 표기 존재', SUPPORTED_LOCALES.every((l) => LOCALE_NATIVE_LABELS[l].length > 0)]);

// ── normalizeLanguageTag — BCP 47 → 지원 언어 ─────────────────────────────
checks.push(['ko-KR → ko', normalizeLanguageTag('ko-KR') === 'ko']);
checks.push(['zh-CN → zh', normalizeLanguageTag('zh-CN') === 'zh']);
checks.push(['zh-Hant-TW → zh', normalizeLanguageTag('zh-Hant-TW') === 'zh']);
checks.push(['EN(대문자) → en', normalizeLanguageTag('EN') === 'en']);
checks.push(['미지원(fr-FR) → null', normalizeLanguageTag('fr-FR') === null]);
checks.push(['빈 값 → null', normalizeLanguageTag('') === null && normalizeLanguageTag(null) === null]);

// ── localeFromAcceptLanguage — q값 순서 존중 ──────────────────────────────
checks.push(['en-US,en;q=0.9,ko;q=0.8 → en', localeFromAcceptLanguage('en-US,en;q=0.9,ko;q=0.8') === 'en']);
checks.push(['미지원 우선(fr;q=1.0,ja;q=0.8) → ja 폴백', localeFromAcceptLanguage('fr;q=1.0,ja;q=0.8') === 'ja']);
checks.push(['q값 역전(ko;q=0.5,vi;q=0.9) → vi', localeFromAcceptLanguage('ko;q=0.5,vi;q=0.9') === 'vi']);
checks.push(['단일 태그(navigator.language 형태) zh-CN → zh', localeFromAcceptLanguage('zh-CN') === 'zh']);
checks.push(['전부 미지원(fr,de) → null', localeFromAcceptLanguage('fr,de') === null]);
checks.push(['null/빈 헤더 → null', localeFromAcceptLanguage(null) === null && localeFromAcceptLanguage('') === null]);
checks.push(['깨진 q값은 0 취급(ja;q=abc,vi;q=0.5 → vi)', localeFromAcceptLanguage('ja;q=abc,vi;q=0.5') === 'vi']);

// ── resolveLocale — 쿠키(수동) > 자동 감지 > ko ───────────────────────────
checks.push(['유효 쿠키가 헤더보다 우선', resolveLocale('ja', 'en-US') === 'ja']);
checks.push(['무효 쿠키는 무시하고 헤더', resolveLocale('hacked', 'vi') === 'vi']);
checks.push(['쿠키·헤더 모두 없으면 ko', resolveLocale(null, null) === 'ko']);
checks.push(['쿠키 없음 + 미지원 헤더 → ko', resolveLocale(undefined, 'fr-FR') === 'ko']);

// ── resolveText — 요청 언어 → en → ko, 빈 문자열은 번역 없음 취급 ─────────
const full  = { ko: '안녕', en: 'Hello', ja: 'こんにちは' };
checks.push(['요청 언어 그대로', resolveText(full, 'ja') === 'こんにちは']);
checks.push(['없으면 en 폴백', resolveText(full, 'vi') === 'Hello']);
checks.push(['en도 없으면 ko 폴백', resolveText({ ko: '안녕' }, 'zh') === '안녕']);
checks.push(['빈 문자열은 건너뛰고 폴백', resolveText({ ko: '안녕', en: '' }, 'en') === '안녕']);
checks.push(['ko·en 없이 다른 언어만 있어도 빈 값 안 냄', resolveText({ vi: 'Xin chào' }, 'ja') === 'Xin chào']);
checks.push(['null/빈 객체 → 빈 문자열(크래시 없음)', resolveText(null, 'ko') === '' && resolveText({}, 'en') === '']);

// ── t() — 모든 (언어 × 키)에서 항상 문자열 (조용한 undefined 금지) ────────
const keys = Object.keys(ko) as MessageKey[];
checks.push(['사전 키가 비어있지 않음', keys.length > 0]);
for (const locale of SUPPORTED_LOCALES) {
  checks.push([
    `t(${locale}, *): 전체 ${keys.length}키 비지 않은 문자열`,
    keys.every((k) => typeof t(locale, k) === 'string' && t(locale, k).length > 0),
  ]);
}
checks.push(['t(ja, shop.cart)는 일본어 번역', t('ja', 'shop.cart') === 'カート']);
checks.push(['t(ko, shop.cart)는 원문', t('ko', 'shop.cart') === '장바구니']);

let failed = 0;
for (const [name, ok] of checks) { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}`); }
console.log(`\n${checks.length - failed}/${checks.length} passed`);
process.exit(failed === 0 ? 0 : 1);
