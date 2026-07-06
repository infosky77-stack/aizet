// AIZET Object Model — 저장소(CRUD + 순서 관리).
//
// 관례(기존 super-editor-files.ts와 동일):
//  - 모든 함수는 better-sqlite3 핸들 dbHandle을 필수 첫 인자로 받는다(싱글턴 기본값 없음 —
//    사업장 전용 모델이라 항상 그 사업장 siteDb 핸들을 주입받아야 한다).
//  - prepared statement + 배치는 dbHandle.transaction으로 원자화한다.
//  - 순서는 정수 position + 형제 그룹((document_id, parent_id)) 안에서 밀집 재인덱싱을 쓴다
//    (reorderFiles와 동일 사상). fractional/lexo 랭크는 쓰지 않는다.
//  - 형제 그룹 질의는 parent_id가 NULL일 수 있으므로 `parent_id IS ?`를 쓴다(= 는 NULL 불일치).

import { randomUUID } from 'crypto';
import type Database from 'better-sqlite3';
import type { Block, BlockData, BlockKind, Document } from './types';

/** id 생성 — 코드베이스에 공용 유틸이 없어(전부 randomUUID 직접 사용) 이 모듈에 둔다.
 *  prefix로 종류를 식별 가능하게: `doc_<uuid>`, `blk_<uuid>`. 외부 의존성 추가 없음. */
export function newId(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}

// ── Document ────────────────────────────────────────────────────────────────

export interface CreateDocumentInput {
  kind:   string;
  title?: string;
  lang?:  string;
  status?: string;
}

