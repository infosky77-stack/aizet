// 쇼핑몰 도메인 타입·순수 로직 단일 소스 (서버 모듈 import 없음 — 클라이언트 번들 안전).
//
// lib/db/products.ts 등 서버 모듈과 값이 겹치지만 의도적으로 별도 선언한다 —
// lib/db/*는 서버 전용 db 싱글턴을 물고 있어 클라이언트에 딸려 들어가면 안 되기 때문
// (folder-domains.ts와 같은 관례). 상태 전이·할인율 같은 규칙 로직은 전부 여기 두고
// 서버(API 검증)와 클라이언트(버튼 노출)가 같은 함수를 쓴다.

export type ProductStatus = 'draft' | 'active' | 'hidden';

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  draft:  '작성 중',
  active: '판매중',
  hidden: '숨김',
};

// ── 주문 상태 — 쿠팡식 흐름, v1은 판매자 수동 전환(PG 연동 후속) ─────────────
export type ShopOrderStatus = 'placed' | 'paid' | 'shipping' | 'delivered' | 'cancelled';

export const SHOP_ORDER_STATUS_LABELS: Record<ShopOrderStatus, string> = {
  placed:    '주문접수',
  paid:      '결제확인',
  shipping:  '배송중',
  delivered: '배송완료',
  cancelled: '취소',
};

/** 허용 상태 전이의 단일 소스 — 서버 검증과 관리자 버튼 노출이 같은 표를 읽는다 */
export const SHOP_ORDER_TRANSITIONS: Record<ShopOrderStatus, ShopOrderStatus[]> = {
  placed:    ['paid', 'cancelled'],
  paid:      ['shipping', 'cancelled'],
  shipping:  ['delivered'],
  delivered: [],
  cancelled: [],
};

export function canTransitionOrder(from: ShopOrderStatus, to: ShopOrderStatus): boolean {
  return SHOP_ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}

export function nextOrderStatuses(from: ShopOrderStatus): ShopOrderStatus[] {
  return SHOP_ORDER_TRANSITIONS[from] ?? [];
}

// ── 가격/평점 표시 규칙 ────────────────────────────────────────────────────
/** 할인율(%). 원가가 판매가보다 클 때만 — 그 외(미지정·역전·0원)는 null(배지 미표시) */
export function discountRate(price: number, originalPrice: number | null | undefined): number | null {
  if (!originalPrice || originalPrice <= price || originalPrice <= 0) return null;
  return Math.round((1 - price / originalPrice) * 100);
}

export function formatPrice(price: number): string {
  return `${price.toLocaleString('ko-KR')}원`;
}

/** 평균 별점 — 소수 1자리, 리뷰 없으면 null(별점 영역 미표시) */
export function averageRating(ratings: number[]): number | null {
  if (ratings.length === 0) return null;
  return Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10;
}

// ── 클라이언트가 다루는 행 형태 (API 응답 그대로) ───────────────────────────
export interface ProductRow {
  id:                string;
  user_id:           string;
  name:              string;
  price:             number;
  original_price:    number | null;
  category:          string;
  status:            ProductStatus;
  thumbnail_path:    string | null;
  detail_order_id:   string | null;
  detail_image_path: string | null;
  sort_order:        number;
  created_at:        number;
  updated_at:        number;
  /** 목록 조회 시 집계로 붙는 필드(별점/리뷰수) */
  review_count?: number;
  avg_rating?:   number | null;
}

export interface ShopOrderItemRow {
  id:         string;
  order_id:   string;
  product_id: string | null;
  name:       string;
  price:      number;
  qty:        number;
  created_at: number;
}

export interface ShopOrderRow {
  id:            string;
  user_id:       string;
  buyer_name:    string;
  buyer_phone:   string;
  buyer_address: string;
  request:       string;
  total:         number;
  status:        ShopOrderStatus;
  created_at:    number;
  updated_at:    number;
  items?: ShopOrderItemRow[];
}

export interface ProductReviewRow {
  id:          string;
  product_id:  string;
  user_id:     string;
  rating:      number;
  body:        string;
  author_name: string;
  created_at:  number;
}
