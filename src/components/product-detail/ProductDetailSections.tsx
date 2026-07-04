// 칸칸 HTML 상세페이지 렌더러 — 게시 스냅샷(PublishedProductDetail) → 시맨틱 HTML.
// 훅이 없어 서버 컴포넌트(구매자 뷰)와 클라이언트(에디터 미리보기)가 같은 본체를 쓴다.
//
// 디자인 토큰은 전부 templates.ts → htmlTheme.ts의 CSS 변수(--pd-*) 경유 — JPEG 산출물과
// 같은 템플릿 데이터를 읽으므로 두 산출물의 인상이 일치한다. 색·크기를 여기서 지어내지 말 것.
// 레이아웃은 자동 높이 + max-width 컨테이너: 텍스트 길이(언어)가 달라도 깨지지 않는다.
// 텍스트는 브라우저가 그리는 벡터라 확대해도 선명하다(통이미지 대비 본질적 장점).

import type { CSSProperties } from 'react';
import { getProductTemplate } from '@/lib/super-editor/product/templates';
import { detailThemeVars } from '@/lib/super-editor/product/htmlTheme';
import { resolveSectionText, type ResolvedSectionText } from '@/lib/super-editor/product/i18n';
import { LOCALE_FONT_STACKS } from '@/lib/i18n/fontStacks';
import type { Locale } from '@/lib/i18n/types';
import type {
  PublishedProductDetail, PublishedDetailSection,
} from '@/lib/super-editor/product/published';

interface Props {
  detail: PublishedProductDetail;
  /** 접속 언어 — 텍스트 칸을 번역본으로 표시(없는 번역은 필드 단위로 원문 폴백) */
  locale?: Locale;
}

export function ProductDetailSections({ detail, locale = 'ko' }: Props) {
  const template = getProductTemplate(detail.templateId);
  const vars = detailThemeVars(template) as CSSProperties;

  return (
    // fontFamily: 접속 언어의 웹폰트 스택 — 시스템 폰트에 맡기지 않는다(fontStacks.ts)
    <div
      style={{ ...vars, background: 'var(--pd-bg)', fontFamily: LOCALE_FONT_STACKS[locale] }}
      className="w-full"
      lang={locale}
    >
      <div
        className="mx-auto w-full max-w-[var(--pd-max-w)] flex flex-col"
        style={{ padding: 'var(--pd-pad-y) var(--pd-pad-x)', gap: 'var(--pd-gap)' }}
      >
        {detail.sections.map((sec) => <Section key={sec.id} sec={sec} locale={locale} />)}
      </div>
    </div>
  );
}

// 언어 해석은 여기서 한 번만 — 각 섹션 컴포넌트는 해석된 텍스트(t)만 받는다
function Section({ sec, locale }: { sec: PublishedDetailSection; locale: Locale }) {
  const t = resolveSectionText(sec, locale);
  if (sec.kind === 'headline') return <HeadlineSection t={t} />;
  if (sec.kind === 'image')    return <ImageSection sec={sec} t={t} />;
  if (sec.kind === 'features') return <FeaturesSection t={t} />;
  return <TextSection t={t} />;
}

// ── headline: 캐치프레이즈(악센트) → 대제목 → 악센트 바 ──────────────────────
function HeadlineSection({ t }: { t: ResolvedSectionText }) {
  return (
    <header className="flex flex-col items-center gap-3 text-center">
      {t.subText && (
        <p
          className="font-semibold tracking-wide break-keep"
          style={{ color: 'var(--pd-accent)', fontSize: 'var(--pd-fs-subheadline)' }}
        >
          {t.subText}
        </p>
      )}
      <h2
        className="font-black leading-tight break-keep"
        style={{ color: 'var(--pd-text)', fontSize: 'var(--pd-fs-headline)' }}
      >
        {t.text}
      </h2>
      <div aria-hidden className="h-1 w-10 rounded-full" style={{ background: 'var(--pd-accent)' }} />
    </header>
  );
}

// ── image: 전폭 이미지 + 캡션. 게시 시점 크기 고정이 아니라 자동 높이 ────────
function ImageSection({ sec, t }: { sec: PublishedDetailSection; t: ResolvedSectionText }) {
  if (!sec.src) return null; // 게시 변환(toPublishedDetail)이 걸러내므로 방어선일 뿐
  return (
    <figure className="flex flex-col gap-3">
      {/* 공개 사본/blob URL — next/image 최적화 대상 아님(외부 업로드본과 동일 원본 유지) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={sec.src} alt={t.text || ''} className="w-full h-auto rounded-2xl" />
      {t.text && (
        <figcaption
          className="text-center break-keep"
          style={{ color: 'var(--pd-text-2)', fontSize: 'var(--pd-fs-caption)' }}
        >
          {t.text}
        </figcaption>
      )}
    </figure>
  );
}

// ── text: 빈 줄로 문단 구분(types.ts 계약), 줄바꿈 보존 ──────────────────────
function TextSection({ t }: { t: ResolvedSectionText }) {
  return (
    <div className="flex flex-col gap-4">
      {t.text.split(/\n\s*\n/).map((para, i) => (
        <p
          key={i}
          className="whitespace-pre-line break-keep"
          style={{
            color: 'var(--pd-text)',
            fontSize: 'var(--pd-fs-body)',
            lineHeight: 'var(--pd-lh-body)',
          }}
        >
          {para}
        </p>
      ))}
    </div>
  );
}

// ── features: 카드 그리드(모바일 1열 → 2열), 번호 배지로 위계 표시 ───────────
function FeaturesSection({ t }: { t: ResolvedSectionText }) {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 list-none p-0 m-0">
      {t.items.map((item, i) => (
        <li
          key={i}
          className="rounded-2xl p-5 sm:p-6 flex flex-col gap-2"
          style={{ background: 'var(--pd-surface)', border: '1px solid var(--pd-divider)' }}
        >
          <div className="flex items-center gap-2.5">
            <span
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: 'var(--pd-accent)' }}
            >
              {i + 1}
            </span>
            <h3
              className="font-bold break-keep"
              style={{ color: 'var(--pd-text)', fontSize: 'var(--pd-fs-feature-title)' }}
            >
              {item.title}
            </h3>
          </div>
          <p
            className="break-keep"
            style={{ color: 'var(--pd-text-2)', fontSize: 'var(--pd-fs-feature-body)', lineHeight: 1.6 }}
          >
            {item.body}
          </p>
        </li>
      ))}
    </ul>
  );
}
