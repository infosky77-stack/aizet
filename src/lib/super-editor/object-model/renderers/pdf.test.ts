// AIZET Object Model — Press PDF 렌더러 테스트
// (store.test.ts와 같은 방식: 순수 tsx 스크립트, checks 배열, 실패 시 process.exit(1))
import { writeFileSync } from 'fs';
import zlib from 'node:zlib';
import { PDFDocument } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { bootstrapSite } from '../../../siteDb/siteDb';
import { createDocument, createBlock } from '../store';
import { loadDocumentTree } from '../model';
import { seedCatalogDemo } from '../seed';
import { renderPdf } from './pdf';
import { loadKoreanFontBytes } from './fontLoader';
import type { BlockKind } from '../types';

const checks: [string, boolean][] = [];
const asKind = (k: string) => k as BlockKind; // 모르는 kind 스킵 경로 테스트용 캐스트

// ── 빈 윤곽 회귀 가드용 헬퍼 ──────────────────────────────────────────────────
// 이 테스트는 subset:true 같은 "서브셋 글리프 누락" 회귀를 잡기 위한 가드다. subset:true는
// 한글 복합 글리프의 컴포넌트를 서브셋에 못 담아 임베드 폰트의 글자 윤곽이 비어(글자가 사라짐)
// 콘텐츠 스트림의 .notdef 검사로는 안 잡힌다 → 실제 임베드된 폰트를 꺼내 윤곽을 직접 본다.
// 폰트/subset 변경 시 반드시 통과해야 한다.

/** 렌더된 PDF에서 임베드된 TrueType 폰트(FontFile2) 스트림을 추출(가장 큰 TTF 스트림). */
function extractEmbeddedTTF(buf: Buffer): Buffer | null {
  const latin = buf.toString('latin1');
  const re = /stream\r?\n/g; let m: RegExpExecArray | null; let best: Buffer | null = null;
  while ((m = re.exec(latin)) !== null) {
    const start = m.index + m[0].length; const end = latin.indexOf('endstream', start);
    if (end < 0) continue;
    const raw = buf.subarray(start, end);
    let data: Buffer; try { data = zlib.inflateSync(raw); } catch { data = raw; }
    const sig = data.subarray(0, 4);
    if ((sig[0] === 0x00 && sig[1] === 0x01 && sig[2] === 0x00 && sig[3] === 0x00) ||
        sig.toString('latin1') === 'true' || sig.toString('latin1') === 'OTTO') {
      if (!best || data.length > best.length) best = data;
    }
  }
  return best;
}

/** 페이지 콘텐츠에서 실제로 그려진 글리프 코드(CID)를 수집. */
function drawnCIDs(buf: Buffer): number[] {
  const latin = buf.toString('latin1');
  const re = /stream\r?\n/g; let m: RegExpExecArray | null; const codes: number[] = [];
  while ((m = re.exec(latin)) !== null) {
    const start = m.index + m[0].length; const end = latin.indexOf('endstream', start);
    if (end < 0) continue; const raw = buf.subarray(start, end);
    if (raw.length > 1_000_000) continue; // 폰트 파일 스트림은 콘텐츠가 아니므로 제외
    let s: string; try { s = zlib.inflateSync(raw).toString('latin1'); } catch { continue; }
    for (const t of s.matchAll(/<([0-9A-Fa-f]+)>\s*Tj/g)) {
      const hex = t[1];
      for (let i = 0; i + 4 <= hex.length; i += 4) codes.push(parseInt(hex.slice(i, i + 4), 16));
    }
  }
  return codes;
}

