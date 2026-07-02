// 파생 상태 계산 — FileEntry.locations[] 로부터 "지금 이 파일이 준비됐는지, 어떤 URL로 보여줄지"를
// 매번 다시 계산한다. 절대 별도 필드에 캐시해서 저장하지 않는다 — 그 캐시가 실제 locations 와
// 어긋나는 순간이 바로 "여러 곳에 흩어진 파일 상태가 서로 안 맞는" 버그의 시작점이기 때문.

import type { FileEntry, FileEntryStatus, FileLocationKind } from './types';
import { peekLocalBlobUrl } from './locations/localAdapter';

export function findLocation(entry: FileEntry, kind: FileLocationKind) {
  return entry.locations.find((l) => l.kind === kind);
}

export function getEntryStatus(entry: FileEntry): FileEntryStatus {
  const server = findLocation(entry, 'serverLight');
  if (server?.status === 'present') return 'ready';
  // serverLight(공유 라이브러리 권위)가 실패하면 local이 성공했더라도 에러로 보여준다 —
  // local은 어디까지나 보조 사본이라, 공유 저장이 실패했다는 사실을 가려서는 안 된다.
  if (server?.status === 'error') return 'error';
  // 작업 중에는 서버에 자동으로 안 올라간다(로컬 우선 전환) — serverLight가 아예 없는 게
  // 정상적인 최종 상태다. local(OPFS) 저장만 완료되면 "준비됨"으로 본다.
  const local = findLocation(entry, 'local');
  if (local?.status === 'present') return 'ready';
  return 'uploading';
}

export function getEntryError(entry: FileEntry): string | undefined {
  const server = findLocation(entry, 'serverLight');
  return server?.status === 'error' ? server.error : undefined;
}

/**
 * 지금 보여줄 수 있는 가장 좋은 URL을 동기적으로 계산.
 * 우선순위: serverLight(서버 확정본, 공유 라이브러리의 권위) → local(OPFS, 이미 blob으로
 * 해석해둔 경우만) → previewUrl(방금 고른 파일의 즉석 미리보기, 아직 아무 데도 확정 전).
 * 셋 다 없으면 빈 문자열 — 호출부(컴포넌트)가 스피너 등으로 처리.
 */
export function resolveDisplayUrl(entry: FileEntry): string {
  const server = findLocation(entry, 'serverLight');
  if (server?.status === 'present' && entry.userId && entry.filename) {
    return `/api/super-editor-files/${entry.userId}/${entry.filename}`;
  }
  const local = findLocation(entry, 'local');
  if (local?.status === 'present') {
    const cached = peekLocalBlobUrl(local.ref);
    if (cached) return cached;
  }
  return entry.previewUrl ?? '';
}

/** 어느 위치에 존재하는지 배지 표시용 — 순서 고정(로컬 → 사용자 폴더 → 서버 → 드라이브) */
export function getPresentLocationKinds(entry: FileEntry): FileLocationKind[] {
  const order: FileLocationKind[] = ['local', 'userFolder', 'serverLight', 'userDrive'];
  return order.filter((kind) => findLocation(entry, kind)?.status === 'present');
}

/** local + userFolder 둘 다 present면 원본이 이중으로 보관된 것 — UI에서 안심 문구/뱃지에 사용 */
export function isDoublyBackedUp(entry: FileEntry): boolean {
  return findLocation(entry, 'local')?.status === 'present'
      && findLocation(entry, 'userFolder')?.status === 'present';
}

export function getOrderedEntries(entries: Record<string, FileEntry>): FileEntry[] {
  return Object.values(entries).sort((a, b) => a.sortOrder - b.sortOrder);
}
