// 미수금(관리) 자리표시 — 실제 로직 없음.
//
// 지금은 미수금 모듈 자체가 존재하지 않는다. 이 함수는 placements 관련 코드가 미수금
// 상태를 물어볼 수 있는 유일한 접합부(seam)로 미리 만들어둔 것 — 나중에 실제 미수금/
// 청구 모듈이 생기면 이 파일의 구현만 갈아끼우면 되고, 호출하는 쪽(향후 placements
// 목록 UI 등)은 전혀 바뀌지 않는다.
//
// 절대 여기에 실제 미수금 계산/조회 로직을 채우지 말 것 — 그건 별도 작업이다.

export type ReceivableStatus = null;

export function getReceivableStatus(_placementId: string): ReceivableStatus {
  return null;
}
