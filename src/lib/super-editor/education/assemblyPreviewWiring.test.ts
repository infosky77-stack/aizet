// 조립 미리보기 씬 배선(순수) 테스트 — mock measure·resolveBitmap 주입, 브라우저 비의존
// (기존 조립 테스트와 같은 방식: 순수 tsx 스크립트, checks 배열, process.exit)
import { buildPreviewScenes, type BitmapResolver } from './assemblyPreviewWiring';
import { newAssemblySnapshot, addUnit, setBackgroundRef } from './assemblyDocStore';
import { newAssemblyUnit } from './types';
import { ILLUSTRATION_SLOT, BACKGROUND_SLOT } from './cardLayout';

const checks: [string, boolean][] = [];

// mock 측정기(canvas 불필요) — 폭 근사
const measure = (text: string, sizePx: number) => text.length * sizePx * 0.6;

// mock 비트맵 해석기 — 'missing' ref만 null, 나머지는 태그 객체. 호출된 ref 기록
function makeResolver(): { resolve: BitmapResolver; calls: string[] } {
  const calls: string[] = [];
  const resolve: BitmapResolver = async (ref) => {
    calls.push(ref);
    if (ref === 'missing') return null;
    return { __ref: ref } as unknown as ImageBitmap;
  };
  return { resolve, calls };
}

// 유닛 2개: u1은 이미지 있음, u2는 imageRef null
const u1 = newAssemblyUnit({ id: 'u1', kind: 'syllable', resultKo: '가', romanization: 'ga', imageRef: 'img-1', parts: [{ glyph: 'ㄱ', pronunciation: 'ㄱ' }, { glyph: 'ㅏ', pronunciation: 'ㅏ' }] });
const u2 = newAssemblyUnit({ id: 'u2', kind: 'syllable', resultKo: '나', romanization: 'na', imageRef: null, parts: [{ glyph: 'ㄴ', pronunciation: 'ㄴ' }, { glyph: 'ㅏ', pronunciation: 'ㅏ' }] });
const base = addUnit(addUnit(newAssemblySnapshot(), u1), u2);

async function run() {
  // ── 기본 배선: 씬 개수·id 매칭·slots 조건부 ─────────────────────────────
  {
    const { resolve, calls } = makeResolver();
    const { scenes, baseSlots } = await buildPreviewScenes(base, measure, resolve);
    checks.push(['씬 2개 생성, id 순서 매칭', scenes.length === 2 && scenes[0].id === 'u1' && scenes[1].id === 'u2']);
    checks.push(['각 씬에 MotionScene 담김(durationSec>0, blocks 존재)',
      scenes.every((s) => s.scene.durationSec > 0 && Array.isArray(s.scene.blocks) && s.scene.blocks.length > 0)]);
    checks.push(['imageRef 있는 u1만 slots에 ILLUSTRATION_SLOT 채워짐',
      !!scenes[0].slots && (scenes[0].slots[ILLUSTRATION_SLOT] as unknown as { __ref: string }).__ref === 'img-1']);
    checks.push(['imageRef null인 u2는 slots 없음(생략)', scenes[1].slots === undefined]);
    checks.push(['배경 없으면 baseSlots 빈 객체', Object.keys(baseSlots).length === 0]);
    checks.push(['resolveBitmap은 이미지 있는 유닛만 호출(img-1 1회)', calls.length === 1 && calls[0] === 'img-1']);
  }

  // ── 배경 있음 → baseSlots에 BACKGROUND_SLOT ──────────────────────────────
  {
    const { resolve, calls } = makeResolver();
    const withBg = setBackgroundRef(base, 'bg-1');
    const { baseSlots } = await buildPreviewScenes(withBg, measure, resolve, { hasBackground: true });
    checks.push(['backgroundRef 있으면 baseSlots[BACKGROUND_SLOT] 채워짐',
      (baseSlots[BACKGROUND_SLOT] as unknown as { __ref: string })?.__ref === 'bg-1']);
    checks.push(['배경 ref도 resolveBitmap 호출됨', calls.includes('bg-1')]);
  }

  // ── hasBackground 옵션이 layoutAssemblyScene에 전달됨(배경 이미지 블록 등장) ──
  {
    const { resolve } = makeResolver();
    const withBg = setBackgroundRef(base, 'bg-1');
    const on = await buildPreviewScenes(withBg, measure, resolve, { hasBackground: true });
    const off = await buildPreviewScenes(withBg, measure, resolve, { hasBackground: false });
    const hasBgBlock = (s: typeof on.scenes[number]) =>
      s.scene.blocks.some((b) => b.block.kind === 'image' && b.block.slot === BACKGROUND_SLOT);
    checks.push(['hasBackground:true → 씬에 BACKGROUND_SLOT 이미지 블록', hasBgBlock(on.scenes[0])]);
    checks.push(['hasBackground:false → 배경 이미지 블록 없음', !hasBgBlock(off.scenes[0])]);
  }

  // ── 이미지 해석 실패(null) → slots 생략(빈 채로 넣지 않음) ─────────────────
  {
    const { resolve } = makeResolver();
    const uMissing = newAssemblyUnit({ id: 'um', kind: 'syllable', resultKo: '가', imageRef: 'missing', parts: [{ glyph: 'ㄱ', pronunciation: 'ㄱ' }, { glyph: 'ㅏ', pronunciation: 'ㅏ' }] });
    const snap = addUnit(newAssemblySnapshot(), uMissing);
    const { scenes } = await buildPreviewScenes(snap, measure, resolve);
    checks.push(['imageRef 있으나 비트맵 null이면 slots 생략', scenes[0].slots === undefined]);
  }

  // ── 배경 해석 실패(null) → BACKGROUND_SLOT 키는 있되 값 null ───────────────
  {
    const { resolve } = makeResolver();
    const snap = setBackgroundRef(base, 'missing');
    const { baseSlots } = await buildPreviewScenes(snap, measure, resolve, { hasBackground: true });
    checks.push(['배경 null 해석 시 baseSlots[BACKGROUND_SLOT] === null', BACKGROUND_SLOT in baseSlots && baseSlots[BACKGROUND_SLOT] === null]);
  }

  // ── 빈 스냅샷 → 빈 씬·빈 baseSlots ───────────────────────────────────────
  {
    const { resolve } = makeResolver();
    const { scenes, baseSlots } = await buildPreviewScenes(newAssemblySnapshot(), measure, resolve);
    checks.push(['유닛 없으면 scenes []·baseSlots {}', scenes.length === 0 && Object.keys(baseSlots).length === 0]);
  }

  // ── 원본 스냅샷 불변(배선은 읽기만) ──────────────────────────────────────
  {
    const { resolve } = makeResolver();
    const snap = setBackgroundRef(base, 'bg-1');
    const snapshot = JSON.stringify(snap);
    await buildPreviewScenes(snap, measure, resolve, { hasBackground: true });
    checks.push(['배선은 원본 스냅샷을 변형하지 않음', JSON.stringify(snap) === snapshot]);
  }

  let failed = 0;
  for (const [name, ok] of checks) { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}`); }
  console.log(`\n${checks.length - failed}/${checks.length} passed`);
  process.exit(failed === 0 ? 0 : 1);
}

run();
