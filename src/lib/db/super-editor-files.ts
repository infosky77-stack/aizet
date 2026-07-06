import { randomUUID } from 'crypto';
import type Database from 'better-sqlite3';
import db from '@/lib/db';

export type FileType = 'image' | 'video' | 'audio';

export interface SuperEditorFile {
  id:            string;
  user_id:       string;
  filename:      string;
  orig_name:     string;
  file_type:     FileType;
  mime_type:     string;
  size_bytes:    number;
  content_hash:  string;
  sort_order:    number;
  order_id:      string | null;
  created_at:    number;
}

export interface InsertFileParams {
  userId:      string;
  filename:    string;
  origName:    string;
  fileType:    FileType;
  mimeType:    string;
  sizeBytes:   number;
  contentHash?: string;
  /** 이 파일이 속한 주문(도록/영상/인쇄) id. 없으면 주문 미지정 — 독립 파일 관리자 페이지 업로드용 */
  orderId?:    string | null;
}

export function insertFile(params: InsertFileParams, dbHandle: Database.Database = db): SuperEditorFile {
  const id  = randomUUID();
  const now = Date.now();
  dbHandle.prepare(`
    INSERT INTO super_editor_files
      (id, user_id, filename, orig_name, file_type, mime_type, size_bytes, content_hash, sort_order, order_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, params.userId, params.filename, params.origName, params.fileType, params.mimeType,
    params.sizeBytes, params.contentHash ?? '', -now, params.orderId ?? null, now,
  );
  return getFile(id, dbHandle)!;
}

export function getFile(id: string, dbHandle: Database.Database = db): SuperEditorFile | null {
  return dbHandle.prepare<[string], SuperEditorFile>(
    'SELECT * FROM super_editor_files WHERE id=?'
  ).get(id) ?? null;
}

// orderId 생략 시 전체(독립 파일 관리자 페이지용, 기존 동작 그대로) — 주면 그 주문 파일만
export function listFiles(userId: string, fileType?: FileType, orderId?: string, dbHandle: Database.Database = db): SuperEditorFile[] {
  const conditions = ['user_id=?'];
  const args: (string)[] = [userId];
  if (fileType) { conditions.push('file_type=?'); args.push(fileType); }
  if (orderId)  { conditions.push('order_id=?');  args.push(orderId); }
  return dbHandle.prepare<string[], SuperEditorFile>(
    `SELECT * FROM super_editor_files WHERE ${conditions.join(' AND ')} ORDER BY sort_order ASC, created_at DESC`
  ).all(...args) as SuperEditorFile[];
}

// 같은 이름 + 같은 내용(hash)의 파일이 이미 있는지 조회 — 있으면 "완전 동일" 중복.
// orderId로 폴더(주문) 단위 격리 — 다른 주문에 같은 이름·내용 파일이 있어도 여긴 안 걸림.
// orderId가 null이면(독립 관리자 페이지) 마찬가지로 "주문 미지정 파일들끼리"만 비교(IS 사용 — NULL은 = 로 안 걸림).
export function findExactDuplicate(
  userId: string, origName: string, contentHash: string, orderId: string | null = null,
  dbHandle: Database.Database = db,
): SuperEditorFile | null {
  if (!contentHash) return null;
  return dbHandle.prepare<[string, string, string, string | null], SuperEditorFile>(
    'SELECT * FROM super_editor_files WHERE user_id=? AND orig_name=? AND content_hash=? AND order_id IS ? LIMIT 1'
  ).get(userId, origName, contentHash, orderId) ?? null;
}

// 이름 충돌("(1)" "(2)" 접미사) 계산 대상 — 같은 주문(폴더) 안에서만 비교
export function listOrigNames(userId: string, orderId: string | null = null, excludeId?: string, dbHandle: Database.Database = db): Set<string> {
  const rows = excludeId
    ? dbHandle.prepare<[string, string | null, string], { orig_name: string }>(
        'SELECT orig_name FROM super_editor_files WHERE user_id=? AND order_id IS ? AND id!=?'
      ).all(userId, orderId, excludeId)
    : dbHandle.prepare<[string, string | null], { orig_name: string }>(
        'SELECT orig_name FROM super_editor_files WHERE user_id=? AND order_id IS ?'
      ).all(userId, orderId);
  return new Set((rows as { orig_name: string }[]).map(r => r.orig_name));
}

// "이름.ext" 가 이미 존재하면 "이름 (1).ext", "이름 (2).ext" ... 로 다음 사용 가능한 이름을 계산
export function resolveAvailableName(existingNames: Set<string>, desiredName: string): string {
  if (!existingNames.has(desiredName)) return desiredName;
  const dot  = desiredName.lastIndexOf('.');
  const base = dot > 0 ? desiredName.slice(0, dot) : desiredName;
  const ext  = dot > 0 ? desiredName.slice(dot) : '';
  let n = 1;
  let candidate = `${base} (${n})${ext}`;
  while (existingNames.has(candidate)) {
    n += 1;
    candidate = `${base} (${n})${ext}`;
  }
  return candidate;
}

export function renameFile(id: string, userId: string, newName: string, dbHandle: Database.Database = db): SuperEditorFile | null {
  const record = getFile(id, dbHandle);
  if (!record || record.user_id !== userId) return null;
  // 이 파일이 속한 주문(폴더) 안에서만 이름충돌 검사 — 다른 주문의 동명 파일과는 무관
  const existingNames = listOrigNames(userId, record.order_id, id, dbHandle);
  const finalName = resolveAvailableName(existingNames, newName);
  dbHandle.prepare('UPDATE super_editor_files SET orig_name=? WHERE id=? AND user_id=?').run(finalName, id, userId);
  return getFile(id, dbHandle);
}

// order: 원하는 순서대로 나열된 파일 id 배열 (0번째가 맨 앞)
export function reorderFiles(userId: string, order: string[], dbHandle: Database.Database = db): void {
  const stmt = dbHandle.prepare('UPDATE super_editor_files SET sort_order=? WHERE id=? AND user_id=?');
  const tx = dbHandle.transaction((ids: string[]) => {
    ids.forEach((id, idx) => stmt.run(idx, id, userId));
  });
  tx(order);
}

export function deleteFile(id: string, userId: string, dbHandle: Database.Database = db): boolean {
  const result = dbHandle.prepare(
    'DELETE FROM super_editor_files WHERE id=? AND user_id=?'
  ).run(id, userId);
  return result.changes > 0;
}
