import { randomUUID } from 'crypto';
import db from '@/lib/db';

export interface TaxDocument {
  id:            string;
  client_id:     string;
  client_name:   string;
  user_id:       string;
  filename:      string;
  mime_type:     string;
  file_size:     number;
  local_path:    string | null;
  drive_file_id: string | null;
  drive_url:     string | null;
  doc_date:      string | null;
  amount:        number | null;
  vendor:        string;
  category:      string;
  ai_raw:        string;
  ai_confirmed:  number;
  deleted_at:    number | null;
  deleted_by:    string | null;
  created_at:    number;
  updated_at:    number;
}

export interface DocumentInput {
  client_id:     string;
  filename:      string;
  mime_type:     string;
  file_size:     number;
  local_path?:   string;
  drive_file_id?: string;
  drive_url?:    string;
  doc_date?:     string | null;
  amount?:       number | null;
  vendor?:       string;
  category?:     string;
  ai_raw?:       string;
}

const SELECT = `
  SELECT d.*, c.name as client_name
  FROM tax_documents d
  JOIN tax_clients c ON d.client_id = c.id
`;

export function listDocuments(
  userId: string,
  opts: { includeDeleted?: boolean; clientId?: string; category?: string; confirmed?: boolean } = {},
): TaxDocument[] {
  const conditions: string[] = ['d.user_id = ?'];
  const params: (string | number)[] = [userId];

  if (!opts.includeDeleted) conditions.push('d.deleted_at IS NULL');
  else conditions.push('d.deleted_at IS NOT NULL');

  if (opts.clientId)  { conditions.push('d.client_id = ?'); params.push(opts.clientId); }
  if (opts.category)  { conditions.push('d.category = ?');  params.push(opts.category); }
  if (opts.confirmed !== undefined) {
    conditions.push('d.ai_confirmed = ?');
    params.push(opts.confirmed ? 1 : 0);
  }

  const where = conditions.join(' AND ');
  return db
    .prepare<typeof params, TaxDocument>(
      `${SELECT} WHERE ${where} ORDER BY COALESCE(d.doc_date, '') DESC, d.created_at DESC`
    )
    .all(...params);
}

export function getDocument(id: string, userId: string): TaxDocument | null {
  return (
    db.prepare<[string, string], TaxDocument>(
      `${SELECT} WHERE d.id = ? AND d.user_id = ?`
    ).get(id, userId) ?? null
  );
}

export function createDocument(userId: string, input: DocumentInput): TaxDocument {
  const now = Date.now();
  const id  = randomUUID();
  db.prepare(`
    INSERT INTO tax_documents
      (id, client_id, user_id, filename, mime_type, file_size, local_path,
       drive_file_id, drive_url, doc_date, amount, vendor, category, ai_raw,
       ai_confirmed, deleted_at, deleted_by, created_at, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,NULL,NULL,?,?)
  `).run(
    id, input.client_id, userId, input.filename, input.mime_type, input.file_size,
    input.local_path ?? null, input.drive_file_id ?? null, input.drive_url ?? null,
    input.doc_date ?? null, input.amount ?? null,
    input.vendor ?? '', input.category ?? '', input.ai_raw ?? '',
    now, now,
  );
  return getDocument(id, userId)!;
}

export function updateDocument(
  id: string,
  userId: string,
  patch: Partial<Pick<TaxDocument, 'doc_date' | 'amount' | 'vendor' | 'category' | 'ai_confirmed' | 'drive_file_id' | 'drive_url'>>,
): TaxDocument | null {
  const existing = getDocument(id, userId);
  if (!existing) return null;
  const now    = Date.now();
  const merged = { ...existing, ...patch, updated_at: now };
  db.prepare(`
    UPDATE tax_documents
    SET doc_date=?, amount=?, vendor=?, category=?, ai_confirmed=?,
        drive_file_id=?, drive_url=?, updated_at=?
    WHERE id=? AND user_id=?
  `).run(
    merged.doc_date, merged.amount, merged.vendor, merged.category,
    merged.ai_confirmed, merged.drive_file_id, merged.drive_url,
    now, id, userId,
  );
  return getDocument(id, userId)!;
}

export function softDeleteDocument(id: string, userId: string, deletedBy: string): TaxDocument | null {
  const existing = getDocument(id, userId);
  if (!existing || existing.deleted_at) return null;
  const now = Date.now();
  db.prepare(`
    UPDATE tax_documents SET deleted_at=?, deleted_by=?, updated_at=? WHERE id=? AND user_id=?
  `).run(now, deletedBy, now, id, userId);
  return getDocument(id, userId)!;
}

export function restoreDocument(id: string, userId: string): TaxDocument | null {
  const now = Date.now();
  db.prepare(`
    UPDATE tax_documents SET deleted_at=NULL, deleted_by=NULL, updated_at=? WHERE id=? AND user_id=?
  `).run(now, id, userId);
  return getDocument(id, userId);
}

/** 소프트 삭제 후 30일 이상 경과한 문서를 영구 삭제. 삭제된 로컬 경로 목록 반환. */
export function purgeExpiredDocuments(userId: string): { id: string; local_path: string | null; drive_file_id: string | null }[] {
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  type Row = { id: string; local_path: string | null; drive_file_id: string | null };
  const expired = db
    .prepare<[string, number], Row>(
      `SELECT id, local_path, drive_file_id
       FROM tax_documents WHERE user_id=? AND deleted_at IS NOT NULL AND deleted_at < ?`
    )
    .all(userId, cutoff);
  if (expired.length > 0) {
    const ids = expired.map(r => `'${r.id}'`).join(',');
    db.exec(`DELETE FROM tax_documents WHERE id IN (${ids})`);
  }
  return expired;
}
