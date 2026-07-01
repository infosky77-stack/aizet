// v2 — navigate 요청은 항상 네트워크에서 직접 가져옴 (캐시 우회)
self.addEventListener('install', (e) => {
  e.waitUntil(
    // 이전 버전이 캐싱한 모든 항목 삭제
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (e) => {
  // HTML 페이지 탐색 요청 — 브라우저 HTTP 캐시 완전 우회, 항상 최신 HTML
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request, { cache: 'no-store' }));
    return;
  }
  // _next/static/ 정적 에셋(CSS·JS) — 콘텐츠 해시로 버전 관리되므로 일반 캐시 사용
  e.respondWith(fetch(e.request));
});
