// 회원별 상품 CRUD + 목록 집계(별점/리뷰수) — 서버 전용(db 싱글턴).
// 타입/규칙 로직은 lib/shop/types.ts가 단일 소스(여기서는 재export하지 않는다 —
// 클라이언트는 반드시 lib/shop/types.ts에서 import).
//
// 공개 조회(listPublicProducts)는 status='active'만 노출한다 — 구매자 화면이
// 편집 중(draft)/숨김(hidden) 상품을 볼 수 있는 경로를 만들지 말 것.

import { randomUUID } from 'crypto';
import db from '@/lib/db';
import type { ProductRow, ProductStatus, ProductReviewRow } from '@/lib/shop/types';

// 목록 집계 SQL 조각 — 리뷰수/평균별점을 한 방에 붙인다(N+1 금지)
const WITH_REVIEW_AGG = `
  SELECT p.*,
         COUNT(r.id)                          AS review_count,
         ROUND(AVG(r.rating), 1)              AS avg_rating
  FROM products p
  LEFT JOIN product_reviews r ON r.product_id = p.id
`;

export function createProduct(
  userId: string,
  fields: Partial<Pick<ProductRow, 'name' | 'description' | 'price' | 'original_price' | 'category' | 'detail_order_id'>> = {},
): ProductRow {
  const id  = randomUUID();
  const now = Date.now();
  db.prepare(`
    INSERT INTO products (id, user_id, name, description, price, original_price, category, status,
                          detail_order_id, sort_order, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?, 0, ?, ?)
  `).run(
    id, userId, fields.name ?? '', fields.description ?? '', fields.price ?? 0,
    fields.original_price ?? null, fields.category ?? '', fields.detail_order_id ?? null, now, now,
  );
  return getProduct(id)!;
}

export function getProduct(id: string): ProductRow | null {
  return db.prepare<[string], ProductRow>(
    `${WITH_REVIEW_AGG} WHERE p.id=? GROUP BY p.id`,
  ).get(id) ?? null;
}

/** 판매자 관리자용 — 전체 상태 포함 */
export function listProducts(userId: string): ProductRow[] {
  return db.prepare<[string], ProductRow>(
    `${WITH_REVIEW_AGG} WHERE p.user_id=? GROUP BY p.id ORDER BY p.sort_order ASC, p.created_at DESC`,
  ).all(userId);
}

/** 슈퍼에디터 콘텐츠(detail_order_id)에 연결된 상품 — 게시 버튼 노출용 역방향 조회 */
export function getProductByDetailOrder(detailOrderId: string, userId: string): ProductRow | null {
  return db.prepare<[string, string], ProductRow>(
    `${WITH_REVIEW_AGG} WHERE p.detail_order_id=? AND p.user_id=? GROUP BY p.id`,
  ).get(detailOrderId, userId) ?? null;
}

/** 구매자 공개용 — 판매중(active)만 */
export function listPublicProducts(userId: string): ProductRow[] {
  return db.prepare<[string], ProductRow>(
    `${WITH_REVIEW_AGG} WHERE p.user_id=? AND p.status='active' GROUP BY p.id ORDER BY p.sort_order ASC, p.created_at DESC`,
  ).all(userId);
}

const UPDATABLE = new Set([
  'name', 'description', 'price', 'original_price', 'category', 'status',
  'thumbnail_ref', 'thumbnail_path', 'detail_order_id', 'detail_image_path', 'sort_order',
]);

export function updateProduct(
  id: string, userId: string, patch: Partial<ProductRow>,
): ProductRow | null {
  const keys = Object.keys(patch).filter((k) => UPDATABLE.has(k));
  if (keys.length === 0) return getProduct(id);
  const sets = keys.map((k) => `${k}=@${k}`).join(', ');
  const params: Record<string, unknown> = { id, userId, updated_at: Date.now() };
  for (const k of keys) params[k] = patch[k as keyof ProductRow] ?? null;
  const res = db.prepare(
    `UPDATE products SET ${sets}, updated_at=@updated_at WHERE id=@id AND user_id=@userId`,
  ).run(params);
  return res.changes > 0 ? getProduct(id) : null;
}

export function deleteProduct(id: string, userId: string): boolean {
  const res = db.prepare('DELETE FROM products WHERE id=? AND user_id=?').run(id, userId);
  if (res.changes > 0) db.prepare('DELETE FROM product_reviews WHERE product_id=?').run(id);
  return res.changes > 0;
}

// ── 리뷰 (작성 UI는 후속 — 조회/삽입 API만 먼저) ─────────────────────────────
export function listReviews(productId: string): ProductReviewRow[] {
  return db.prepare<[string], ProductReviewRow>(
    'SELECT * FROM product_reviews WHERE product_id=? ORDER BY created_at DESC',
  ).all(productId);
}

export function addReview(
  productId: string, userId: string, rating: number, body: string, authorName: string,
): ProductReviewRow {
  const id = randomUUID();
  const clamped = Math.max(1, Math.min(5, Math.round(rating)));
  db.prepare(`
    INSERT INTO product_reviews (id, product_id, user_id, rating, body, author_name, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, productId, userId, clamped, body, authorName, Date.now());
  return db.prepare<[string], ProductReviewRow>('SELECT * FROM product_reviews WHERE id=?').get(id)!;
}

export type { ProductStatus };
