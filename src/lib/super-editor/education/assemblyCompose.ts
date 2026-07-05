// 조립 입력 분해 도우미(순수) — 편집 UI(C단계)가 제작자의 "결과 문자열" 입력을 받아
// AssemblyUnit.parts[]를 자동 생성한다. 부작용 0(DOM·상태·네트워크 없음), 조립만 담당.
//
// kind별 분해 규칙:
//   - syllable(3편): 완성 글자 1자 → 자모 부품. decomposeSyllable(cho/jung/jong)을 각
//     AssemblyPart로. jong이 null이면 종성 부품 없음. 완성 음절이 아니면 빈 배열(호출부 검증).
//   - word(4편): 음절 단위(한글은 음절=코드포인트 1개)로 나눠 각 음절이 부품 하나.
//   - sentence(5편): 공백 기준 어절 단위로 나눠 각 어절이 부품 하나.
//
// 발음(pronunciation)은 우선 glyph와 동일하게 채운다 — 편집기에서 이후 수정 가능한 초안.

import type { AssemblyKind, AssemblyPart, AssemblyUnit } from './types';
import { newAssemblyUnit } from './types';
import { decomposeSyllable } from './assemblyScenes';

/** glyph 하나로 AssemblyPart 생성 — 발음은 glyph 초안값 */
function part(glyph: string): AssemblyPart {
  return { glyph, pronunciation: glyph };
}

export function partsFromResult(kind: AssemblyKind, resultKo: string): AssemblyPart[] {
  const result = resultKo.trim();
  if (!result) return [];

  if (kind === 'syllable') {
    // 완성 글자 1자를 초·중·종성 자모로 — 음절이 아니면 빈 배열(호출부가 검증)
    const d = decomposeSyllable(result.charAt(0));
    if (!d) return [];
    const glyphs = [d.cho, d.jung, ...(d.jong ? [d.jong] : [])];
    return glyphs.map(part);
  }

  if (kind === 'word') {
    // 음절 단위 — 한글 음절은 코드포인트 1개. 공백은 부품에서 제외
    return Array.from(result)
      .map((ch) => ch.trim())
      .filter(Boolean)
      .map(part);
  }

  // sentence — 공백 기준 어절
  return result.split(/\s+/).filter(Boolean).map(part);
}

export function buildAssemblyUnit(kind: AssemblyKind, resultKo: string): AssemblyUnit {
  return newAssemblyUnit({ kind, resultKo, parts: partsFromResult(kind, resultKo) });
}
