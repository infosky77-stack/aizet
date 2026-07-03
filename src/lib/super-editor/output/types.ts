// 산출물 빌더 공용 계약 — 브라우저 로컬 생성 엔진들이 공유하는 입출력 형태 (로직 없음).
//
// 계약: 빌더는 (구조화 입력, 원장 entries) → Promise<OutputBuildResult> 형태의 순수 함수다.
//   - bytes: 완성된 산출물 바이트(PDF/mp4/...)
//   - notices: 결과에서 빠졌거나 대체된 항목의 보고 — 조용히 누락시키지 않는 것이 계약의 핵심
// 구현: pdf/buildMagazinePdf(조판 PDF), video/buildVideoMp4(영상, durationSec 확장).
// 향후 3D플립북·제품상세 등 새 산출물도 이 계약을 구현하면 OutputPreviewOverlay 골격과
// "생성 버튼" 패턴을 그대로 재사용할 수 있다.

export interface OutputNotice {
  /** 원인 항목의 도메인 id(placement id, scene id 등) — 로그/추적용, UI는 안 씀 */
  refId?: string;
  /** 사람이 읽는 항목 표시(예: "광고 · 한빛한의원", "클립 · intro.mp4") */
  label: string;
  reason: string;
}

export interface OutputBuildResult {
  bytes:   Uint8Array;
  notices: OutputNotice[];
}
