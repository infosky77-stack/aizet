import { randomUUID } from 'crypto';
import db from '@/lib/db';

export type FileType = 'image' | 'video' | 'audio';

export interface SuperEditorFile {
  id:         string;
  user_id:    string;
  filename:   string;
  orig_name:  string;
  file_type:  FileType;
  mime_type:  string;
  size_bytes: number;
  created_at: number;
}

export function insertFile(
  userId: string,
  filename: string,
  origName: string,
  fileType: FileType,
  mimeType: string,
  sizeBytes: number,
): SuperEditorFile {
  const id  = randomUUID();
  const now = Date.now();
  db.prepare(`
    INSERT INTO super_editor_files (id, user_id, filename, orig_name, file_type, mime_type, size_bytes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId, filename, origName, fileType, mimeType, sizeBytes, now);
  return getFile(id)!;
}

export function getFile(id: string): SuperEditorFile | null {
  return db.prepare<[string], SuperEditorFile>(
    'SELECT * FROM super_editor_files WHERE id=?'
  ).get(id) ?? null;
}

export function listFiles(userId: string, fileType?: FileType): SuperEditorFile[] {
  if (fileType) {
    return db.prepare<[string, string], SuperEditorFile>(
      'SELECT * FROM super_editor_files WHERE user_id=? AND file_type=? ORDER BY created_at DESC'
    ).all(userId, fileType) as SuperEditorFile[];
  }
  return db.prepare<[string], SuperEditorFile>(
    'SELECT * FROM super_editor_files WHERE user_id=? ORDER BY created_at DESC'
  ).all(userId) as SuperEditorFile[];
}

export function deleteFile(id: string, userId: string): boolean {
  const result = db.prepare(
    'DELETE FROM super_editor_files WHERE id=? AND user_id=?'
  ).run(id, userId);
  return result.changes > 0;
}
