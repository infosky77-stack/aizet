// "AI 다듬기" — 인터페이스와 자리만 정의한다 (실 구현 없음, 서버 모듈 import 없음).
//
// 실제 다듬기(제미나이 호출)는 회원 API 키 연동이 붙을 때 이 인터페이스의 구현체로 교체된다.
// UI는 productAiRefiner.available만 보고 버튼 활성/비활성을 정하므로, 구현이 생겨도
// UI 코드는 바뀌지 않는다 — 교체 지점은 아래 productAiRefiner 상수 하나뿐이다.

import type { ProductSection } from './types';

export interface AiRefineRequest {
  /** 콘텐츠 제목(제품명) — 프롬프트 문맥용 */
  title:    string;
  sections: ProductSection[];
}

export interface AiRefineResult {
  /** 문구가 다듬어진 섹션 목록 — id/kind/ledgerRef는 보존되고 텍스트 필드만 바뀐다 */
  sections: ProductSection[];
  /** 무엇을 어떻게 고쳤는지의 한 줄 요약(UI 표시용) */
  summary:  string;
}

export interface ProductAiRefiner {
  /** false면 UI가 버튼을 비활성화하고 unavailableReason을 툴팁으로 보여준다 */
  readonly available: boolean;
  readonly unavailableReason?: string;
  refine(req: AiRefineRequest): Promise<AiRefineResult>;
}

/** 현재 구현 — 회원 API 키 연동 전이므로 항상 비활성. 연동 시 이 상수만 교체한다. */
export const productAiRefiner: ProductAiRefiner = {
  available: false,
  unavailableReason: 'AI 다듬기는 회원 API 키 연동 후 제공됩니다',
  async refine(): Promise<AiRefineResult> {
    throw new Error('AI 다듬기는 회원 API 키 연동 후 제공됩니다');
  },
};
