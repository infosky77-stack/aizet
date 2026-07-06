// AIZET Object Model — 트리 조립.
//
// 저장소의 평평한 블록 배열을 parent_id로 묶고 position 오름차순으로 정렬해, 모든 렌더러가
// 소비할 표준 모델(DocumentTree)로 조립한다. 각 블록의 data(JSON 문자열)를 파싱해 넣는다.

import type Database from 'better-sqlite3';
import type { Block, BlockData, BlockNode, DocumentTree } from './types';
import { getDocument, listBlocks } from './store';

/** data 파싱 — 저장된 JSON 문자열을 객체로. 손상 시 빈 객체로 방어(렌더러가 죽지 않게). */
function parseData(raw: string): BlockData {
  try {
    return JSON.parse(raw) as BlockData;
  } catch {
    return {} as BlockData;
  }
}

/**
 * 문서 트리를 로드한다. 문서가 없으면 null.
 * 조립 규칙:
 *  - listBlocks로 평평한 배열을 얻고, parent_id(null=최상위)별 자식 목록으로 그룹핑.
 *  - 각 그룹은 position 오름차순 정렬.
 *  - 최상위(parent_id=null)부터 재귀로 children을 채워 BlockNode 트리를 만든다.
 *  - 각 노드의 data는 파싱된 객체로 대체한다.
 */
export function loadDocumentTree(dbHandle: Database.Database, documentId: string): DocumentTree | null {
  const document = getDocument(dbHandle, documentId);
  if (!document) return null;

  const flat = listBlocks(dbHandle, documentId);

  // parent_id → 자식 Block[] (null 부모는 '' 키로 정규화)
  const NULL_KEY = '';
  const byParent = new Map<string, Block[]>();
  for (const b of flat) {
    const key = b.parent_id ?? NULL_KEY;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(b);
  }
  for (const arr of byParent.values()) arr.sort((a, b) => a.position - b.position);

  const build = (parentKey: string): BlockNode[] => {
    const kids = byParent.get(parentKey) ?? [];
    return kids.map((b) => ({
      ...b,
      data:     parseData(b.data),
      children: build(b.id),
    }));
  };

  return { document, blocks: build(NULL_KEY) };
}
