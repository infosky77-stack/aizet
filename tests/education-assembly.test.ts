// 조립 학습(순수 계층) 테스트 — 모션 보간 / 음절 분해 / 공식 나열 장면 파생 / 투영 / 스냅샷 호환
//
// 장면 문법(확정): [ㄱ] [+] [ㅏ] [→] [가] 가로 한 줄 나열 — 부품과 완성이 서로 다른
// x 구간을 차지해 겹침이 물리적으로 불가능하다. 핵심 검증은 "전 요소 x 구간 상호 분리".
import {
  blocksAtTime, easeInOutCubic, applyAlphaToColor,
  type MotionScene,
} from '../src/lib/super-editor/compose/motion';
import {
  decomposeSyllable, layoutAssemblyScene, assemblySceneCues, isUsableAssemblyUnit,
  assemblyTimeline, PART_STEP_SEC, PLUS_SEC, ARROW_SEC, POP_SEC, HOLD_SEC, FADE_SEC,
} from '../src/lib/super-editor/education/assemblyScenes';
import { assemblyToUnits, resolveEpisodeUnits } from '../src/lib/super-editor/education/assemblyToUnits';
import {
  isEducationSnapshot, newAssemblyUnit, newEducationUnit, isAssemblySnapshot,
  type AssemblyUnit, type EducationSnapshot,
} from '../src/lib/super-editor/education/types';
import { episode1Preset } from '../src/lib/super-editor/education/preset';
import { SCENE_W_PX, SCENE_H_PX } from '../src/lib/super-editor/education/cardLayout';

const checks: [string, boolean][] = [];
// 폭 근사 측정기 주입(cardLayout 테스트와 같은 방식) — Canvas 불필요
const measure = (text: string, sizePx: number) => text.length * sizePx * 0.62;

// ── 모션 보간(motion.ts) ─────────────────────────────────────────────────────
checks.push(['easing 경계 e(0)=0, e(1)=1, e(0.5)=0.5', easeInOutCubic(0) === 0 && easeInOutCubic(1) === 1 && Math.abs(easeInOutCubic(0.5) - 0.5) < 1e-9]);

const mScene: MotionScene = {
  durationSec: 2,
  blocks: [
    { block: { kind: 'text', text: 'ㄱ', x: 100, y: 100, fontSizePx: 100, bold: true, color: '#1d4ed8' },
      keyframes: [{ atSec: 0, x: 100 }, { atSec: 1, x: 500 }], easing: 'linear' },
    { block: { kind: 'rect', x: 0, y: 0, w: 100, h: 100, color: '#ffffff' }, keyframes: [] },
    { block: { kind: 'text', text: '가', x: 0, y: 0, fontSizePx: 200, bold: true, color: '#000000' },
      keyframes: [{ atSec: 1, alpha: 0, scale: 0.5 }, { atSec: 2, alpha: 1, scale: 1 }], easing: 'linear', fromSec: 1 },
  ],
};
const at0 = blocksAtTime(mScene, 0);
const at05 = blocksAtTime(mScene, 0.5);
const at15 = blocksAtTime(mScene, 1.5);
const at3 = blocksAtTime(mScene, 3);
checks.push(['t=0: fromSec 밖 블록 제외(2개만)', at0.length === 2]);
checks.push(['키프레임 없는 블록은 원본 그대로(정지)', JSON.stringify(at0[1]) === JSON.stringify(mScene.blocks[1].block)]);
checks.push(['선형 중간값 보간 x=300', at05[0].kind === 'text' && at05[0].x === 300]);
checks.push(['구간 밖(뒤)은 마지막 값 고정 x=500', at3[0].kind === 'text' && at3[0].x === 500]);
checks.push(['fromSec 이후 등장 + alpha 색 굽기', at15.length === 3 && at15[2].kind === 'text' && at15[2].color === 'rgba(0,0,0,0.5)']);
checks.push(['scale은 fontSizePx 배율(t=1.5 → 0.75배=150)', at15[2].kind === 'text' && at15[2].fontSizePx === 150]);

const rectScale = blocksAtTime({
  durationSec: 1,
  blocks: [{ block: { kind: 'rect', x: 100, y: 100, w: 200, h: 100, color: '#fff' }, keyframes: [{ atSec: 0, scale: 0.5 }], easing: 'linear' }],
}, 0)[0];
checks.push(['rect scale은 중심 고정(x 150, w 100)', rectScale.kind === 'rect' && rectScale.x === 150 && rectScale.w === 100 && rectScale.y === 125 && rectScale.h === 50]);

