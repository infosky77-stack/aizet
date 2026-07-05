// 조립 회차 문서(스냅샷) 관리(순수) — 편집기가 AssemblyUnit 여러 개를 한 회차
// (EducationSnapshot)로 묶어 목록·메타·스냅샷 배선을 조작하는 불변 상태 함수 모음.
//
// 역할 경계: 개별 유닛의 필드 편집(결과·부품·뜻…)은 assemblyEditorStore 소관이라
// 여기서 재구현하지 않는다. 이 모듈은 "assembly.units 목록 + 회차 메타 + 스냅샷 형태"만.
// snapshot.units(비조립 경로)는 항상 빈 배열 그대로 두고 건드리지 않는다.
// 부작용 0, 원본 snapshot·배열 절대 불변.

import type { AssemblyUnit, EducationSnapshot } from './types';

/** 조립 회차 스냅샷 신규 — assembly.units 빈 배열, version 1, 비조립 units는 빈 배열 유지 */
export function newAssemblySnapshot(over: Partial<EducationSnapshot> = {}): EducationSnapshot {
  return {
    version: 1,
    title: '',
    episodeNo: 3, // 조립 첫 회차(3편)
    units: [],
    assembly: { units: [] },
    ...over,
  };
}

/** assembly.units 안전 조회 — assembly 없으면 빈 배열 */
export function getUnits(snap: EducationSnapshot): AssemblyUnit[] {
  return snap.assembly?.units ?? [];
}

export function findUnit(snap: EducationSnapshot, id: string): AssemblyUnit | null {
  return getUnits(snap).find((u) => u.id === id) ?? null;
}

/** 목록을 교체한 새 스냅샷 — 항상 assembly:{units:[...]} 형태 유지(원본 불변) */
function withUnits(snap: EducationSnapshot, units: AssemblyUnit[]): EducationSnapshot {
  return { ...snap, assembly: { ...snap.assembly, units } };
}

export function addUnit(snap: EducationSnapshot, unit: AssemblyUnit): EducationSnapshot {
  return withUnits(snap, [...getUnits(snap), unit]);
}

export function removeUnit(snap: EducationSnapshot, id: string): EducationSnapshot {
  const units = getUnits(snap);
  if (!units.some((u) => u.id === id)) return snap;
  return withUnits(snap, units.filter((u) => u.id !== id));
}

export function moveUnit(snap: EducationSnapshot, from: number, to: number): EducationSnapshot {
  const units = getUnits(snap);
  const n = units.length;
  if (from < 0 || from >= n || to < 0 || to >= n || from === to) return snap;
  const next = [...units];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return withUnits(snap, next);
}

export function replaceUnit(snap: EducationSnapshot, unit: AssemblyUnit): EducationSnapshot {
  const units = getUnits(snap);
  if (!units.some((u) => u.id === unit.id)) return snap;
  return withUnits(snap, units.map((u) => (u.id === unit.id ? unit : u)));
}

export function setEpisodeNo(snap: EducationSnapshot, n: number): EducationSnapshot {
  return { ...snap, episodeNo: n };
}

export function setTitle(snap: EducationSnapshot, title: string): EducationSnapshot {
  return { ...snap, title };
}

export function setBackgroundRef(snap: EducationSnapshot, ref: string | null): EducationSnapshot {
  return { ...snap, backgroundRef: ref };
}