async function main() {
  const db = bootstrapSite(':memory:');

  // ── 표준 도록 데모 렌더 ───────────────────────────────────────────────────
  const { documentId } = seedCatalogDemo(db);
  const tree = loadDocumentTree(db, documentId)!;
  const bytes = await renderPdf(tree);

  checks.push(['renderPdf: Uint8Array 반환', bytes instanceof Uint8Array]);
  checks.push(['PDF 매직 헤더(%PDF-)', String.fromCharCode(...bytes.slice(0, 5)) === '%PDF-']);
  checks.push(['PDF 트레일러(%%EOF) 포함', Buffer.from(bytes).lastIndexOf('%%EOF') > 0]);
  // subset:false(한글 글리프 누락 방지)라 폰트 전체(NanumGothic ≈ 2MB)가 임베드됨 → 파일이 큼.
  // 글자 정상성을 위한 의도된 크기(자간/크기 최적화는 후속). 전체 폰트 임베드가 반영됐는지 확인.
  checks.push(['subset:false 전체 폰트 임베드 반영(>500KB)', bytes.length > 500_000]);

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

  // ── 빈 윤곽 글리프 회귀 가드(subset:true 같은 글리프 누락 검출) ──────────────
  // 도록 전체 텍스트를 renderPdf로 렌더한 뒤, (A) 원본 폰트가 각 한글 글자를 그릴 수 있는지,
  // (B) 실제 임베드된 폰트에서 그려진 글자들의 윤곽이 비어있지 않은지를 검사한다.
  const FULL_TEXT_LINES = [
    '봄 신상 도자기 컬렉션',
    '전통 기법으로 빚은 2026년 봄 신상 도자기를 소개합니다.',
    '청화백자 화병 · 높이 30cm',
    '제품 특징',
    '전통 가마 소성',
    '식기세척기 사용 가능',
    '1점 1점 수작업',
  ];
  const docT = createDocument(db, { kind: 'catalog', title: '윤곽 검사' });
  for (const line of FULL_TEXT_LINES) {
    createBlock(db, { documentId: docT.id, parentId: null, kind: 'paragraph', data: { text: line } });
  }
  const treeT = loadDocumentTree(db, docT.id)!;
  const bytesT = Buffer.from(await renderPdf(treeT));

  // (A) 원본 폰트 무결성 — 각 한글 글자가 .notdef가 아니고 실제 윤곽(획)이 있는지
  const origFont = fontkit.create(Buffer.from(loadKoreanFontBytes())) as unknown as {
    numGlyphs: number;
    glyphForCodePoint: (cp: number) => { id: number; path: { commands: unknown[] } };
    getGlyph: (gid: number) => { path: { commands: unknown[] } };
  };
  const hangul = [...FULL_TEXT_LINES.join('')].filter((c) => c >= '가' && c <= '힣');
  const origMissing = hangul.filter((ch) => {
    const g = origFont.glyphForCodePoint(ch.codePointAt(0)!);
    return g.id === 0 || g.path.commands.length === 0;
  });
  checks.push([`(A) 원본 폰트가 한글 ${hangul.length}자 모두 윤곽 보유`, origMissing.length === 0]);

  // (B) 임베드 폰트 윤곽 — 그려진 CID 중 윤곽이 빈 것은 공백 글리프뿐이어야 한다.
  // subset:false는 Identity 매핑(그려진 CID=원본 글리프 id)이라 공백 글리프 id를 제외 대상으로 삼는다.
  // subset:true 회귀 시엔 다수 CID가 빈 윤곽이 되어(공백 id와 무관) 이 검사가 실패한다.
  const spaceGid = origFont.glyphForCodePoint(0x20).id;
  const embTTF = extractEmbeddedTTF(bytesT);
  let embEmptyNonSpace = -1; // -1=추출 실패
  if (embTTF) {
    const embFont = fontkit.create(embTTF) as unknown as { numGlyphs: number; getGlyph: (gid: number) => { path: { commands: unknown[] } } };
    const cids = [...new Set(drawnCIDs(bytesT))].filter((c) => c > 0 && c < embFont.numGlyphs);
    embEmptyNonSpace = 0;
    for (const cid of cids) {
      if (cid === spaceGid) continue; // 공백은 윤곽 없는 게 정상
      let empty = true;
      try { empty = embFont.getGlyph(cid).path.commands.length === 0; } catch { empty = true; }
      if (empty) embEmptyNonSpace++;
    }
  }
  checks.push([`(B) 임베드 폰트: 그려진 글자의 빈 윤곽(공백 제외) 0개 [검출=${embEmptyNonSpace}]`, embEmptyNonSpace === 0]);

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
