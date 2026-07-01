// 이미지 로컬 캐시 (IndexedDB) — 서버 이미지를 최초 1회만 받고 이후 재사용
//
// 슈퍼에디터에서 같은 이미지가 탭 전환([작품 이미지]↔[도록 미리보기])이나
// 리렌더마다 반복 fetch 되는 문제를 막기 위한 계층.
// - 1차: 메모리(Map) — 같은 페이지 로드 내에서는 blob URL을 재사용 (revoke 안 함 → 사라지는 문제 방지)
// - 2차: IndexedDB — 새로고침/재방문에도 서버 재요청 없이 즉시 로드
// - 실패 시(미지원 브라우저, 용량 초과 등) 원본 서버 URL로 폴백 — 화면이 죽지 않게

const DB_NAME    = 'aizet-se-image-cache';
const DB_VERSION = 1;
const STORE      = 'images';

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

async function getBlobFromDB(id: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    return await new Promise<Blob | null>((resolve, reject) => {
      const tx  = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => resolve(req.result?.blob ?? null);
      req.onerror   = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

async function putBlobInDB(id: string, blob: Blob): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put({ id, blob, cachedAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror    = () => reject(tx.error);
    });
  } catch {
    // 저장 실패해도 무시 — 이번 세션은 메모리 캐시로만 동작, 다음에 다시 시도
  }
}

// 세션 내 blob URL 재사용 캐시 — 절대 revoke 하지 않음(페이지 언로드 시 브라우저가 정리)
// → 컴포넌트 unmount/tab 전환 중 blob URL이 무효화돼 이미지가 사라지는 문제를 원천 차단
const objectUrlCache = new Map<string, string>();
const inflight        = new Map<string, Promise<string>>();

/**
 * id로 캐시된 이미지를 반환. 없으면 serverUrl에서 받아 IndexedDB에 저장 후 반환.
 * id는 안정적인 식별자여야 함(서버 파일 id 또는 UUID가 포함된 URL 등) — 원본 파일명 금지.
 * 실패 시 serverUrl을 그대로 반환(폴백) — 절대 throw 하지 않음.
 */
export async function getCachedImageSrc(id: string, serverUrl: string): Promise<string> {
  const cached = objectUrlCache.get(id);
  if (cached) return cached;

  const existing = inflight.get(id);
  if (existing) return existing;

  const promise = (async () => {
    try {
      let blob = await getBlobFromDB(id);
      if (!blob) {
        const res = await fetch(serverUrl);
        if (!res.ok) throw new Error(`image fetch failed: ${res.status}`);
        blob = await res.blob();
        await putBlobInDB(id, blob);
      }
      const objectUrl = URL.createObjectURL(blob);
      objectUrlCache.set(id, objectUrl);
      return objectUrl;
    } catch {
      return serverUrl;
    } finally {
      inflight.delete(id);
    }
  })();

  inflight.set(id, promise);
  return promise;
}

// ── 로컬 낙관적 미리보기 blob URL 정리 ───────────────────────────────────────
// 같은 blob URL이 화면 여러 곳(작품 카드 + 도록 미리보기 등)에 동시에 렌더링될 수 있어서
// component별 refcount 대신, 데이터(= cSnap.artworks)에서 그 blob URL 참조를 완전히
// 치운 "호출자"가 정리를 책임진다. React가 새 src로 리렌더/페인트할 시간을
// 확보한 뒤(rAF 2회) revoke — 화면에 아직 그려져 있는 도중에 지워서 깨지는 걸 방지.
export function scheduleRevokeBlobUrl(url: string): void {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      URL.revokeObjectURL(url);
    });
  });
}
