// 넣기 어댑터 공용 — 입구(피커/드롭)가 뭐든 File[] 만 만들어주면 여기서 원장에 동일하게 반영.
// 파일 하나가 예기치 않게 던져도(정상적으로는 store.ingestFile 이 throw 하지 않지만, 방어적으로)
// 나머지 파일 처리는 계속되도록 개별 try/catch로 격리한다.

import { useFileLedgerStore } from '../store';

export function ingestFiles(files: File[]): void {
  const store = useFileLedgerStore.getState();
  for (const file of files) {
    try {
      store.ingestFile(file);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[super-editor ledger] ingestFile 실패:', file.name, err);
    }
  }
}
