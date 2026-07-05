// 조립 편집 상태 관리(순수) — 편집기가 AssemblyUnit 하나를 조작하는 불변 리듀서 모음.
// React·DOM·네트워크 없이 "현재 unit + 조작 → 새 unit"만 반환한다(원본 인자 절대 불변).
//
// 입력 분해는 assemblyCompose(buildAssemblyUnit)를 재사용한다 — 분해 규칙 중복 작성 금지.
// 결과·kind 변경은 parts를 자동 재생성하되, 제작자가 이미 채운 id·meaning·이미지·음성
// 참조는 보존한다(자동 분해는 parts만 다시 만든다).

import type { AssemblyKind, AssemblyPart, AssemblyUnit, StudyLang } from './types';
import { buildAssemblyUnit } from './assemblyCompose';

/** kind·resultKo로 parts를 재생성하되 기존 unit의 식별·메타(id·meaning·참조)는 유지 */
function regenerate(unit: AssemblyUnit, kind: AssemblyKind, resultKo: string): AssemblyUnit {
  const fresh = buildAssemblyUnit(kind, resultKo);
  return {
    ...unit,
    kind,
    resultKo,
    parts: fresh.parts,
  };
}

export function setResult(unit: AssemblyUnit, resultKo: string): AssemblyUnit {
  return regenerate(unit, unit.kind, resultKo);
}

export function setKind(unit: AssemblyUnit, kind: AssemblyKind): AssemblyUnit {
  return regenerate(unit, kind, unit.resultKo);
}

export function updatePart(unit: AssemblyUnit, index: number, over: Partial<AssemblyPart>): AssemblyUnit {
  if (index < 0 || index >= unit.parts.length) return unit;
  const parts = unit.parts.map((p, i) => (i === index ? { ...p, ...over } : p));
  return { ...unit, parts };
}

export function movePart(unit: AssemblyUnit, from: number, to: number): AssemblyUnit {
  const n = unit.parts.length;
  if (from < 0 || from >= n || to < 0 || to >= n || from === to) return unit;
  const parts = [...unit.parts];
  const [moved] = parts.splice(from, 1);
  parts.splice(to, 0, moved);
  return { ...unit, parts };
}

export function removePart(unit: AssemblyUnit, index: number): AssemblyUnit {
  if (index < 0 || index >= unit.parts.length) return unit;
  return { ...unit, parts: unit.parts.filter((_, i) => i !== index) };
}

export function addPart(unit: AssemblyUnit, part: AssemblyPart): AssemblyUnit {
  return { ...unit, parts: [...unit.parts, { ...part }] };
}

export function setMeaning(unit: AssemblyUnit, lang: StudyLang, text: string): AssemblyUnit {
  return { ...unit, meaning: { ...unit.meaning, [lang]: text } };
}

export function setImageRef(unit: AssemblyUnit, ref: string | null): AssemblyUnit {
  return { ...unit, imageRef: ref };
}

export function setVoiceRef(unit: AssemblyUnit, ref: string | null): AssemblyUnit {
  return { ...unit, voiceRef: ref };
}
