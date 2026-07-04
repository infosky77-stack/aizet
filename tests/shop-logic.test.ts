// 쇼핑몰 순수 로직 테스트 — lib/shop/types.ts (상태 전이/할인율/평점, 서버 무관)
import {
  canTransitionOrder, nextOrderStatuses, discountRate, averageRating, formatPrice,
  SHOP_ORDER_TRANSITIONS, PRODUCT_STATUS_LABELS,
  type ShopOrderStatus,
} from '../src/lib/shop/types';

const checks: [string, boolean][] = [];

// ── 주문 상태 전이 ─────────────────────────────────────────────────────────
checks.push(['placed → paid 허용', canTransitionOrder('placed', 'paid')]);
checks.push(['placed → cancelled 허용', canTransitionOrder('placed', 'cancelled')]);
checks.push(['placed → shipping 불가(결제확인 건너뛰기 금지)', !canTransitionOrder('placed', 'shipping')]);
checks.push(['paid → shipping 허용', canTransitionOrder('paid', 'shipping')]);
checks.push(['shipping → cancelled 불가(배송 시작 후 취소 불가)', !canTransitionOrder('shipping', 'cancelled')]);
checks.push(['delivered는 종착(전이 없음)', nextOrderStatuses('delivered').length === 0]);
checks.push(['cancelled는 종착(전이 없음)', nextOrderStatuses('cancelled').length === 0]);
checks.push(['같은 상태로의 전이는 불가', (Object.keys(SHOP_ORDER_TRANSITIONS) as ShopOrderStatus[])
  .every((s) => !canTransitionOrder(s, s))]);

// ── 할인율 ────────────────────────────────────────────────────────────────
checks.push(['12,900/원가 19,900 → 35%', discountRate(12900, 19900) === 35]);
checks.push(['원가 미지정 → null(배지 없음)', discountRate(10000, null) === null]);
checks.push(['원가 = 판매가 → null', discountRate(10000, 10000) === null]);
checks.push(['원가 < 판매가(역전) → null', discountRate(10000, 9000) === null]);
checks.push(['원가 0 → null', discountRate(10000, 0) === null]);

// ── 평점/가격 표시 ────────────────────────────────────────────────────────
checks.push(['평균 별점 소수 1자리(4,5,5 → 4.7)', averageRating([4, 5, 5]) === 4.7]);
checks.push(['리뷰 없음 → null(별점 미표시)', averageRating([]) === null]);
checks.push(['가격 천 단위 구분(1234567 → 1,234,567원)', formatPrice(1234567) === '1,234,567원']);

// ── 라벨 무결성 ───────────────────────────────────────────────────────────
checks.push(['상품 상태 라벨 3종', Object.keys(PRODUCT_STATUS_LABELS).length === 3]);
checks.push(['주문 상태 5종 전부 전이표에 존재', Object.keys(SHOP_ORDER_TRANSITIONS).length === 5]);

let failed = 0;
for (const [name, ok] of checks) { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}`); }
console.log(`\n${checks.length - failed}/${checks.length} passed`);
process.exit(failed === 0 ? 0 : 1);
