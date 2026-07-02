// userFolder 위치 어댑터 — File System Access API로 사용자가 직접 고른 "진짜 내 컴퓨터 폴더"에
// 원본을 보관한다. 구글드라이브를 쓰지 않기로 한 이유(OAuth 토큰이 서버 DB에 평문 저장돼
// "관리자가 DB를 열면 이론상 접근 가능"이라는 리스크가 "관리자 절대 못 봄" 원칙과 충돌)의 대안.
//
// 브라우저 지원: Chrome/Edge(Chromium) 86+ 만 지원. Firefox·Safari는 showDirectoryPicker 자체가
// 없다(OPFS만 지원) — isSupported()가 false를 반환하고, 호출부는 다운로드 폴백으로 전환한다.
//
// 최초 폴더 연결(showDirectoryPicker)과, 권한이 'prompt' 상태로 남아있을 때의 재확인
// (requestPermission)은 반드시 사용자 제스처(클릭) 안에서 호출해야 한다 — 이 모듈의
// connectRootFolder() / reconfirmPermission()은 그래서 항상 버튼 onClick에서 직접 불러야 한다.
// 한 번 'granted' 상태가 되면 이후 파일 쓰기 자체는 제스처 없이 백그라운드에서 반복 가능하다.
//
// 이 어댑터도 다른 위치 어댑터와 동일하게 절대 throw 하지 않는다 — 모든 실패는
// { ok:false, error } 로 반환(LocationAdapter 계약).

import type { LocationAdapter, LocationSaveResult } from '../types';

const DB_NAME    = 'aizet-se-user-folder';
const DB_VERSION = 1;
const STORE      = 'handles';
const ROOT_KEY    = 'root';
const ORDER_SUBDIR_PREFIX = '도록_';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unsupported'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
  return dbPromise;
}

async function storeRootHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put({ id: ROOT_KEY, handle });
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

async function loadRootHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openDB();
    return await new Promise<FileSystemDirectoryHandle | null>((resolve, reject) => {
      const tx  = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(ROOT_KEY);
      req.onsuccess = () => resolve(req.result?.handle ?? null);
      req.onerror   = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

// 메모리 캐시 — 매번 IndexedDB를 안 거치게. 페이지 새로고침 시엔 다시 loadRootHandle()로 복원.
let cachedRoot: FileSystemDirectoryHandle | null = null;
let rootLoaded = false;

async function getCachedRoot(): Promise<FileSystemDirectoryHandle | null> {
  if (rootLoaded) return cachedRoot;
  cachedRoot = await loadRootHandle();
  rootLoaded = true;
  return cachedRoot;
}

export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

export type FolderConnectionStatus = 'granted' | 'prompt' | 'not-connected' | 'unsupported';

/** 조용히(제스처 없이) 현재 연결 상태만 확인 — UI에서 버튼 문구를 정할 때 사용 */
export async function getFolderConnectionStatus(): Promise<FolderConnectionStatus> {
  if (!isFileSystemAccessSupported()) return 'unsupported';
  const root = await getCachedRoot();
  if (!root) return 'not-connected';
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const perm = await (root as any).queryPermission({ mode: 'readwrite' });
    return perm === 'granted' ? 'granted' : 'prompt';
  } catch {
    return 'not-connected';
  }
}

/** 최초 폴더 선택 — 반드시 버튼 onClick 안에서 직접 호출(사용자 제스처 필요) */
export async function connectRootFolder(): Promise<{ ok: boolean; error?: string }> {
  if (!isFileSystemAccessSupported()) return { ok: false, error: '이 브라우저는 지원하지 않습니다' };
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handle: FileSystemDirectoryHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
    await storeRootHandle(handle);
    cachedRoot = handle;
    rootLoaded = true;
    return { ok: true };
  } catch (err) {
    // 사용자가 선택을 취소한 경우도 여기로 옴(AbortError) — 에러로 취급하되 조용히
    return { ok: false, error: err instanceof Error ? err.message : '폴더 선택 실패' };
  }
}

/** 권한이 'prompt' 상태일 때 재확인 — 반드시 버튼 onClick 안에서 직접 호출(사용자 제스처 필요) */
export async function reconfirmPermission(): Promise<{ ok: boolean; error?: string }> {
  const root = await getCachedRoot();
  if (!root) return { ok: false, error: '연결된 폴더가 없습니다' };
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const perm = await (root as any).requestPermission({ mode: 'readwrite' });
    return perm === 'granted' ? { ok: true } : { ok: false, error: '권한이 거부되었습니다' };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : '권한 재확인 실패' };
  }
}

async function getOrderSubdir(orderId: string): Promise<FileSystemDirectoryHandle | null> {
  const root = await getCachedRoot();
  if (!root) return null;
  try {
    return await root.getDirectoryHandle(`${ORDER_SUBDIR_PREFIX}${orderId}`, { create: true });
  } catch {
    return null;
  }
}

// 같은 주문 폴더 안에서 파일명이 겹치면 " (1)", " (2)" 형태로 회피 — 서로 다른 entryId가
// 같은 origName을 갖는 드문 경우(클라이언트 dedupe를 빠져나간 경우)를 위한 안전장치.
async function uniqueFileName(dir: FileSystemDirectoryHandle, desired: string): Promise<string> {
  let candidate = desired;
  let n = 1;
  for (;;) {
    try {
      await dir.getFileHandle(candidate);
    } catch {
      return candidate; // 없으면 그대로 사용 가능
    }
    const dot  = desired.lastIndexOf('.');
    const base = dot > 0 ? desired.slice(0, dot) : desired;
    const ext  = dot > 0 ? desired.slice(dot) : '';
    candidate = `${base} (${n})${ext}`;
    n += 1;
  }
}

export const userFolderAdapter: LocationAdapter = {
  kind: 'userFolder',

  // 브라우저 지원 여부만 확인(동기) — "지금 실제로 연결돼 있는지"는 비동기라 별도로
  // getFolderConnectionStatus()를 호출부(store.ts)가 확인해서 게이팅한다.
  isSupported: isFileSystemAccessSupported,

  async save(entryId, file, meta): Promise<LocationSaveResult> {
    if (!isFileSystemAccessSupported()) return { ok: false, error: 'File System Access 미지원' };
    if (!meta.orderId) return { ok: false, error: '주문 정보 없음' };
    try {
      const dir = await getOrderSubdir(meta.orderId);
      if (!dir) return { ok: false, error: '폴더가 연결되어 있지 않습니다' };
      const name    = await uniqueFileName(dir, meta.origName);
      const handle  = await dir.getFileHandle(name, { create: true });
      const writable = await handle.createWritable();
      await writable.write(file);
      await writable.close();
      return { ok: true, ref: `${meta.orderId}/${name}` };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : '로컬 폴더 저장 실패' };
    }
  },

  // 사용자 폴더 파일은 다시 화면에 미리보기로 띄울 일이 없다(OPFS가 그 역할을 함) — 미구현.
  async resolveUrl(): Promise<string | null> {
    return null;
  },

  async remove(ref): Promise<void> {
    const [orderId, name] = ref.split('/');
    if (!orderId || !name) return;
    try {
      const dir = await getOrderSubdir(orderId);
      await dir?.removeEntry(name);
    } catch {
      // 이미 없거나 지울 수 없어도 무시 — 사용자 폴더 사본은 보조 백업일 뿐
    }
  },
};
