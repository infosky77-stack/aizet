// cache 위치 어댑터 — 기존 src/lib/imageCache.ts(IndexedDB 썸네일 캐시)를 그대로 흡수해서 쓴다.
//
// 다른 위치들과 성격이 다르다: local/serverLight/userDrive 는 "원본이 실제로 존재하는 권위있는
// 저장소"인 반면, cache 는 항상 다른 위치(주로 serverLight)의 바이트를 다시 받아 만들 수 있는
// 파생 사본이다 — 그래서 LocationAdapter 의 save()/remove() 계약(명시적 저장/삭제 대상)을 그대로
// 강제하지 않고, "필요할 때 채워지는" 조회 전용의 더 작은 인터페이스로 둔다.
// 로직은 전혀 새로 만들지 않음 — imageCache.ts 를 감싸기만 함(원본 파일은 절대 건드리지 않음).

import { getCachedImageSrc, peekCachedImageUrl } from '@/lib/imageCache';

export { peekCachedImageUrl };

/** 서버 URL을 IndexedDB 캐시에 미리 채워둠(선택적 워밍) — 실패해도 무시, 다음 렌더에서 재시도됨 */
export async function warmCache(id: string, serverUrl: string): Promise<void> {
  try {
    await getCachedImageSrc(id, serverUrl);
  } catch {
    // imageCache.ts 자체가 이미 throw 하지 않지만, 방어적으로 한 번 더 감쌈
  }
}
