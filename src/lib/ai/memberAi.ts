// 회원 본인 API 키(제미나이) 기반 AI 클라이언트 — 가용성의 단일 소스 (서버 모듈 import 없음).
//
// AIZET의 AI 어시스트는 전부 "회원 본인 키"로 호출한다는 원칙이 있고, 그 연동 여부를
// 이 모듈 하나가 대표한다. 지점별 어시스트(aiRefine, shopAiAssist 등)는 available을
// 여기서 읽으므로, 키 연동이 붙는 날 이 모듈만 실제 구현으로 바꾸면 모든 지점의
// 버튼이 함께 살아난다.
//
// AI 원칙(절대 규칙): 모든 어시스트는 "제안(draft)"만 반환하고 DB에 직접 쓰지 않는다 —
// 확정은 반드시 회원이 UI에서 한다. 이 원칙을 우회하는 자동 확정 경로를 만들지 말 것.

export interface MemberAiStatus {
  readonly available: boolean;
  readonly unavailableReason?: string;
}

export const memberAi: MemberAiStatus = {
  available: false,
  unavailableReason: 'AI 어시스트는 회원 API 키(제미나이) 연동 후 제공됩니다',
};

// ── 지점 ④ 이미지 생성 — 인터페이스만(생성물은 파일 원장에 "후보"로 추가될 뿐,
//    섹션/썸네일 연결은 회원이 한다) ─────────────────────────────────────────
export interface AiImageRequest {
  /** 생성 프롬프트의 재료 — 상품명/컨셉 등 */
  prompt: string;
  /** 생성 이미지를 등록할 파일 원장(주문) id */
  orderId: string;
}

export interface AiImageGenerator extends MemberAiStatus {
  generateImage(req: AiImageRequest): Promise<{ ledgerRef: string }>;
}

export const aiImageGenerator: AiImageGenerator = {
  ...memberAi,
  async generateImage(): Promise<{ ledgerRef: string }> {
    throw new Error(memberAi.unavailableReason);
  },
};

// ── 지점 ⑤ 번역 초안 — 인터페이스만(초안은 화면에 제안될 뿐, 저장은 회원이 하고
//    검수(reviewed) 확정은 반드시 회원의 검수 버튼으로만 — product/i18n.ts 절대 규칙) ──
export interface AiTranslateRequest {
  /** 번역할 원문(ko) 텍스트 목록 — 같은 순서·같은 길이로 돌려받는다(빈 문자열 포함) */
  texts: string[];
  /** 대상 언어 — lib/i18n/types.ts Locale 중 ko 제외 */
  targetLocale: string;
  /** 문맥 힌트(선택) — 상품명/업종 등, 어투·용어 결정용 */
  context?: string;
}

export interface AiTranslator extends MemberAiStatus {
  /** 번역 "초안" 목록 반환 — 호출부는 반드시 draft 상태로만 저장할 것 */
  translateDraft(req: AiTranslateRequest): Promise<string[]>;
}

export const aiTranslator: AiTranslator = {
  ...memberAi,
  async translateDraft(): Promise<string[]> {
    throw new Error(memberAi.unavailableReason);
  },
};
