// 조립 회차 문서(스냅샷) 관리(순수) 테스트 — 목록 조작·회차 메타·조회·불변성
// (기존 조립 테스트와 같은 방식: 순수 tsx 스크립트, checks 배열, process.exit)
import {
  newAssemblySnapshot, getUnits, findUnit, addUnit, removeUnit, moveUnit, replaceUnit,
  setEpisodeNo, setTitle, setBackgroundRef,
} from './assemblyDocStore';
import { newAssemblyUnit } from './types';
import { isEducationSnapshot, isAssemblySnapshot } from './types';

const checks: [string, boolean][] = [];
const ids = (snap: ReturnType<typeof newAssemblySnapshot>) => getUnits(snap).map((u) => u.id);

// ── newAssemblySnapshot ─────────────────────────────────────────────────────
const empty = newAssemblySnapshot();
checks.push(['newAssemblySnapshot: version 1, episodeNo 3', empty.version === 1 && empty.episodeNo === 3]);
checks.push(['newAssemblySnapshot: assembly.units [], units []', getUnits(empty).length === 0 && empty.units.length === 0]);
checks.push(['newAssemblySnapshot: title 기본 빈 문자열', empty.title === '']);
checks.push(['newAssemblySnapshot: 유효한 EducationSnapshot(비조립 상태)', isEducationSnapshot(empty) && !isAssemblySnapshot(empty)]);
checks.push(['newAssemblySnapshot: over로 메타 override', newAssemblySnapshot({ title: '3편', episodeNo: 5 }).title === '3편'
  && newAssemblySnapshot({ episodeNo: 5 }).episodeNo === 5]);

// ── addUnit ─────────────────────────────────────────────────────────────────
const u1 = newAssemblyUnit({ id: 'u1', resultKo: '가' });
const u2 = newAssemblyUnit({ id: 'u2', resultKo: '나' });
const s1 = addUnit(empty, u1);
const s2 = addUnit(s1, u2);
checks.push(['addUnit 2개 → length 2, 순서 유지', getUnits(s2).length === 2 && JSON.stringify(ids(s2)) === JSON.stringify(['u1', 'u2'])]);
checks.push(['addUnit: 원본 snapshot 불변', getUnits(empty).length === 0 && getUnits(s1).length === 1]);
checks.push(['addUnit 후 조립 회차로 판별됨', isAssemblySnapshot(s2)]);

// ── removeUnit ──────────────────────────────────────────────────────────────
const removed = removeUnit(s2, 'u1');
checks.push(['removeUnit(u1): u2만 남음', JSON.stringify(ids(removed)) === JSON.stringify(['u2'])]);
checks.push(['removeUnit: 없는 id면 동일 참조 반환', removeUnit(s2, 'nope') === s2]);
checks.push(['removeUnit: 원본 불변(2개 유지)', getUnits(s2).length === 2]);

// ── moveUnit ────────────────────────────────────────────────────────────────
const moved = moveUnit(s2, 0, 1);
checks.push(['moveUnit(0→1): 순서 뒤바뀜', JSON.stringify(ids(moved)) === JSON.stringify(['u2', 'u1'])]);
checks.push(['moveUnit: 범위 밖·동일 index면 동일 참조', moveUnit(s2, 0, 9) === s2 && moveUnit(s2, -1, 0) === s2 && moveUnit(s2, 1, 1) === s2]);
checks.push(['moveUnit: 원본 순서 불변', JSON.stringify(ids(s2)) === JSON.stringify(['u1', 'u2'])]);

// ── replaceUnit ─────────────────────────────────────────────────────────────
const u1edited = newAssemblyUnit({ id: 'u1', resultKo: '다' });
const replaced = replaceUnit(s2, u1edited);
checks.push(['replaceUnit: 같은 id 교체 반영', findUnit(replaced, 'u1')?.resultKo === '다']);
checks.push(['replaceUnit: 다른 유닛 영향 없음', findUnit(replaced, 'u2')?.resultKo === '나']);
checks.push(['replaceUnit: 없는 id면 동일 참조', replaceUnit(s2, newAssemblyUnit({ id: 'zzz' })) === s2]);
checks.push(['replaceUnit: 원본 불변(u1 여전히 "가")', findUnit(s2, 'u1')?.resultKo === '가']);

// ── 회차 메타 ────────────────────────────────────────────────────────────────
checks.push(['setEpisodeNo 반영', setEpisodeNo(s2, 4).episodeNo === 4]);
checks.push(['setTitle 반영', setTitle(s2, '글자 조립').title === '글자 조립']);
checks.push(['setBackgroundRef 설정/해제', setBackgroundRef(s2, 'bg1').backgroundRef === 'bg1'
  && setBackgroundRef(s2, null).backgroundRef === null]);
checks.push(['메타 변경 시 units 보존', getUnits(setTitle(s2, 'x')).length === 2]);
checks.push(['메타 변경: 원본 불변', s2.episodeNo === 3 && s2.title === '']);

// ── 조회 도우미 ──────────────────────────────────────────────────────────────
checks.push(['getUnits: assembly 없어도 안전(빈 배열)', getUnits({ version: 1, title: '', episodeNo: 1, units: [] }).length === 0]);
checks.push(['findUnit: 존재/부재', findUnit(s2, 'u2')?.id === 'u2' && findUnit(s2, 'none') === null]);

// ── assembly 없는 입력 안전성 ────────────────────────────────────────────────
const noAsm = { version: 1 as const, title: '', episodeNo: 1, units: [] };
const addedToNoAsm = addUnit(noAsm, u1);
checks.push(['assembly 미보유 입력에 addUnit → assembly:{units:[u1]} 생성', getUnits(addedToNoAsm).length === 1
  && !!addedToNoAsm.assembly && Array.isArray(addedToNoAsm.assembly.units)]);
checks.push(['assembly 미보유 입력 안전 조회', removeUnit(noAsm, 'x') === noAsm && moveUnit(noAsm, 0, 1) === noAsm]);

// ── snapshot.units(비조립 경로) 무접촉 ──────────────────────────────────────
const withOldUnits = newAssemblySnapshot({ units: [] });
checks.push(['비조립 units는 항상 빈 배열 유지', addUnit(withOldUnits, u1).units.length === 0]);

// ── 불변성 종합 ──────────────────────────────────────────────────────────────
const orig = addUnit(addUnit(newAssemblySnapshot(), u1), u2);
const snap = JSON.stringify(orig);
addUnit(orig, newAssemblyUnit({ id: 'x' }));
removeUnit(orig, 'u1');
moveUnit(orig, 0, 1);
replaceUnit(orig, newAssemblyUnit({ id: 'u1', resultKo: 'zz' }));
setEpisodeNo(orig, 9);
setTitle(orig, 'zzz');
setBackgroundRef(orig, 'bg');
checks.push(['불변성 종합: 전 함수 호출 후에도 원본 완전 동일', JSON.stringify(orig) === snap]);

let failed = 0;
for (const [name, ok] of checks) { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}`); }
console.log(`\n${checks.length - failed}/${checks.length} passed`);
process.exit(failed === 0 ? 0 : 1);