checks.push(['alpha 색 굽기: #rgb 축약형', applyAlphaToColor('#fff', 0.5) === 'rgba(255,255,255,0.5)']);
checks.push(['alpha 색 굽기: rgba 기존 알파에 곱', applyAlphaToColor('rgba(10,20,30,0.8)', 0.5) === 'rgba(10,20,30,0.4)']);
checks.push(['alpha 1은 원본 유지 / 미지 형식은 무손상', applyAlphaToColor('#1d4ed8', 1) === '#1d4ed8' && applyAlphaToColor('tomato', 0.5) === 'tomato']);

// ── 음절 분해(C단계 자동 분해용 산수) ───────────────────────────────────────
const ga = decomposeSyllable('가');
const bang = decomposeSyllable('방');
checks.push(['가 → ㄱ+ㅏ(받침 없음)', !!ga && ga.cho === 'ㄱ' && ga.jung === 'ㅏ' && ga.jong === null]);
checks.push(['방 → ㅂ+ㅏ+ㅇ', !!bang && bang.cho === 'ㅂ' && bang.jung === 'ㅏ' && bang.jong === 'ㅇ']);
checks.push(['음절 아님(자모·라틴) → null', decomposeSyllable('ㄱ') === null && decomposeSyllable('a') === null && decomposeSyllable('') === null]);

// ── 타임라인 산수 ────────────────────────────────────────────────────────────
const tl2 = assemblyTimeline(2);
checks.push(['타임라인(2부품): 부품→+→화살표→완성 순서', tl2.partAtSec[0] === 0 && tl2.partAtSec[1] === PART_STEP_SEC
  && tl2.plusAtSec === 2 * PART_STEP_SEC && tl2.arrowAtSec === tl2.plusAtSec + PLUS_SEC
  && tl2.resultAtSec === tl2.arrowAtSec + ARROW_SEC
  && tl2.durationSec === tl2.resultAtSec + POP_SEC + HOLD_SEC]);
const tl3 = assemblyTimeline(3);
checks.push(['타임라인(3부품): 부품 수만큼 늘어남', tl3.resultAtSec === tl2.resultAtSec + PART_STEP_SEC]);

// ── 공식 나열 장면(syllable ㄱ+ㅏ→가) ───────────────────────────────────────
const gaUnit: AssemblyUnit = newAssemblyUnit({
  kind: 'syllable',
  parts: [{ glyph: 'ㄱ', pronunciation: '그' }, { glyph: 'ㅏ', pronunciation: '아' }],
  resultKo: '가', romanization: 'ga',
  meaning: { en: 'ga', zh: 'ga', ja: 'ga', vi: 'ga' },
});
const gaScene = layoutAssemblyScene(gaUnit, measure, { unitIndex: 0, hasBackground: true });
checks.push(['장면 길이 = 타임라인 산수', gaScene.durationSec === tl2.durationSec]);

type TextBlock = Extract<ReturnType<typeof blocksAtTime>[number], { kind: 'text' }>;
const texts = (scene: MotionScene, t: number) => blocksAtTime(scene, t).filter((b) => b.kind === 'text') as TextBlock[];
const find = (list: TextBlock[], text: string) => list.find((b) => b.text === text);

// 순차 등장: ㄱ(발음) → ㅏ(발음) → + → → → 가 팝
const t1 = texts(gaScene, tl2.partAtSec[0] + FADE_SEC + 0.01);
checks.push(['등장 1: ㄱ+발음 라벨만(ㅏ·+·→·가 없음)', !!find(t1, 'ㄱ') && !!find(t1, '“그”')
  && !find(t1, 'ㅏ') && !find(t1, '+') && !find(t1, '→') && !find(t1, '가')]);
const t2 = texts(gaScene, tl2.partAtSec[1] + FADE_SEC + 0.01);
checks.push(['등장 2: ㅏ+발음 라벨 추가, 기호는 아직', !!find(t2, 'ㅏ') && !!find(t2, '“아”') && !find(t2, '+')]);
const t3 = texts(gaScene, tl2.plusAtSec + FADE_SEC + 0.01);
checks.push(['등장 3: + 기호(화살표·완성은 아직)', !!find(t3, '+') && !find(t3, '→') && !find(t3, '가')]);
const t4 = texts(gaScene, tl2.arrowAtSec + FADE_SEC + 0.01);
checks.push(['등장 4: 화살표(완성은 아직)', !!find(t4, '→') && !find(t4, '가')]);

