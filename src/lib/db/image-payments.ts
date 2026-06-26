import { randomUUID } from 'crypto';
import db from '@/lib/db';

export type ImagePaymentStatus = 'pending' | 'paid' | 'completed' | 'failed';

export interface ImagePayment {
  id:         string;
  user_id:    string;
  amount:     number;
  item_type:  string;
  toss_key:   string | null;
  status:     ImagePaymentStatus;
  created_at: number;
  paid_at:    number | null;
}

export function createImagePayment(
  userId: string,
  amount: number,
  itemType: string = 'image_generation',
): ImagePayment {
  const id  = randomUUID();
  const now = Date.now();
  db.prepare(`
    INSERT INTO image_payments (id, user_id, amount, item_type, status, created_at)
    VALUES (?, ?, ?, ?, 'pending', ?)
  `).run(id, userId, amount, itemType, now);
  return getImagePayment(id)!;
}

export function getImagePayment(id: string): ImagePayment | null {
  return db
    .prepare<[string], ImagePayment>('SELECT * FROM image_payments WHERE id=?')
    .get(id) ?? null;
}

export function confirmImagePayment(id: string, tossKey: string): ImagePayment | null {
  const now = Date.now();
  db.prepare(`
    UPDATE image_payments SET status='paid', toss_key=?, paid_at=? WHERE id=? AND status='pending'
  `).run(tossKey, now, id);
  return getImagePayment(id);
}

export function failImagePayment(id: string): void {
  db.prepare(`UPDATE image_payments SET status='failed' WHERE id=? AND status='pending'`).run(id);
}

export function completeImagePayment(id: string): void {
  db.prepare(`UPDATE image_payments SET status='completed' WHERE id=? AND status='paid'`).run(id);
}

/** 결제 완료(paid)됐지만 아직 completed 처리 안 된 최신 레코드 반환 */
export function getActivePaidPayment(userId: string, itemType: string = 'image_generation'): ImagePayment | null {
  return db
    .prepare<[string, string], ImagePayment>(
      `SELECT * FROM image_payments WHERE user_id=? AND item_type=? AND status='paid' ORDER BY paid_at DESC LIMIT 1`
    )
    .get(userId, itemType) ?? null;
}
