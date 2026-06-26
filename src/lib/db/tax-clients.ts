import { randomUUID } from 'crypto';
import db from '@/lib/db';

export interface TaxClient {
  id: string;
  user_id: string;
  name: string;
  biz_number: string;
  contact: string;
  phone: string;
  email: string;
  memo: string;
  created_at: number;
  updated_at: number;
}

export type TaxClientInput = Pick<TaxClient, 'name' | 'biz_number' | 'contact' | 'phone' | 'email' | 'memo'>;

export function listClients(userId: string): TaxClient[] {
  return db
    .prepare<[string], TaxClient>('SELECT * FROM tax_clients WHERE user_id = ? ORDER BY created_at DESC')
    .all(userId);
}

export function getClient(id: string, userId: string): TaxClient | null {
  return (
    db.prepare<[string, string], TaxClient>('SELECT * FROM tax_clients WHERE id = ? AND user_id = ?').get(id, userId) ?? null
  );
}

export function createClient(userId: string, input: TaxClientInput): TaxClient {
  const now = Date.now();
  const id = randomUUID();
  db.prepare(`
    INSERT INTO tax_clients (id, user_id, name, biz_number, contact, phone, email, memo, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId, input.name, input.biz_number, input.contact, input.phone, input.email, input.memo, now, now);
  return getClient(id, userId)!;
}

export function updateClient(id: string, userId: string, input: Partial<TaxClientInput>): TaxClient | null {
  const existing = getClient(id, userId);
  if (!existing) return null;
  const now = Date.now();
  const merged = { ...existing, ...input, updated_at: now };
  db.prepare(`
    UPDATE tax_clients
    SET name=?, biz_number=?, contact=?, phone=?, email=?, memo=?, updated_at=?
    WHERE id=? AND user_id=?
  `).run(merged.name, merged.biz_number, merged.contact, merged.phone, merged.email, merged.memo, now, id, userId);
  return getClient(id, userId)!;
}

export function deleteClient(id: string, userId: string): boolean {
  const result = db.prepare('DELETE FROM tax_clients WHERE id=? AND user_id=?').run(id, userId);
  return result.changes > 0;
}
