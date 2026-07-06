// AIZET Object Model 저장소·조립 테스트
// (siteDb.test.ts와 같은 방식: 순수 tsx 스크립트, checks 배열, process.exit)
import { bootstrapSite } from '../../siteDb/siteDb';
import {
  createDocument, getDocument, deleteDocument,
  createBlock, updateBlock, deleteBlock, reorderSiblings, listBlocks,
} from './store';
import { loadDocumentTree } from './model';
import type { HeadingData, ImageData, ListItemData } from './types';

const checks: [string, boolean][] = [];

// ── 부트스트랩(인메모리) + 도록 문서 생성 ─────────────────────────────────────
const db = bootstrapSite(':memory:');

const doc = createDocument(db, { kind: 'catalog', title: '도록 샘플' });
checks.push(['createDocument: id/kind/기본값', !!doc.id && doc.kind === 'catalog'
  && doc.title === '도록 샘플' && doc.lang === 'ko' && doc.status === 'draft']);

// 최상위 블록 4개(순서대로 heading, paragraph, image, list)
const heading   = createBlock(db, { documentId: doc.id, parentId: null, kind: 'heading',   data: { level: 1, text: '작품집 서문' } });
const paragraph = createBlock(db, { documentId: doc.id, parentId: null, kind: 'paragraph', data: { text: '이 도록은 2026년 전시작을 모았습니다.' } });
const image     = createBlock(db, { documentId: doc.id, parentId: null, kind: 'image',     data: { src: 'img/cover.jpg', alt: '표지', caption: '표지 작품 — 무제' } });
const list      = createBlock(db, { documentId: doc.id, parentId: null, kind: 'list',      data: { ordered: false } });

// list 자식 list_item 3개
const li1 = createBlock(db, { documentId: doc.id, parentId: list.id, kind: 'list_item', data: { text: '첫째 항목' } });
const li2 = createBlock(db, { documentId: doc.id, parentId: list.id, kind: 'list_item', data: { text: '둘째 항목' } });
const li3 = createBlock(db, { documentId: doc.id, parentId: list.id, kind: 'list_item', data: { text: '셋째 항목' } });

// position 자동 부여 확인(형제 그룹 max+1)
checks.push(['createBlock: 최상위 position 0..3 자동 부여',
  heading.position === 0 && paragraph.position === 1 && image.position === 2 && list.position === 3]);
checks.push(['createBlock: 자식 position 0..2 자동 부여(형제 그룹 독립)',
  li1.position === 0 && li2.position === 1 && li3.position === 2]);

// ── loadDocumentTree 왕복 ─────────────────────────────────────────────────────
const tree = loadDocumentTree(db, doc.id);
checks.push(['loadDocumentTree: 문서 로드됨', !!tree && tree.document.id === doc.id]);

const top = tree!.blocks;
checks.push(['최상위 순서 정확(heading,paragraph,image,list)',
  top.length === 4 && top[0].kind === 'heading' && top[1].kind === 'paragraph'
  && top[2].kind === 'image' && top[3].kind === 'list']);

// data 왕복 정확
checks.push(['heading.data 왕복(level/text)',
  (top[0].data as HeadingData).level === 1 && (top[0].data as HeadingData).text === '작품집 서문']);
checks.push(['image.data.caption 왕복',
  (top[2].data as ImageData).caption === '표지 작품 — 무제'
  && (top[2].data as ImageData).src === 'img/cover.jpg']);

// list 자식 3개 + position 순서
const listNode = top[3];
checks.push(['list.children = list_item 3개, position 순서 정확',
  listNode.children.length === 3
  && listNode.children.every((c) => c.kind === 'list_item')
  && (listNode.children[0].data as ListItemData).text === '첫째 항목'
  && (listNode.children[1].data as ListItemData).text === '둘째 항목'
  && (listNode.children[2].data as ListItemData).text === '셋째 항목'
  && listNode.children[0].position === 0 && listNode.children[2].position === 2]);

// ── reorderSiblings: 최상위 순서 뒤집기 → 재조회 반영 ─────────────────────────
reorderSiblings(db, doc.id, null, [list.id, image.id, paragraph.id, heading.id]);
const tree2 = loadDocumentTree(db, doc.id);
const top2 = tree2!.blocks;
checks.push(['reorderSiblings(최상위): 재조회 순서 반영(list,image,paragraph,heading)',
  top2[0].kind === 'list' && top2[1].kind === 'image'
  && top2[2].kind === 'paragraph' && top2[3].kind === 'heading']);

// ── reorderSiblings: 자식 그룹 순서 변경(부모 스코프 격리) ────────────────────
reorderSiblings(db, doc.id, list.id, [li3.id, li1.id, li2.id]);
const tree3 = loadDocumentTree(db, doc.id);
const listNode3 = tree3!.blocks.find((b) => b.id === list.id)!;
checks.push(['reorderSiblings(자식): 순서 반영(셋째,첫째,둘째)',
  (listNode3.children[0].data as ListItemData).text === '셋째 항목'
  && (listNode3.children[1].data as ListItemData).text === '첫째 항목'
  && (listNode3.children[2].data as ListItemData).text === '둘째 항목']);

// ── updateBlock: data 갱신 왕복 ──────────────────────────────────────────────
updateBlock(db, paragraph.id, { data: { text: '수정된 서문 문단' } });
const tree4 = loadDocumentTree(db, doc.id);
const paraNode = tree4!.blocks.find((b) => b.id === paragraph.id)!;
checks.push(['updateBlock: data 갱신 반영', (paraNode.data as { text: string }).text === '수정된 서문 문단']);

// ── deleteBlock: 자식 재귀 삭제 + 형제 밀집 재인덱싱 ─────────────────────────
// list(자식 3개 포함)를 삭제 → list 및 list_item 3개 모두 사라지고, 남은 최상위 3개 position 0..2
deleteBlock(db, list.id);
const after = listBlocks(db, doc.id);
checks.push(['deleteBlock: list 서브트리(4개) 삭제', after.length === 3
  && after.every((b) => b.id !== list.id && b.parent_id !== list.id)]);

const tree5 = loadDocumentTree(db, doc.id);
const topPositions = tree5!.blocks.map((b) => b.position).sort((a, b) => a - b);
checks.push(['deleteBlock 후 형제 position 0..n-1 밀집 재인덱싱',
  tree5!.blocks.length === 3 && topPositions[0] === 0 && topPositions[1] === 1 && topPositions[2] === 2]);

// ── deleteDocument: 문서 + 잔여 블록 전부 삭제 ───────────────────────────────
deleteDocument(db, doc.id);
checks.push(['deleteDocument: 문서+잔여 블록 전부 삭제',
  getDocument(db, doc.id) === null && listBlocks(db, doc.id).length === 0]);
db.close();

let failed = 0;
for (const [name, ok] of checks) { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}`); }
console.log(`\n${checks.length - failed}/${checks.length} passed`);
process.exit(failed === 0 ? 0 : 1);
