// AIZET Object Model — Press PDF 렌더러 테스트
// (store.test.ts와 같은 방식: 순수 tsx 스크립트, checks 배열, 실패 시 process.exit(1))
import { writeFileSync } from 'fs';
import { PDFDocument } from 'pdf-lib';
import { bootstrapSite } from '../../../siteDb/siteDb';
import { createDocument, createBlock } from '../store';
import { loadDocumentTree } from '../model';
import { seedCatalogDemo } from '../seed';
import { renderPdf } from './pdf';
import type { BlockKind } from '../types';

const checks: [string, boolean][] = [];
const asKind = (k: string) => k as BlockKind; // 모르는 kind 스킵 경로 테스트용 캐스트

async function main() {
  const db = bootstrapSite(':memory:');

  // ── 표준 도록 데모 렌더 ───────────────────────────────────────────────────
  const { documentId } = seedCatalogDemo(db);
  const tree = loadDocumentTree(db, documentId)!;
  const bytes = await renderPdf(tree);

  checks.push(['renderPdf: Uint8Array 반환', bytes instanceof Uint8Array]);
  checks.push(['PDF 매직 헤더(%PDF-)', String.fromCharCode(...bytes.slice(0, 5)) === '%PDF-']);
  checks.push(['PDF 트레일러(%%EOF) 포함', Buffer.from(bytes).lastIndexOf('%%EOF') > 0]);
  // subset:false 한글 폰트 임베드 → 파일이 상당히 큼(수십 KB 이상)
  checks.push(['폰트 임베드로 충분한 크기(>50KB)', bytes.length > 50_000]);

  // 되읽어 유효한 PDF인지 + 페이지 수 검증
  const reloaded = await PDFDocument.load(bytes);
  checks.push(['되읽기 가능한 유효 PDF, 페이지 ≥1', reloaded.getPageCount() >= 1]);

  // ── 견고성: 긴 무공백 한글 + 모르는 kind + 최상위 stray list_item ──────────
  const doc2 = createDocument(db, { kind: 'catalog', title: '견고성 샘플' });
  createBlock(db, { documentId: doc2.id, parentId: null, kind: 'heading', data: { level: 1, text: '견고성' } });
  // 공백 없는 아주 긴 한글(글자 단위 줄바꿈 경로)
  createBlock(db, { documentId: doc2.id, parentId: null, kind: 'paragraph',
    data: { text: '가나다라마바사아자차카타파하'.repeat(30) } });
  // 모르는 kind(스킵돼야 함)
  createBlock(db, { documentId: doc2.id, parentId: null, kind: asKind('callout'), data: { text: '무시됨' } as never });
  // 최상위 stray list_item(스킵)
  createBlock(db, { documentId: doc2.id, parentId: null, kind: 'list_item', data: { text: '떠돌이' } });
  // 여러 페이지를 유발할 만큼 문단 반복
  for (let i = 0; i < 40; i++) {
    createBlock(db, { documentId: doc2.id, parentId: null, kind: 'paragraph',
      data: { text: `문단 ${i + 1}: 전통 기법으로 빚은 도자기의 세부 설명을 담은 긴 본문입니다.` } });
  }

  const tree2 = loadDocumentTree(db, doc2.id)!;
  let threw = false;
  let bytes2: Uint8Array = new Uint8Array();
  try { bytes2 = await renderPdf(tree2); } catch { threw = true; }
  checks.push(['견고성: 긴텍스트+모르는kind+stray 렌더 예외 없음', !threw]);

  const reloaded2 = await PDFDocument.load(bytes2);
  checks.push(['견고성: 다중 페이지로 분할(≥2)', reloaded2.getPageCount() >= 2]);

  db.close();

  // ── 미리보기 산출물(스크래치, 추적/커밋 안 됨) ─────────────────────────────
  const PREVIEW_PATH = '/tmp/aizet-om-preview.pdf';
  writeFileSync(PREVIEW_PATH, bytes);

  let failed = 0;
  for (const [name, ok] of checks) { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}`); }
  console.log(`\n${checks.length - failed}/${checks.length} passed`);
  console.log(`미리보기 산출물: ${PREVIEW_PATH}`);
  process.exit(failed === 0 ? 0 : 1);
}

main();
