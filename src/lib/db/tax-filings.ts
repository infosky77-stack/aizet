import { randomUUID } from 'crypto';
import db from '@/lib/db';

export type FilingType   = 'vat' | 'income' | 'corp' | 'withholding';
export type FilingStatus = 'pending' | 'in_progress' | 'done';

export interface TaxFiling {
  id:          string;
  client_id:   string;
  client_name: string;
  user_id:     string;
  type:        FilingType;
  year:        number;
  month:       number;
  due_date:    string;   // YYYY-MM-DD
  status:      FilingStatus;
  filed_at:    number | null;
  memo:        string;
  created_at:  number;
  updated_at:  number;
}

export interface FilingInput {
  client_id: string;
  type:      FilingType;
  year:      number;
  month:     number;
  due_date:  string;
  memo:      string;
}

const SELECT = `
  SELECT f.*, c.name as client_name
  FROM tax_filings f
  JOIN tax_clients c ON f.client_id = c.id
`;

export function listFilings(userId: string, year?: number, month?: number): TaxFiling[] {
  if (year !== undefined && month !== undefined) {
    return db
      .prepare<[string, number, number], TaxFiling>(
        `${SELECT} WHERE f.user_id = ? AND f.year = ? AND f.month = ? ORDER BY f.due_date ASC, f.created_at ASC`
      )
      .all(userId, year, month);
  }
  return db
    .prepare<[string], TaxFiling>(`${SELECT} WHERE f.user_id = ? ORDER BY f.due_date ASC, f.created_at ASC`)
    .all(userId);
}

export function getFiling(id: string, userId: string): TaxFiling | null {
  return (
    db.prepare<[string, string], TaxFiling>(
      `${SELECT} WHERE f.id = ? AND f.user_id = ?`
    ).get(id, userId) ?? null
  );
}

export function createFiling(userId: string, input: FilingInput): TaxFiling {
  const now = Date.now();
  const id  = randomUUID();
  db.prepare(`
    INSERT INTO tax_filings
      (id, client_id, user_id, type, year, month, due_date, status, filed_at, memo, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NULL, ?, ?, ?)
  `).run(id, input.client_id, userId, input.type, input.year, input.month, input.due_date, input.memo, now, now);
  return getFiling(id, userId)!;
}

export function updateFilingStatus(id: string, userId: string, status: FilingStatus): TaxFiling | null {
  const now     = Date.now();
  const filedAt = status === 'done' ? now : null;
  db.prepare(`
    UPDATE tax_filings SET status = ?, filed_at = ?, updated_at = ? WHERE id = ? AND user_id = ?
  `).run(status, filedAt, now, id, userId);
  return getFiling(id, userId);
}

export function updateFiling(id: string, userId: string, patch: Partial<FilingInput & { status: FilingStatus }>): TaxFiling | null {
  const existing = getFiling(id, userId);
  if (!existing) return null;
  const now = Date.now();
  const merged = {
    client_id: patch.client_id ?? existing.client_id,
    type:      patch.type      ?? existing.type,
    year:      patch.year      ?? existing.year,
    month:     patch.month     ?? existing.month,
    due_date:  patch.due_date  ?? existing.due_date,
    status:    patch.status    ?? existing.status,
    filed_at:  patch.status === 'done' ? now : patch.status ? null : existing.filed_at,
    memo:      patch.memo      ?? existing.memo,
  };
  db.prepare(`
    UPDATE tax_filings
    SET client_id=?, type=?, year=?, month=?, due_date=?, status=?, filed_at=?, memo=?, updated_at=?
    WHERE id=? AND user_id=?
  `).run(
    merged.client_id, merged.type, merged.year, merged.month,
    merged.due_date, merged.status, merged.filed_at, merged.memo,
    now, id, userId
  );
  return getFiling(id, userId);
}

export function deleteFiling(id: string, userId: string): boolean {
  const result = db.prepare('DELETE FROM tax_filings WHERE id=? AND user_id=?').run(id, userId);
  return result.changes > 0;
}
