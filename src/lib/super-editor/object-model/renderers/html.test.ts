// AIZET Object Model — 웹 HTML 렌더러 테스트
// (store.test.ts와 같은 방식: 순수 tsx 스크립트, checks 배열, 실패 시 process.exit(1))
import { writeFileSync } from 'fs';
import { bootstrapSite } from '../../../siteDb/siteDb';
import { createDocument, createBlock } from '../store';
import { loadDocumentTree } from '../model';
import { renderHtml } from './html';
import { wrapHtmlPage } from './pageShell';

const checks: [string, boolean][] = [];

// ── 도록 샘플 구성 ────────────────────────────────────────────────────────────
const db = bootstrapSite(':memory:');
const doc = createDocument(db, { kind: 'catalog', title: '봄 신상 도록' });

// 인라인 SVG data URI 플레이스홀더(원본 이미지 없이도 브라우저에서 보이는 자리표시)
const SVG_SRC = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='240'><rect width='100%' height='100%' fill='%23e7e2d9'/><text x='50%' y='50%' text-anchor='middle' fill='%23888'>청화백자</text></svg>";

createBlock(db, { documentId: doc.id, parentId: null, kind: 'heading',   data: { level: 1, text: '봄 신상 도자기 컬렉션' } });
createBlock(db, { documentId: doc.id, parentId: null, kind: 'paragraph', data: { text: '전통 기법으로 빚은 2026년 봄 신상 도자기를 소개합니다.' } });
createBlock(db, { documentId: doc.id, parentId: null, kind: 'image',     data: { src: SVG_SRC, alt: '청화백자 화병', caption: '청화백자 화병 · 높이 30cm' } });
createBlock(db, { documentId: doc.id, parentId: null, kind: 'heading',   data: { level: 2, text: '제품 특징' } });
const list = createBlock(db, { documentId: doc.id, parentId: null, kind: 'list', data: { ordered: false } });
createBlock(db, { documentId: doc.id, parentId: list.id, kind: 'list_item', data: { text: '손으로 빚은 유일한 형태' } });
createBlock(db, { documentId: doc.id, parentId: list.id, kind: 'list_item', data: { text: '1300도 고온 소성' } });
createBlock(db, { documentId: doc.id, parentId: list.id, kind: 'list_item', data: { text: '식기세척기 사용 가능' } });

// 이스케이프 검증용 — 날것 특수문자가 섞인 문단
const RAW = '가격 < 100 & 재고 > "0"';
createBlock(db, { documentId: doc.id, parentId: null, kind: 'paragraph', data: { text: RAW } });

// ── 렌더 ──────────────────────────────────────────────────────────────────────
const tree = loadDocumentTree(db, doc.id)!;
const html = renderHtml(tree);
db.close();

// ── 구조 단언 ─────────────────────────────────────────────────────────────────
checks.push(['h1(om-h1) + 제목 텍스트 포함',
  html.includes('<h1 class="om-h1">') && html.includes('봄 신상 도자기 컬렉션')]);
checks.push(['h2(om-h2) 포함', html.includes('<h2 class="om-h2">') && html.includes('제품 특징')]);

checks.push(['figure/img(alt)/figcaption 포함',
  html.includes('<figure class="om-figure">')
  && html.includes('<img class="om-img"')
  && html.includes('alt="청화백자 화병"')
  && html.includes('<figcaption class="om-caption">청화백자 화병 · 높이 30cm</figcaption>')]);

const liCount = (html.match(/<li class="om-li">/g) ?? []).length;
checks.push(['ul(om-list) 안에 li(om-li) 3개',
  html.includes('<ul class="om-list">') && liCount === 3]);

// 최상위 순서 보존: h1 < h2, image < h2
const idxH1  = html.indexOf('<h1 class="om-h1">');
const idxH2  = html.indexOf('<h2 class="om-h2">');
const idxImg = html.indexOf('<figure class="om-figure">');
checks.push(['순서 보존: h1이 h2보다 앞', idxH1 >= 0 && idxH2 >= 0 && idxH1 < idxH2]);
checks.push(['순서 보존: image가 h2보다 앞', idxImg >= 0 && idxImg < idxH2]);

// 이스케이프: 엔티티로 치환됐고, 날것 특수문자가 텍스트로 새어나오지 않음
checks.push(['이스케이프: &lt; &amp; &gt; &quot; 로 치환',
  html.includes('가격 &lt; 100 &amp; 재고 &gt; &quot;0&quot;')]);
checks.push(['이스케이프: 원문 날것(< 100 & / > "0") 미유출',
  !html.includes('< 100 &') && !html.includes('> "0"')]);

// unordered이므로 ol은 없어야 함
checks.push(['unordered → ol 없음', !html.includes('<ol')]);

// ── 미리보기 산출물(스크래치, 추적/커밋 안 됨) — 셸은 공용 wrapHtmlPage 재사용 ──
const PAGE = wrapHtmlPage(html, { lang: tree.document.lang, title: tree.document.title });

const PREVIEW_PATH = '/tmp/aizet-om-preview.html';
writeFileSync(PREVIEW_PATH, PAGE, 'utf8');

let failed = 0;
for (const [name, ok] of checks) { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}`); }
console.log(`\n${checks.length - failed}/${checks.length} passed`);
console.log(`미리보기 산출물: ${PREVIEW_PATH}`);
process.exit(failed === 0 ? 0 : 1);
