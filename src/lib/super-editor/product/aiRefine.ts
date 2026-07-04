// "AI 다듬기" — 인터페이스와 자리만 정의한다 (실 구현 없음, 서버 모듈 import 없음).
//
// 실제 다듬기(제미나이 호출)는 회원 API 키 연동이 붙을 때 이 인터페이스의 구현체로 교체된다.
// UI는 productAiRefiner.available만 보고 버튼 활성/비활성을 정하므로, 구현이 생겨도
// UI 코드는 바뀌지 않는다 — 가용성의 단일 소스는 lib/ai/memberAi.ts.

import { memberAi } from '@/lib/ai/memberAi';
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

export interface SuggestSectionsRequest {
  /** 상품명/짧은 소개 — 섹션 구성 초안의 재료 */
  title:       string;
  description: string;
}

export interface ProductAiRefiner {
  /** false면 UI가 버튼을 비활성화하고 unavailableReason을 툴팁으로 보여준다 */
  readonly available: boolean;
  readonly unavailableReason?: string;
  /** 지점 ② 카피 다듬기: 섹션 문구를 판매 카피로 */
  refine(req: AiRefineRequest): Promise<AiRefineResult>;
  /** 지점 ③ 섹션 초안: 상품 정보 → 섹션 구성 제안(미리보기 후 회원이 "적용") */
  suggestSections(req: SuggestSectionsRequest): Promise<AiRefineResult>;
}

/** 현재 구현 — 회원 API 키 연동 전이므로 비활성(가용성은 memberAi 단일 소스). */
export const productAiRefiner: ProductAiRefiner = {
  available: memberAi.available,
  unavailableReason: memberAi.unavailableReason,
  async refine(): Promise<AiRefineResult> {
    throw new Error(memberAi.unavailableReason);
  },
  async suggestSections(): Promise<AiRefineResult> {
    throw new Error(memberAi.unavailableReason);
  },
};