// 완성 팝 — 완성만 스케일 바운스, 피크 1.08배
const tEnd = texts(gaScene, gaScene.durationSec - 0.1);
const endResult = find(tEnd, '가');
const popPeak = find(texts(gaScene, tl2.resultAtSec + POP_SEC * 0.6), '가');
checks.push(['팝: 완성 바운스 피크 1.08배 → 최종 원배율', !!endResult && !!popPeak
  && popPeak.fontSizePx === Math.round(endResult.fontSizePx * 1.08) && popPeak.color === '#1d4ed8']);
const popPeakPart = find(texts(gaScene, tl2.resultAtSec + POP_SEC * 0.6), 'ㄱ');
const partAtEnd = find(tEnd, 'ㄱ');
checks.push(['팝: 부품은 바운스 없음(크기 불변)', !!popPeakPart && !!partAtEnd && popPeakPart.fontSizePx === partAtEnd.fontSizePx]);

// ★핵심: 겹침 물리적 불가 — 전 요소가 서로 다른 x 구간(상호 분리)
const rowOf = (list: TextBlock[], names: string[]) => names.map((n) => {
  const b = find(list, n)!;
  const w = measure(b.text, b.fontSizePx);
  return { name: n, left: b.x - w / 2, right: b.x + w / 2 };
});
const gaRow = rowOf(tEnd, ['ㄱ', '+', 'ㅏ', '→', '가']);
const disjointInOrder = gaRow.every((seg, i) => i === 0 || seg.left > gaRow[i - 1].right);
checks.push(['겹침 불가: 전 요소 x 구간이 순서대로 상호 분리', disjointInOrder]);
checks.push(['행이 판 안에 들어옴', gaRow[0].left >= SCENE_W_PX * 0.06 && gaRow[gaRow.length - 1].right <= SCENE_W_PX * 0.94]);

// 공식 잔존: 끝 시각에도 부품·기호·완성·발음·로마자 전부 표시
checks.push(['공식 전체 잔존(부품·기호·발음·로마자)', ['ㄱ', '+', 'ㅏ', '→', '가', '“그”', '“아”', 'ga']
  .every((n) => !!find(tEnd, n))]);
// 행 세로 중앙 정렬: 부품·완성의 세로 중심이 같다(top + fontPx/2)
const cG = find(tEnd, 'ㄱ')!, cR = find(tEnd, '가')!;
checks.push(['행 세로 중앙 정렬(부품·완성 중심 일치)', Math.abs((cG.y + cG.fontSizePx / 2) - (cR.y + cR.fontSizePx / 2)) < 1]);

// ── word(가+방→가방, 실사 이미지) ───────────────────────────────────────────
const bagUnit = newAssemblyUnit({
  kind: 'word',
  parts: [{ glyph: '가', pronunciation: '가' }, { glyph: '방', pronunciation: '방' }],
  resultKo: '가방', romanization: 'gabang',
  meaning: { en: 'bag', zh: '包', ja: 'かばん', vi: 'túi xách' },
  imageRef: 'ledger-file-id-1',
});
const bagScene = layoutAssemblyScene(bagUnit, measure, { unitIndex: 1 });
const bagTl = assemblyTimeline(2);
const bagEnd = texts(bagScene, bagScene.durationSec - 0.1);
const bagRow = rowOf(bagEnd, ['가', '+', '방', '→', '가방']);
checks.push(['word: 같은 나열 문법(x 구간 상호 분리)', bagRow.every((seg, i) => i === 0 || seg.left > bagRow[i - 1].right)]);
checks.push(['word(이미지): 행이 좌측으로 양보', bagRow[bagRow.length - 1].right < SCENE_W_PX * 0.62]);
const bagImgsBefore = blocksAtTime(bagScene, bagTl.resultAtSec - 0.01).filter((b) => b.kind === 'image');
const bagImgsAfter = blocksAtTime(bagScene, bagTl.resultAtSec + 0.01).filter((b) => b.kind === 'image');
checks.push(['word: 실사 이미지는 완성과 함께 등장', bagImgsBefore.length === 0
  && bagImgsAfter.some((b) => b.kind === 'image' && b.fit === 'contain')]);

