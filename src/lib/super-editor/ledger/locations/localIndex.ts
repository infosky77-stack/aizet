// 로컬 파일 영속 인덱스 (IndexedDB) — "이 entryId가 어느 주문의 어떤 파일인지" 기록.
//
// 왜 필요한가: OPFS(localAdapter.ts)는 entryId.bin 이라는 평면 파일로 바이트만 갖고 있을 뿐,
// 그게 어느 주문(orderId) 것인지, 원래 파일명이 뭔지는 전혀 모른다. 그 매핑은 지금까지
// Zustand 메모리(entries)에만 있었는데, 결제는 Toss 외부 결제창을 다녀오는 구조라 그 메모리가
// 완전히 리셋된다 — 서버 즉시업로드를 끄면 이 순간 로컬 전용 파일을 통째로 잃는다.
// 이 인덱스가 그 매핑을 새로고침/재방문에도 살아남게 만드는 유일한 장치다.

const DB_NAME    = 'aizet-se-local-index';
const DB_VERSION = 1;
const STORE      = 'entries';
const ORDER_INDEX = 'orderId';

export interface LocalIndexEntry {
  entryId:    string;
  orderId:    string;
  origName:   string;
  mimeType:   string;
  sizeBytes:  number;
  kind:       'image' | 'video' | 'audio' | 'text' | 'print';
  sortOrder:  number;
  createdAt:  number;
}

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
        const store = db.createObjectStore(STORE, { keyPath: 'entryId' });
        store.createIndex(ORDER_INDEX, 'orderId', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
  return dbPromise;
}

/** entryId 하나를 기록/갱신 — attemptLocalSave 성공 직후 호출 */
export async function putLocalIndexEntry(entry: LocalIndexEntry): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror    = () => reject(tx.error);
    });
  } catch {
    // 인덱스 기록 실패해도 무시 — OPFS 원본 자체는 이미 저장되어 있으므로 이번 세션 안에서는
    // 문제없이 동작(entries가 메모리에 있음). 다음 재방문 때 복구가 안 될 뿐.
  }
}

/** entryId 하나 제거 — removeEntry에서 OPFS 삭제와 함께 호출 */
export async function removeLocalIndexEntry(entryId: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(entryId);
      tx.oncomplete = () => resolve();
      tx.onerror    = () => reject(tx.error);
    });
  } catch {
    // 무시 — 이미 없거나 지울 수 없어도 다음 hydrate에서 다시 안 보일 뿐 치명적이지 않음
  }
}

/** 특정 주문에 속한 로컬 전용 파일 메타데이터 전체 조회 — hydrateFromLocalIndex가 사용 */
export async function listLocalIndexEntries(orderId: string): Promise<LocalIndexEntry[]> {
  try {
    const db = await openDB();
    return await new Promise<LocalIndexEntry[]>((resolve, reject) => {
      const tx    = db.transaction(STORE, 'readonly');
      const index = tx.objectStore(STORE).index(ORDER_INDEX);
      const req   = index.getAll(orderId);
      req.onsuccess = () => resolve(req.result ?? []);
      req.onerror   = () => reject(req.error);
    });
  } catch {
    return [];
  }
}
