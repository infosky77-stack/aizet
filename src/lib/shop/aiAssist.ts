// 쇼핑몰 판매자용 "AI 어시스트" — 인터페이스와 자리만 정의 (실 구현 없음).
//
// aiRefine.ts(제품상세)와 같은 패턴: UI는 available만 보고 버튼을 비활성화하므로
// 회원 API 키(제미나이) 연동이 붙을 때 아래 상수 구현만 교체하면 된다.
// 가용성의 단일 소스는 lib/ai/memberAi.ts.
// AI 원칙(절대 규칙): 모든 어시스트는 "제안(draft)"만 반환한다 — 이 모듈의 어떤
// 결과도 DB에 직접 쓰이지 않고, 반드시 회원이 입력칸에서 확인·수정 후 저장한다.

import { memberAi } from '@/lib/ai/memberAi';

export interface ProductDraftRequest {
  /** 원장에 올린 상품 사진의 표시 URL 목록 — 이미지 기반 제안의 입력 */
  imageUrls: string[];
  /** 회원이 이미 입력한 값(있으면 존중하고 빈칸만 제안) */
  name?:        string;
  description?: string;
}

export interface ProductDraftSuggestion {
  name:        string;
  category:    string;
  description: string;
}

export interface CopyRefineRequest {
  productName: string;
  /** 회원이 대충 쓴 설명 원문 */
  rough: string;
}

export interface CopyRefineSuggestion {
  /** 판매 카피로 다듬어진 제안문 — 원문과 나란히 보여주고 회원이 "적용"해야 반영 */
  refined: string;
}

export interface ShopAiAssist {
  /** false면 UI가 버튼을 비활성화하고 unavailableReason을 툴팁으로 보여준다 */
  readonly available: boolean;
  readonly unavailableReason?: string;
  /** 지점 ① 상품 등록: 사진 → 상품명/카테고리/설명 초안 */
  suggestProductDraft(req: ProductDraftRequest): Promise<ProductDraftSuggestion>;
  /** 지점 ② 카피 다듬기: 대충 쓴 설명 → 판매 카피 */
  refineCopy(req: CopyRefineRequest): Promise<CopyRefineSuggestion>;
}

/** 현재 구현 — 회원 API 키 연동 전이므로 비활성(가용성은 memberAi 단일 소스). */
export const shopAiAssist: ShopAiAssist = {
  available: memberAi.available,
  unavailableReason: memberAi.unavailableReason,
  async suggestProductDraft(): Promise<ProductDraftSuggestion> {
    throw new Error(memberAi.unavailableReason);
  },
  async refineCopy(): Promise<CopyRefineSuggestion> {
    throw new Error(memberAi.unavailableReason);
  },
};
