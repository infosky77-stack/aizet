// 쇼핑몰 주문 영속 계층 — 서버 전용(db 싱글턴). 기존 lib/db/orders.ts(식당 데모,
// in-memory)와 완전 별개다. 상태 전이 규칙은 lib/shop/types.ts의
// SHOP_ORDER_TRANSITIONS가 단일 소스 — 여기(서버 검증)와 관리자 UI가 같은 표를 읽는다.
//
// 주문 항목의 name/price는 생성 시점 스냅샷으로 저장한다 — 상품이 이후 수정/삭제돼도
// 주문 내역이 변하지 않는다. total은 클라이언트 값을 믿지 않고 서버에서 재계산한다.

import { randomUUID } from 'crypto';
import db from '@/lib/db';
import {
  canTransitionOrder,
  type ShopOrderRow, type ShopOrderItemRow, type ShopOrderStatus,
} from '@/lib/shop/types';

export interface ShopOrderItemInput {
  productId: string | null;
  name:      string;
  price:     number;
  qty:       number;
}

export interface ShopOrderBuyerInput {
  name:    string;
  phone:   string;
  address: string;
  request?: string;
}

export function createShopOrder(
  sellerId: string, buyer: ShopOrderBuyerInput, items: ShopOrderItemInput[],
): ShopOrderRow {
  if (items.length === 0) throw new Error('주문 항목이 없습니다');
  const id  = randomUUID();
  const now = Date.now();
  const total = items.reduce((sum, it) => sum + it.price * it.qty, 0);

  const insertOrder = db.prepare(`
    INSERT INTO shop_orders (id, user_id, buyer_name, buyer_phone, buyer_address, request, total, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'placed', ?, ?)
  `);
  const insertItem = db.prepare(`
    INSERT INTO shop_order_items (id, order_id, product_id, name, price, qty, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  db.transaction(() => {
    insertOrder.run(id, sellerId, buyer.name, buyer.phone, buyer.address, buyer.request ?? '', total, now, now);
    for (const it of items) {
      insertItem.run(randomUUID(), id, it.productId, it.name, it.price, Math.max(1, it.qty), now);
    }
  })();
  return getShopOrder(id)!;
}

export function getShopOrder(id: string): ShopOrderRow | null {
  const order = db.prepare<[string], ShopOrderRow>('SELECT * FROM shop_orders WHERE id=?').get(id);
  if (!order) return null;
  order.items = db.prepare<[string], ShopOrderItemRow>(
    'SELECT * FROM shop_order_items WHERE order_id=? ORDER BY created_at ASC',
  ).all(id);
  return order;
}

export function listShopOrders(sellerId: string, status?: ShopOrderStatus): ShopOrderRow[] {
  const orders = status
    ? db.prepare<[string, string], ShopOrderRow>(
        'SELECT * FROM shop_orders WHERE user_id=? AND status=? ORDER BY created_at DESC',
      ).all(sellerId, status)
    : db.prepare<[string], ShopOrderRow>(
        'SELECT * FROM shop_orders WHERE user_id=? ORDER BY created_at DESC',
      ).all(sellerId);
  // 관리자 목록은 규모가 작아(회원당 주문) 항목을 한 번에 붙인다
  const itemsStmt = db.prepare<[string], ShopOrderItemRow>(
    'SELECT * FROM shop_order_items WHERE order_id=? ORDER BY created_at ASC',
  );
  for (const o of orders) o.items = itemsStmt.all(o.id);
  return orders;
}

/** 허용되지 않은 전이는 null — 호출부(API)가 400으로 변환 */
export function updateShopOrderStatus(
  id: string, sellerId: string, to: ShopOrderStatus,
): ShopOrderRow | null {
  const order = db.prepare<[string, string], ShopOrderRow>(
    'SELECT * FROM shop_orders WHERE id=? AND user_id=?',
  ).get(id, sellerId);
  if (!order || !canTransitionOrder(order.status, to)) return null;
  db.prepare('UPDATE shop_orders SET status=?, updated_at=? WHERE id=?').run(to, Date.now(), id);
  return getShopOrder(id);
}

// ── 정산 개요 집계 ───────────────────────────────────────────────────────────
export interface ShopSalesSummary {
  /** 취소 제외 매출 합계 */
  totalSales:  number;
  orderCount:  number;
  bestProducts: { name: string; qty: number; sales: number }[];
}

export function summarizeShopSales(sellerId: string, sinceMs: number): ShopSalesSummary {
  const head = db.prepare<[string, number], { totalSales: number | null; orderCount: number }>(`
    SELECT COALESCE(SUM(total), 0) AS totalSales, COUNT(*) AS orderCount
    FROM shop_orders WHERE user_id=? AND status != 'cancelled' AND created_at >= ?
  `).get(sellerId, sinceMs)!;
  const bestProducts = db.prepare<[string, number], { name: string; qty: number; sales: number }>(`
    SELECT i.name AS name, SUM(i.qty) AS qty, SUM(i.price * i.qty) AS sales
    FROM shop_order_items i
    JOIN shop_orders o ON o.id = i.order_id
    WHERE o.user_id=? AND o.status != 'cancelled' AND o.created_at >= ?
    GROUP BY i.name ORDER BY sales DESC LIMIT 5
  `).all(sellerId, sinceMs);
  return { totalSales: head.totalSales ?? 0, orderCount: head.orderCount, bestProducts };
}
