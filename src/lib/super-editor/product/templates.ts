// 제품 상세페이지 템플릿 프리셋 — 데이터만 (로직 없음).
//
// 템플릿은 "폭·색·타이포·여백 토큰"의 묶음이고, 배치 계산은 전부 layout.ts가 한다.
// 새 템플릿은 여기 항목 하나만 늘리면 되고, 레이아웃/렌더 코드는 손대지 않는다.
// 폭 860px은 쿠팡/네이버 상세 이미지 권장 폭(760~860) 기준.

export interface ProductTemplate {
  id:   string;
  name: string;
  /** 산출물 이미지 폭(px) — 세로 길이는 콘텐츠에 따라 layout.ts가 계산 */
  widthPx: number;
  colors: {
    background:    string;
    /** features 카드 등 면 채움 */
    surface:       string;
    accent:        string;
    textPrimary:   string;
    textSecondary: string;
    divider:       string;
  };
  /** 섹션별 글자 크기(px) */
  fontSizePx: {
    headline:     number;
    subHeadline:  number;
    body:         number;
    caption:      number;
    featureTitle: number;
    featureBody:  number;
  };
  /** 여백 토큰(px) */
  spacingPx: {
    pagePadX:   number;
    pagePadY:   number;
    sectionGap: number;
    lineGap:    number; // 본문 줄간(글자 크기에 더해지는 값)
  };
}

export const PRODUCT_TEMPLATES: Record<string, ProductTemplate> = {
  clean: {
    id: 'clean',
    name: '클린 (흰 바탕)',
    widthPx: 860,
    colors: {
      background:    '#ffffff',
      surface:       '#f7f5f2',
      accent:        '#d97706', // amber-600 — 사이트 포인트 색과 동일 계열
      textPrimary:   '#292524',
      textSecondary: '#78716c',
      divider:       '#e7e5e4',
    },
    fontSizePx: {
      headline: 44, subHeadline: 22, body: 24, caption: 18,
      featureTitle: 26, featureBody: 22,
    },
    spacingPx: { pagePadX: 56, pagePadY: 72, sectionGap: 72, lineGap: 14 },
  },
  soft: {
    id: 'soft',
    name: '소프트 (아이보리 바탕)',
    widthPx: 860,
    colors: {
      background:    '#faf8f5',
      surface:       '#ffffff',
      accent:        '#0f766e', // teal-700
      textPrimary:   '#1c1917',
      textSecondary: '#57534e',
      divider:       '#e7e5e4',
    },
    fontSizePx: {
      headline: 44, subHeadline: 22, body: 24, caption: 18,
      featureTitle: 26, featureBody: 22,
    },
    spacingPx: { pagePadX: 56, pagePadY: 72, sectionGap: 72, lineGap: 14 },
  },
};

export const DEFAULT_PRODUCT_TEMPLATE_ID = 'clean';

/** 모르는/누락된 id는 기본 템플릿으로 폴백 — 스냅샷이 옛 템플릿 id를 물고 있어도 안전 */
export function getProductTemplate(id: string | null | undefined): ProductTemplate {
  if (id && id in PRODUCT_TEMPLATES) return PRODUCT_TEMPLATES[id];
  return PRODUCT_TEMPLATES[DEFAULT_PRODUCT_TEMPLATE_ID];
}
