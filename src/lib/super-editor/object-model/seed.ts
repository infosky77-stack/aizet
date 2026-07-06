// AIZET Object Model — 데모 시드(미리보기 편의용).
//
// 미리보기 라우트에서 ?seed=1로 호출하는 멱등 시더다. 정식 저장 API가 아니라, 빈 사업장에서도
// 렌더러 결과를 눈으로 확인할 수 있게 표준 도록 샘플 문서 하나를 만든다. 이미 같은 데모 문서가
// 있으면 다시 만들지 않고 그 id를 돌려준다(멱등). 직접 SQL 없이 store 함수만 쓴다.

import type Database from 'better-sqlite3';
import { createDocument, createBlock, listDocuments } from './store';

const DEMO_KIND  = 'catalog';
const DEMO_TITLE = '[데모] 봄 신상 도자기 컬렉션';

// 원본 이미지 없이도 브라우저에서 보이는 인라인 SVG 플레이스홀더
const SVG_SRC = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='240'><rect width='100%' height='100%' fill='%23e7e2d9'/><text x='50%' y='50%' text-anchor='middle' fill='%23888'>청화백자</text></svg>";

/**
 * 데모 도록 문서를 멱등 생성한다.
 *  - 이미 (kind='catalog', title=DEMO_TITLE) 문서가 있으면 { 그 id, created:false }.
 *  - 없으면 트랜잭션으로 문서 + 블록들을 만들고 { 새 id, created:true }.
 */
export function seedCatalogDemo(dbHandle: Database.Database): { documentId: string; created: boolean } {
  const existing = listDocuments(dbHandle).find((d) => d.kind === DEMO_KIND && d.title === DEMO_TITLE);
  if (existing) return { documentId: existing.id, created: false };

  const tx = dbHandle.transaction(() => {
    const doc = createDocument(dbHandle, { kind: DEMO_KIND, title: DEMO_TITLE, lang: 'ko', status: 'draft' });
    createBlock(dbHandle, { documentId: doc.id, parentId: null, kind: 'heading',   data: { level: 1, text: '봄 신상 도자기 컬렉션' } });
    createBlock(dbHandle, { documentId: doc.id, parentId: null, kind: 'paragraph', data: { text: '전통 기법으로 빚은 2026년 봄 신상 도자기를 소개합니다.' } });
    createBlock(dbHandle, { documentId: doc.id, parentId: null, kind: 'image',     data: { src: SVG_SRC, alt: '청화백자 화병', caption: '청화백자 화병 · 높이 30cm' } });
    createBlock(dbHandle, { documentId: doc.id, parentId: null, kind: 'heading',   data: { level: 2, text: '제품 특징' } });
    const list = createBlock(dbHandle, { documentId: doc.id, parentId: null, kind: 'list', data: { ordered: false } });
    createBlock(dbHandle, { documentId: doc.id, parentId: list.id, kind: 'list_item', data: { text: '전통 가마 소성' } });
    createBlock(dbHandle, { documentId: doc.id, parentId: list.id, kind: 'list_item', data: { text: '식기세척기 사용 가능' } });
    createBlock(dbHandle, { documentId: doc.id, parentId: list.id, kind: 'list_item', data: { text: '1점 1점 수작업' } });
    return doc.id;
  });

  const documentId = tx();
  return { documentId, created: true };
}
