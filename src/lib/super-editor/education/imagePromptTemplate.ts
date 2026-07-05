// 뜻 이미지 생성 프롬프트 템플릿(순수) — 비용 0·API 호출 0. 제작자가 이 문구를 복사해
// 외부 이미지 생성기(예: Google AI Studio)에 붙여 뜻 실사 이미지를 만든 뒤, 파일 관리에
// 업로드해 유닛에 연결하는 "직접 생성·업로드" 흐름용. 자동 생성 배선(회원 키·게이트)과는
// 무관하다.
//
// 핵심 규칙: "문자·글자 없음"을 반드시 포함한다 — 삽화에 한글이 들어가면 깨지고, 학습
// 화면에선 글자를 코드가 직접 얹으므로 그림엔 글자가 없어야 한다(cardLayout 원칙과 동일).

import type { AssemblyUnit } from './types';

export function buildImagePrompt(unit: AssemblyUnit): string {
  const resultKo = unit.resultKo.trim();
  if (!resultKo) return '';
  return `실사 사진 스타일, "${resultKo}" 한 가지 사물/장면만 또렷하게, 흰색 단색 배경, `
    + `문자·글자·로고 전혀 없음, 정면 중앙 구도, 밝고 선명하게`;
}
