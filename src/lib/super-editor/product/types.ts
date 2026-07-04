// 제품 상세페이지 — 도메인 타입 단일 소스 (로직 없음, 서버 모듈 import 없음).
//
// 편집 모델은 "섹션(section)의 순서 있는 목록"이다 — 영상의 scenes와 같은 역할의
// 구조화 스키마. 쿠팡/네이버식 세로형 상세페이지의 헤드라인/제품이미지/설명/특징 구성을
// 고정 필드가 아니라 섹션 순서로 표현하므로, 회원은 추가/삭제/순서변경만 하면 된다.
// 여기에 자유 텍스트 형식을 되살리지 말 것(레이아웃 엔진의 입력이 된다).

export type ProductSectionKind = 'headline' | 'image' | 'text' | 'features';

export interface ProductFeatureItem {
  title: string;
  body:  string;
}

// VideoScene 관례를 따르는 flat 모델 — kind별로 안 쓰는 필드는 빈 값으로 둔다.
export interface ProductSection {
  id:   string;
  kind: ProductSectionKind;
  /** image: 원장 FileEntry.id 포인터(잡지 ledger_ref 관례와 동일). 원본 바이트는 서버에 안 실림 */
  ledgerRef: string | null;
  /** headline: 제품명 / text: 본문(빈 줄로 문단 구분) / image: 캡션 */
  text: string;
  /** headline: 캐치프레이즈 (그 외 kind에선 '') */
  subText: string;
  /** features: 특징 카드 목록 (그 외 kind에선 []) */
  items: ProductFeatureItem[];
}

export interface ProductDetailSnapshot {
  /** 스냅샷 형식 구분자 */
  version: 1;
  title:   string;
  /** templates.ts 프리셋 id — 모르는 값은 렌더 시 기본 템플릿으로 폴백 */
  templateId: string;
  sections: ProductSection[];
}

export function isProductDetailSnapshot(raw: unknown): raw is ProductDetailSnapshot {
  return typeof raw === 'object' && raw !== null
    && (raw as { version?: unknown }).version === 1
    && Array.isArray((raw as { sections?: unknown }).sections);
}

export function newProductSection(
  kind: ProductSectionKind, over: Partial<ProductSection> = {},
): ProductSection {
  return {
    id: `sec-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    kind,
    ledgerRef: null,
    text: '',
    subText: '',
    items: kind === 'features' ? [{ title: '', body: '' }] : [],
    ...over,
  };
}

/**
 * 새 콘텐츠의 기본 골격 — 헤드라인→대표이미지→설명→특징→추가이미지.
 * 고정 스키마가 아니라 출발점일 뿐이다(회원이 자유롭게 추가/삭제/재배열).
 */
export function emptyProductDetail(title: string): ProductDetailSnapshot {
  return {
    version: 1,
    title,
    templateId: 'clean',
    sections: [
      newProductSection('headline', { text: title }),
      newProductSection('image'),
      newProductSection('text'),
      newProductSection('features'),
      newProductSection('image'),
    ],
  };
}
