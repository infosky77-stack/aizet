// 섹션 번역 순수 로직 — 저장 구조 조작(에디터)과 표시 해석(렌더러)의 단일 소스
// (React/DOM/서버 모름 → Node 단독 테스트 가능).
//
// 원칙:
// - ko 원문(text/subText/items)이 항상 단일 소스 — 번역은 파생물이며 이 모듈의
//   demoteTranslations가 "원문이 바뀌면 전 번역 draft 강등"을 보장한다.
// - 절대 규칙: reviewed 전이는 markReviewed(회원의 검수 버튼)로만. AI 초안·수동 입력은
//   전부 draft로 들어온다 — 자동 확정 경로를 만들지 말 것(memberAi와 같은 원칙).
// - 표시 폴백은 필드 단위: 번역의 빈 필드는 원문으로 채운다(lib/i18n resolveText와
//   같은 "빈 화면 금지" 계약의 섹션판).

import { SUPPORTED_LOCALES, type Locale } from '../../i18n/types';
import type {
  ProductSection, ProductFeatureItem, SectionTranslation, TranslationLocale,
} from './types';

export const TRANSLATION_LOCALES =
  SUPPORTED_LOCALES.filter((l): l is TranslationLocale => l !== 'ko');

export function emptyTranslation(): SectionTranslation {
  return { text: '', subText: '', items: [], status: 'draft' };
}

function hasContent(tr: SectionTranslation | undefined): tr is SectionTranslation {
  return !!tr && (
    tr.text.trim() !== '' || tr.subText.trim() !== ''
    || tr.items.some((it) => it.title.trim() !== '' || it.body.trim() !== '')
  );
}

/** 상태배지의 단일 소스 — none(번역 없음/빈 값) | draft(미검수) | reviewed(검수됨) */
export function translationStatus(
  section: ProductSection, locale: TranslationLocale,
): 'none' | 'draft' | 'reviewed' {
  const tr = section.i18n?.[locale];
  if (!hasContent(tr)) return 'none';
  return tr.status;
}

/**
 * 번역 내용 수정 — 항상 draft로 저장한다(검수는 markReviewed로만).
 * 검수됨 상태에서 내용을 고치면 자동으로 미검수로 돌아온다는 뜻이기도 하다.
 */
export function setTranslation(
  section: ProductSection, locale: TranslationLocale,
  patch: Partial<Omit<SectionTranslation, 'status'>>,
): ProductSection {
  const prev = section.i18n?.[locale] ?? emptyTranslation();
  return {
    ...section,
    i18n: { ...section.i18n, [locale]: { ...prev, ...patch, status: 'draft' } },
  };
}

/** 회원의 검수 확정 — 내용이 있는 번역만 reviewed가 될 수 있다 */
export function markReviewed(section: ProductSection, locale: TranslationLocale): ProductSection {
  const tr = section.i18n?.[locale];
  if (!hasContent(tr)) return section;
  return { ...section, i18n: { ...section.i18n, [locale]: { ...tr, status: 'reviewed' } } };
}

/**
 * 원문(ko 필드) 수정 시 호출 — 모든 번역을 draft로 강등한다.
 * 오래된 번역이 "검수됨"으로 남아 원문과 어긋난 채 노출되는 것을 막는 안전판.
 */
export function demoteTranslations(section: ProductSection): ProductSection {
  if (!section.i18n) return section;
  const demoted: typeof section.i18n = {};
  for (const [locale, tr] of Object.entries(section.i18n)) {
    demoted[locale as TranslationLocale] = { ...tr, status: 'draft' };
  }
  return { ...section, i18n: demoted };
}

// ── 표시 해석 — 렌더러(ProductDetailSections)가 쓰는 유일한 창구 ─────────────
// ProductSection과 PublishedDetailSection 양쪽에서 동작하도록 구조 타입만 요구한다.
export interface TranslatableSection {
  text:    string;
  subText: string;
  items:   ProductFeatureItem[];
  i18n?:   Partial<Record<TranslationLocale, SectionTranslation>>;
}

export interface ResolvedSectionText {
  text:    string;
  subText: string;
  items:   ProductFeatureItem[];
}

/**
 * 접속 언어의 표시 텍스트 — ko이거나 번역이 없으면 원문 그대로.
 * 필드 단위 폴백: 번역의 빈 필드는 원문으로 채우고, features 항목은 인덱스로
 * 대응시키되 번역 항목이 모자라거나 비어 있으면 해당 원문 항목을 쓴다.
 */
export function resolveSectionText(
  section: TranslatableSection, locale: Locale,
): ResolvedSectionText {
  const original: ResolvedSectionText = {
    text: section.text, subText: section.subText, items: section.items,
  };
  if (locale === 'ko') return original;
  const tr = section.i18n?.[locale];
  if (!hasContent(tr)) return original;

  return {
    text:    tr.text.trim()    ? tr.text    : original.text,
    subText: tr.subText.trim() ? tr.subText : original.subText,
    items: original.items.map((item, i) => {
      const trItem = tr.items[i];
      return {
        title: trItem?.title.trim() ? trItem.title : item.title,
        body:  trItem?.body.trim()  ? trItem.body  : item.body,
      };
    }),
  };
}

/** 게시용 정리 — 내용 없는 번역 항목을 뺀 i18n(없으면 undefined). published.ts가 쓴다 */
export function pruneSectionI18n(
  i18n: TranslatableSection['i18n'],
): TranslatableSection['i18n'] {
  if (!i18n) return undefined;
  const pruned: NonNullable<TranslatableSection['i18n']> = {};
  let count = 0;
  for (const [locale, tr] of Object.entries(i18n)) {
    if (hasContent(tr)) { pruned[locale as TranslationLocale] = tr; count++; }
  }
  return count > 0 ? pruned : undefined;
}
