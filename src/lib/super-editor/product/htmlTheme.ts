// 칸칸 HTML 상세페이지의 디자인 토큰 매핑 — templates.ts 토큰을 CSS 변수로 변환하는
// 순수 계산 (React/DOM 모름 → Node 단독 테스트 가능).
//
// 원칙: 색·크기·여백의 원천은 전부 ProductTemplate 하나다 — JPEG(buildProductDetailImage)와
// HTML(ProductDetailSections)이 같은 템플릿을 읽으므로 두 산출물의 인상이 일치한다.
// 템플릿에 값을 추가/변경하면 두 산출물이 함께 바뀐다(여기서 값을 지어내지 말 것).
//
// 반응형 규칙: 템플릿 px값은 "폭 860px(widthPx) 기준 완성 크기"다. HTML에서는
// clamp(하한, 화면폭 비례, 원래값)로 변환해 좁은 화면에서 비례 축소되다가
// widthPx 이상에서 원래 값에 도달한다 — 자동 높이·유연 레이아웃의 기반.

import type { ProductTemplate } from './templates';

/** 글자 크기 하한 비율 — 이보다 작아지면 모바일 가독성이 무너진다 */
const FONT_MIN_RATIO = 0.68;
/** 여백 하한 비율 — 좁은 화면에서 여백은 글자보다 더 공격적으로 줄여도 된다 */
const SPACE_MIN_RATIO = 0.5;

/** widthPx 기준 px값 → clamp(하한, vw 비례, 원래값) 문자열 */
export function responsiveSize(px: number, widthPx: number, minRatio: number): string {
  const min = Math.round(px * minRatio);
  const vw  = ((px / widthPx) * 100).toFixed(2);
  return `clamp(${min}px, ${vw}vw, ${px}px)`;
}

/**
 * 템플릿 → CSS 변수 묶음. 렌더러는 이 변수 이름(--pd-*)만 알고 템플릿 구조를 모른다.
 * 본문 행간은 JPEG와 같은 공식((글자크기+lineGap)/글자크기)에서 나온다 — 인상 일치.
 */
export function detailThemeVars(t: ProductTemplate): Record<string, string> {
  const fs = (px: number) => responsiveSize(px, t.widthPx, FONT_MIN_RATIO);
  const sp = (px: number) => responsiveSize(px, t.widthPx, SPACE_MIN_RATIO);
  return {
    '--pd-bg':      t.colors.background,
    '--pd-surface': t.colors.surface,
    '--pd-accent':  t.colors.accent,
    '--pd-text':    t.colors.textPrimary,
    '--pd-text-2':  t.colors.textSecondary,
    '--pd-divider': t.colors.divider,

    '--pd-fs-headline':      fs(t.fontSizePx.headline),
    '--pd-fs-subheadline':   fs(t.fontSizePx.subHeadline),
    '--pd-fs-body':          fs(t.fontSizePx.body),
    '--pd-fs-caption':       fs(t.fontSizePx.caption),
    '--pd-fs-feature-title': fs(t.fontSizePx.featureTitle),
    '--pd-fs-feature-body':  fs(t.fontSizePx.featureBody),
    '--pd-lh-body': ((t.fontSizePx.body + t.spacingPx.lineGap) / t.fontSizePx.body).toFixed(2),

    '--pd-pad-x': sp(t.spacingPx.pagePadX),
    '--pd-pad-y': sp(t.spacingPx.pagePadY),
    '--pd-gap':   sp(t.spacingPx.sectionGap),
    '--pd-max-w': `${t.widthPx}px`,
  };
}
