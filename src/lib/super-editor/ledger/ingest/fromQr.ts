// 넣기 어댑터 — QR 모바일 업로드(SSE로 전달됨). 다른 두 어댑터와 계약이 다름: 이 기기에 File
// 객체가 존재하지 않고(다른 기기에서 이미 서버에 저장 완료된 파일), 서버 DTO만 도착한다.
// 그래서 ingestFile()이 아니라 별도 경로(adoptServerFile)로 원장에 반영한다 — 낙관적 미리보기나
// local(OPFS) 저장 시도 자체가 애초에 성립하지 않는 케이스라서 억지로 같은 함수에 끼워넣지 않음.

import { useFileLedgerStore } from '../store';
import type { SEFileDTO } from '../types';

export function ingestFromQr(dto: SEFileDTO): void {
  try {
    useFileLedgerStore.getState().adoptServerFile(dto);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[super-editor ledger] adoptServerFile 실패:', dto.orig_name, err);
  }
}