// ── sentence — 긴 문장도 같은 문법 + 판 폭에 맞게 동비율 축소 ───────────────
const sentScene = layoutAssemblyScene(newAssemblyUnit({
  kind: 'sentence',
  parts: [{ glyph: '가방을', pronunciation: '' }, { glyph: '메요', pronunciation: '' }],
  resultKo: '가방을 메요', romanization: 'gabang-eul meyo',
}), measure);
const sentEnd = texts(sentScene, sentScene.durationSec - 0.1);
const sentRow = rowOf(sentEnd, ['가방을', '+', '메요', '→', '가방을 메요']);
checks.push(['sentence: 나열 순서 유지 + 판 안에 수납', sentRow.every((seg, i) => i === 0 || seg.left > sentRow[i - 1].right)
  && sentRow[0].left >= SCENE_W_PX * 0.06 && sentRow[sentRow.length - 1].right <= SCENE_W_PX * 0.94]);

// 3부품(ㅂ+ㅏ+ㅇ→방) — 부품 수 확장에도 같은 문법
const bang3Scene = layoutAssemblyScene(newAssemblyUnit({
  kind: 'syllable',
  parts: [{ glyph: 'ㅂ', pronunciation: '브' }, { glyph: 'ㅏ', pronunciation: '아' }, { glyph: 'ㅇ', pronunciation: '응' }],
  resultKo: '방', romanization: 'bang',
}), measure);
const bang3End = texts(bang3Scene, bang3Scene.durationSec - 0.1);
checks.push(['3부품: + 기호 2개, 전 요소 잔존', bang3End.filter((b) => b.text === '+').length === 2
  && ['ㅂ', 'ㅏ', 'ㅇ', '→', '방'].every((n) => !!find(bang3End, n))]);

// ── 자막 큐 — 장면과 같은 산수 ──────────────────────────────────────────────
const cues = assemblySceneCues(bagUnit, 10);
checks.push(['큐: 전 언어 2개, 경계=완성 등장, 끝=장면 길이', cues.ko.length === 2 && cues.en.length === 2
  && cues.ko[0].startSec === 10 && cues.ko[0].endSec === 10 + bagTl.resultAtSec
  && cues.ko[1].endSec === 10 + bagTl.durationSec]);
checks.push(['큐: ko는 결과+로마자, 외국어는 뜻 첨부', cues.ko[1].text === '가방 (gabang)' && cues.en[1].text === '가방 (gabang) — bag']);

// ── 유닛 가드 ────────────────────────────────────────────────────────────────
checks.push(['가드: 부품 2개+결과 있어야 사용 가능', isUsableAssemblyUnit(gaUnit)
  && !isUsableAssemblyUnit(newAssemblyUnit({ resultKo: '가' }))
  && !isUsableAssemblyUnit(newAssemblyUnit({ kind: 'syllable', parts: [{ glyph: 'ㄱ', pronunciation: '' }], resultKo: '가' }))]);

// ── 투영(assemblyToUnits) + 스냅샷 v1 호환 ──────────────────────────────────
const projected = assemblyToUnits([gaUnit, bagUnit]);
checks.push(['투영: char=결과, exampleKo=조립 공식', projected[0].char === '가' && projected[0].exampleKo === 'ㄱ + ㅏ'
  && projected[1].char === '가방' && projected[1].exampleKo === '가 + 방']);
checks.push(['투영: imageRef→illustrationRef, meaning→example', projected[1].illustrationRef === 'ledger-file-id-1'
  && projected[1].example.en === 'bag']);
checks.push(['투영: id 결정적(asm: 접두) — 재투영해도 동일', projected[0].id === `asm:${gaUnit.id}`
  && assemblyToUnits([gaUnit])[0].id === projected[0].id]);

const asmSnapshot: EducationSnapshot = {
  version: 1, title: '3분 한국어 3편 — 글자 조립', episodeNo: 3,
  units: [newEducationUnit({ char: '?' })], // 조립 회차에서 units는 무시(투영이 우선)
  assembly: { units: [gaUnit] },
};
checks.push(['v1 가드: assembly 있어도 통과(옵션 필드 관례)', isEducationSnapshot(asmSnapshot)]);
checks.push(['v1 가드: 기존 1편 프리셋 그대로 통과(호환)', isEducationSnapshot(episode1Preset()) && !isAssemblySnapshot(episode1Preset())]);
checks.push(['resolveEpisodeUnits: 조립 회차는 투영, 일반 회차는 units', resolveEpisodeUnits(asmSnapshot)[0].char === '가'
  && resolveEpisodeUnits(episode1Preset())[0].char === 'ㅏ']);

let failed = 0;
for (const [name, ok] of checks) { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}`); }
console.log(`\n${checks.length - failed}/${checks.length} passed`);
process.exit(failed === 0 ? 0 : 1);