export function createDocument(dbHandle: Database.Database, input: CreateDocumentInput): Document {
  const id  = newId('doc');
  const now = Date.now();
  dbHandle.prepare(`
    INSERT INTO documents (id, kind, title, lang, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, input.kind, input.title ?? '', input.lang ?? 'ko', input.status ?? 'draft', now, now,
  );
  return getDocument(dbHandle, id)!;
}

export function getDocument(dbHandle: Database.Database, id: string): Document | null {
  return dbHandle.prepare<[string], Document>('SELECT * FROM documents WHERE id=?').get(id) ?? null;
}

/** 문서 전체 목록 — 최근 수정 먼저(updated_at DESC). 미리보기 목록/seed 멱등 조회용. */
export function listDocuments(dbHandle: Database.Database): Document[] {
  return dbHandle.prepare<[], Document>('SELECT * FROM documents ORDER BY updated_at DESC').all();
}

export interface UpdateDocumentPatch {
  kind?:   string;
  title?:  string;
  lang?:   string;
  status?: string;
}

/** 부분 수정 — 현재 행을 읽어 patch를 병합해 다시 쓴다(존재하지 않으면 null). updated_at 갱신. */
export function updateDocument(dbHandle: Database.Database, id: string, patch: UpdateDocumentPatch): Document | null {
  const cur = getDocument(dbHandle, id);
  if (!cur) return null;
  const next = {
    kind:   patch.kind   !== undefined ? patch.kind   : cur.kind,
    title:  patch.title  !== undefined ? patch.title  : cur.title,
    lang:   patch.lang   !== undefined ? patch.lang   : cur.lang,
    status: patch.status !== undefined ? patch.status : cur.status,
  };
  dbHandle.prepare(`
    UPDATE documents SET kind=?, title=?, lang=?, status=?, updated_at=? WHERE id=?
  `).run(next.kind, next.title, next.lang, next.status, Date.now(), id);
  return getDocument(dbHandle, id);
}

/** 문서 삭제 — 해당 문서의 블록 전체를 함께 삭제(트랜잭션). */
export function deleteDocument(dbHandle: Database.Database, id: string): void {
  const tx = dbHandle.transaction((docId: string) => {
    dbHandle.prepare('DELETE FROM blocks WHERE document_id=?').run(docId);
    dbHandle.prepare('DELETE FROM documents WHERE id=?').run(docId);
  });
  tx(id);
}

// ── Block ─────────────────────────────────────────────────────────────────────

export interface CreateBlockInput {
  documentId: string;
  parentId:   string | null;
  kind:       BlockKind;
  data:       BlockData;
  position?:  number;
}

/** 블록 생성 — position 미지정 시 같은 (documentId, parentId) 형제 그룹의 맨 뒤(max+1)에 붙인다. */
export function createBlock(dbHandle: Database.Database, input: CreateBlockInput): Block {
  const id  = newId('blk');
  const now = Date.now();
  const position = input.position ?? nextPosition(dbHandle, input.documentId, input.parentId);
  dbHandle.prepare(`
    INSERT INTO blocks (id, document_id, parent_id, kind, position, data, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, input.documentId, input.parentId, input.kind, position, JSON.stringify(input.data), now, now);
  return getBlock(dbHandle, id)!;
}

export function getBlock(dbHandle: Database.Database, id: string): Block | null {
  return dbHandle.prepare<[string], Block>('SELECT * FROM blocks WHERE id=?').get(id) ?? null;
}

/** 문서 전체 블록 — parent_id, position 순(모델 조립이 이 순서를 소비). */
export function listBlocks(dbHandle: Database.Database, documentId: string): Block[] {
  return dbHandle.prepare<[string], Block>(
    'SELECT * FROM blocks WHERE document_id=? ORDER BY parent_id, position',
  ).all(documentId);
}

export interface UpdateBlockPatch {
  kind?: BlockKind;
  data?: BlockData;
}

/** 블록 수정 — kind/data 병합 후 다시 쓴다(없으면 null). updated_at 갱신. */
export function updateBlock(dbHandle: Database.Database, id: string, patch: UpdateBlockPatch): Block | null {
  const cur = getBlock(dbHandle, id);
  if (!cur) return null;
  const kind = patch.kind !== undefined ? patch.kind : cur.kind;
  const data = patch.data !== undefined ? JSON.stringify(patch.data) : cur.data;
  dbHandle.prepare('UPDATE blocks SET kind=?, data=?, updated_at=? WHERE id=?')
    .run(kind, data, Date.now(), id);
  return getBlock(dbHandle, id);
}

/**
 * 블록 삭제 — 자식(서브트리) 전체를 재귀로 함께 삭제한 뒤, 남은 형제들의 position을
 * 0..n-1로 밀집 재인덱싱한다(전부 한 트랜잭션). 없는 id면 아무것도 하지 않는다.
 */
export function deleteBlock(dbHandle: Database.Database, id: string): void {
  const target = getBlock(dbHandle, id);
  if (!target) return;

  const tx = dbHandle.transaction(() => {
    // 1) 서브트리 id 수집(BFS) — target 포함
    const toDelete: string[] = [];
    let frontier: string[] = [id];
    while (frontier.length) {
      toDelete.push(...frontier);
      const next: string[] = [];
      for (const pid of frontier) {
        const kids = dbHandle.prepare<[string], { id: string }>(
          'SELECT id FROM blocks WHERE parent_id=?',
        ).all(pid);
        next.push(...kids.map((k) => k.id));
      }
      frontier = next;
    }
    // 2) 전부 삭제
    const del = dbHandle.prepare('DELETE FROM blocks WHERE id=?');
    for (const bid of toDelete) del.run(bid);
    // 3) 삭제된 블록이 있던 형제 그룹 밀집 재인덱싱
    reindexSiblings(dbHandle, target.document_id, target.parent_id);
  });
  tx();
}

/**
 * 형제 그룹 순서 재배치 — orderedIds 순서대로 position=idx로 UPDATE(트랜잭션).
 * (document_id, parent_id) 스코프를 함께 조건에 걸어 다른 문서/그룹 블록은 건드리지 않는다.
 */
export function reorderSiblings(
  dbHandle: Database.Database, documentId: string, parentId: string | null, orderedIds: string[],
): void {
  const stmt = dbHandle.prepare(
    'UPDATE blocks SET position=? WHERE id=? AND document_id=? AND parent_id IS ?',
  );
  const tx = dbHandle.transaction((ids: string[]) => {
    ids.forEach((bid, idx) => stmt.run(idx, bid, documentId, parentId));
  });
  tx(orderedIds);
}

// ── 내부 헬퍼 ─────────────────────────────────────────────────────────────────

/** 형제 그룹의 다음 맨끝 position(max+1, 비어있으면 0). parent_id는 IS로 NULL 대응. */
function nextPosition(dbHandle: Database.Database, documentId: string, parentId: string | null): number {
  const row = dbHandle.prepare<[string, string | null], { pos: number }>(
    'SELECT COALESCE(MAX(position), -1) + 1 AS pos FROM blocks WHERE document_id=? AND parent_id IS ?',
  ).get(documentId, parentId);
  return row?.pos ?? 0;
}

/** 형제 그룹을 position 순으로 읽어 0..n-1로 밀집 재부여. */
function reindexSiblings(dbHandle: Database.Database, documentId: string, parentId: string | null): void {
  const rows = dbHandle.prepare<[string, string | null], { id: string }>(
    'SELECT id FROM blocks WHERE document_id=? AND parent_id IS ? ORDER BY position ASC, created_at ASC',
  ).all(documentId, parentId);
  const stmt = dbHandle.prepare('UPDATE blocks SET position=? WHERE id=?');
  rows.forEach((r, idx) => stmt.run(idx, r.id));
}
