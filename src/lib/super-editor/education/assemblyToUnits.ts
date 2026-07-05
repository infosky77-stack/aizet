// 조립 유닛 → 기존 EducationUnit 투영(순수) — 조립 회차(3·4·5편)의 카드·이북·게시·
// 학습화면·에이전트를 전부 무수정으로 재사용하기 위한 어댑터. 정지 매체(카드·이북)는
// 조립 "과정"이 아닌 "결과" 중심으로 표현된다(과정은 영상 몫 — assemblyScenes).
//
//   char            ← resultKo (완성 글자/단어/문장)
//   exampleKo       ← 부품 나열 "ㄱ + ㅏ" (조립 공식을 예시 줄로 노출)
//   example(번역)   ← meaning (결과 뜻)
//   illustrationRef ← imageRef (실사 이미지 — 게시 시 공개 사본 복사도 기존 경로)
//
// id는 'asm:' 접두 결정적 파생 — 재투영해도 같은 id라 삽화 캐시·게시 멱등성이 유지된다.

import type { AssemblyUnit, EducationSnapshot, EducationUnit } from './types';
import { isAssemblySnapshot } from './types';

export function assemblyToUnits(units: AssemblyUnit[]): EducationUnit[] {
  return units.map((u) => ({
    id: `asm:${u.id}`,
    char: u.resultKo.trim(),
    romanization: u.romanization.trim(),
    exampleKo: u.parts.map((p) => p.glyph.trim()).filter(Boolean).join(' + '),
    example: u.meaning,
    illustrationRef: u.imageRef,
    voiceRef: u.voiceRef,
  }));
}

/**
 * 회차의 "소비용 유닛" 해석 단일 진입점 — 조립 회차면 투영, 아니면 기존 units 그대로.
 * 카드·이북·게시 파생을 배선할 때(C·D단계) 이 함수 하나만 물리면 된다.
 */
export function resolveEpisodeUnits(snapshot: EducationSnapshot): EducationUnit[] {
  return isAssemblySnapshot(snapshot)
    ? assemblyToUnits(snapshot.assembly!.units)
    : snapshot.units;
}
