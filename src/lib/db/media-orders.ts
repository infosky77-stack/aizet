import { randomUUID } from 'crypto';
import db from '@/lib/db';

export type MediaOrderType   = 'video' | 'print' | 'catalog' | 'magazine' | 'product' | 'education';
export type MediaOrderStatus = 'editing' | 'queued' | 'processing' | 'done' | 'failed';

export interface MediaOrder {
  id:          string;
  user_id:     string;
  order_type:  MediaOrderType;
  title:       string;
  snapshot:    string;
  is_paid:     number;
  payment_id:  string | null;
  status:      MediaOrderStatus;
  output_uuid: string | null;
  folder_id:   string | null;
  created_at:  number;
  updated_at:  number;
}

export function createMediaOrder(
  userId: string,
  orderType: MediaOrderType,
  title: string,
  folderId?: string | null,
): MediaOrder {
  const id  = randomUUID();
  const now = Date.now();
  db.prepare(`
    INSERT INTO media_orders (id, user_id, order_type, title, snapshot, is_paid, status, folder_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, '{}', 0, 'editing', ?, ?, ?)
  `).run(id, userId, orderType, title, folderId ?? null, now, now);
  return getMediaOrder(id)!;
}

export function getMediaOrder(id: string): MediaOrder | null {
  return db.prepare<[string], MediaOrder>('SELECT * FROM media_orders WHERE id=?').get(id) ?? null;
}

export function listMediaOrders(userId: string): MediaOrder[] {
  return db.prepare<[string], MediaOrder>(
    'SELECT * FROM media_orders WHERE user_id=? ORDER BY updated_at DESC'
  ).all(userId) as MediaOrder[];
}

export function updateSnapshot(id: string, snapshot: Record<string, unknown>, title?: string): void {
  const now = Date.now();
  if (title !== undefined) {
    db.prepare('UPDATE media_orders SET snapshot=?, title=?, updated_at=? WHERE id=?')
      .run(JSON.stringify(snapshot), title, now, id);
  } else {
    db.prepare('UPDATE media_orders SET snapshot=?, updated_at=? WHERE id=?')
      .run(JSON.stringify(snapshot), now, id);
  }
}

export function markPaid(id: string, paymentId: string): void {
  const now = Date.now();
  db.prepare('UPDATE media_orders SET is_paid=1, payment_id=?, status=\'queued\', updated_at=? WHERE id=?')
    .run(paymentId, now, id);
}

export function updateStatus(id: string, status: MediaOrderStatus): void {
  db.prepare('UPDATE media_orders SET status=?, updated_at=? WHERE id=?')
    .run(status, Date.now(), id);
}

export function deleteMediaOrder(id: string, userId: string): void {
  db.prepare('DELETE FROM media_orders WHERE id=? AND user_id=? AND is_paid=0').run(id, userId);
}
