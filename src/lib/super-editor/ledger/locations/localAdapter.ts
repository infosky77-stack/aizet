// local 위치 어댑터 — OPFS(Origin Private File System)에 원본 바이트를 보관.
//
// 왜 OPFS인가: 브라우저가 관리하는 진짜 영속 저장소라 새로고침·탭 재시작에도 남는다(=사용자 PC에
// "사는" 1차 저장선이라는 요구를 실제로 만족). 단, 탐색기에 보이는 실제 폴더는 아니고, 권한 요청도
// 없이 조용히 동작한다. 미지원 브라우저(구형 Safari 등)에서는 isSupported() 가 false 를 반환하고,
// 호출부는 이 위치를 그냥 시도하지 않는다 — 에러를 보여주지 않고 조용히 생략(serverLight 만으로도
// 기존 동작은 완전히 유지되기 때문).
//
// 이 어댑터는 절대 throw 하지 않는다(LocationAdapter 계약) — 모든 실패는 { ok:false, error } 로 반환.

import type { LocationAdapter, LocationSaveResult } from '../types';

const DIR_NAME = 'super-editor-originals';

let rootPromise: Promise<FileSystemDirectoryHandle> | null = null;

function getRoot(): Promise<FileSystemDirectoryHandle> {
  if (!rootPromise) {
    rootPromise = navigator.storage.getDirectory().then((root) =>
      root.getDirectoryHandle(DIR_NAME, { create: true }),
    );
  }
  return rootPromise;
}

export function isOpfsSupported(): boolean {
  return typeof navigator !== 'undefined'
    && 'storage' in navigator
    && typeof navigator.storage.getDirectory === 'function';
}

// 이미 blob URL로 해석해둔 ref → url 캐시. imageCache.ts 의 objectUrlCache 와 동일한 사고방식:
// 절대 명시적으로 revoke 하지 않고(여러 화면에서 동시 참조 가능), 페이지 언로드 시 브라우저가 정리.
const resolvedUrlCache = new Map<string, string>();

/** 동기 조회 — 이미 해석된 적 있으면 즉시 반환, 없으면 undefined(호출부가 resolveUrl 로 비동기 요청) */
export function peekLocalBlobUrl(ref: string): string | undefined {
  return resolvedUrlCache.get(ref);
}

function refFor(entryId: string): string {
  return `${entryId}.bin`;
}

export const localAdapter: LocationAdapter = {
  kind: 'local',

  isSupported: isOpfsSupported,

  async save(entryId, file): Promise<LocationSaveResult> {
    if (!isOpfsSupported()) return { ok: false, error: 'OPFS unsupported' };
    try {
      const dir = await getRoot();
      const ref = refFor(entryId);
      const handle = await dir.getFileHandle(ref, { create: true });
      // FileSystemSyncAccessHandle 은 워커에서만 가능 — 메인 스레드에서는 createWritable() 사용
      const writable = await handle.createWritable();
      await writable.write(file);
      await writable.close();
      return { ok: true, ref };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'OPFS 저장 실패' };
    }
  },

  async resolveUrl(ref): Promise<string | null> {
    const cached = resolvedUrlCache.get(ref);
    if (cached) return cached;
    if (!isOpfsSupported()) return null;
    try {
      const dir = await getRoot();
      const handle = await dir.getFileHandle(ref);
      const file = await handle.getFile();
      const url = URL.createObjectURL(file);
      resolvedUrlCache.set(ref, url);
      return url;
    } catch {
      return null;
    }
  },

  async remove(ref): Promise<void> {
    if (!isOpfsSupported()) return;
    try {
      const dir = await getRoot();
      await dir.removeEntry(ref);
      resolvedUrlCache.delete(ref);
    } catch {
      // 이미 없거나 지울 수 없어도 무시 — 로컬 사본은 어차피 보조 사본일 뿐
    }
  },
};
