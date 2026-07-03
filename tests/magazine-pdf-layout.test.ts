// buildMagazinePdf E2E(엔진 레벨) 확장 테스트 — 케이스별 페이지 수/경고 수를 검증.
import { readFileSync } from 'fs';
import { PDFDocument } from 'pdf-lib';

const fontBytes = readFileSync('/root/aizet/public/fonts/NotoSansKR.ttf');
globalThis.fetch = (async (url: unknown) => {
  if (typeof url === 'string' && url === '/fonts/NotoSansKR.ttf') return new Response(fontBytes);
  throw new Error('unexpected fetch: ' + url);
}) as typeof fetch;

type P = {
  id: string; kind: 'ad' | 'manuscript'; party_name: string; size_spec: string;
  page_no: number | null; slot: 'full' | 'half' | 'quarter' | null;
  sort_order: number | null; created_at: number; ledger_ref: string | null;
};
const base = { kind: 'ad' as const, size_spec: '', sort_order: null, ledger_ref: null };
let seq = 0;
const p = (over: Partial<P> & Pick<P, 'id' | 'page_no' | 'slot'>): P =>
  ({ ...base, party_name: over.id, created_at: ++seq, ...over } as P);

interface Case {
  name: string;
  placements: P[];
  expectPages: number;
  expectNotices: number;
}

const cases: Case[] = [
  {
    name: '전면(full) 단독 — 1페이지 독점, 경고 없음',
    placements: [p({ id: 'F1', page_no: 5, slot: 'full' })],
    expectPages: 1, expectNotices: 0,
  },
  {
    name: '1/2(half) × 2 — 한 페이지 상/하단 정확히 채움, 경고 없음',
    placements: [p({ id: 'H1', page_no: 5, slot: 'half' }), p({ id: 'H2', page_no: 5, slot: 'half' })],
    expectPages: 1, expectNotices: 0,
  },
  {
    name: '1/4(quarter) × 4 — 한 페이지 4칸 정확히 채움, 경고 없음',
    placements: [1, 2, 3, 4].map((n) => p({ id: `Q${n}`, page_no: 5, slot: 'quarter' })),
    expectPages: 1, expectNotices: 0,
  },
  {
    name: '혼합(1/2 + 1/4×2) — 한 페이지에 정확히 배치, 경고 없음',
    placements: [
      p({ id: 'H1', page_no: 5, slot: 'half' }),
      p({ id: 'Q1', page_no: 5, slot: 'quarter' }),
      p({ id: 'Q2', page_no: 5, slot: 'quarter' }),
    ],
    expectPages: 1, expectNotices: 0,
  },
  {
    name: '용량 초과(full + half + quarter 같은 페이지) — 연속 페이지 + 경고 2건',
    placements: [
      p({ id: 'F1', page_no: 12, slot: 'full' }),
      p({ id: 'H1', page_no: 12, slot: 'half' }),
      p({ id: 'Q1', page_no: 12, slot: 'quarter' }),
    ],
    expectPages: 2, expectNotices: 2,
  },
  {
    name: '미배치(page_no null / slot null) — 제외 + 경고, 배치분만 인쇄',
    placements: [
      p({ id: 'OK', page_no: 3, slot: 'quarter' }),
      p({ id: 'NoPage', page_no: null, slot: 'half' }),
      p({ id: 'NoSlot', page_no: 7, slot: null }),
    ],
    expectPages: 1, expectNotices: 2,
  },
  {
    name: '이미지 미연결(ledger_ref null) — 자리표시, 경고 없음',
    placements: [p({ id: 'NoImg', page_no: 1, slot: 'full' })],
    expectPages: 1, expectNotices: 0,
  },
  {
    name: '이미지 연결됐지만 원장에 없음 — 자리표시 대체 + 경고 1건',
    placements: [p({ id: 'Ghost', page_no: 1, slot: 'full', ledger_ref: 'ghost-entry' })],
    expectPages: 1, expectNotices: 1,
  },
  {
    name: '페이지 순서 — 12p·3p 입력 시 3p가 먼저(오름차순 2페이지)',
    placements: [
      p({ id: 'Late', page_no: 12, slot: 'full' }),
      p({ id: 'Early', page_no: 3, slot: 'full' }),
    ],
    expectPages: 2, expectNotices: 0,
  },
  {
    name: '확정 0건(빈 입력) — 안내 페이지 1장',
    placements: [],
    expectPages: 1, expectNotices: 0,
  },
];

import('../src/lib/super-editor/pdf/buildMagazinePdf').then(async ({ buildMagazinePdf }) => {
  let failed = 0;
  for (const c of cases) {
    const result = await buildMagazinePdf({ title: '테스트', placements: c.placements }, {});
    const doc = await PDFDocument.load(result.bytes);
    const pages = doc.getPageCount();
    const notices = result.notices.length;
    const pass = pages === c.expectPages && notices === c.expectNotices;
    if (!pass) failed++;
    console.log(
      `${pass ? 'PASS' : 'FAIL'} | ${c.name} | 페이지 ${pages}(기대 ${c.expectPages}) 경고 ${notices}(기대 ${c.expectNotices})`,
    );
    if (!pass) for (const n of result.notices) console.log('       -', n.label, '|', n.reason);
  }
  console.log(failed === 0 ? '\n✅ ALL PASS' : `\n❌ ${failed} FAILED`);
  process.exit(failed === 0 ? 0 : 1);
});
