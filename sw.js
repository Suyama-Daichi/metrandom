// メトロ駅ガチャ Service Worker
const VERSION = 'v4';
const CACHE = `metro-gacha-${VERSION}`;
const PRECACHE = [
  '/', '/en/', '/zh/',
  '/osaka/', '/en/osaka/', '/zh/osaka/',
  '/favicon.svg', '/favicon.png', '/apple-touch-icon.png',
  '/icons/icon-192.png', '/icons/icon-512.png'
];

// オフライン時のナビゲーションフォールバック先（大阪版は大阪版トップへ）
function offlineFallback(pathname) {
  if (pathname.startsWith('/osaka/')) return '/osaka/';
  if (pathname.startsWith('/en/osaka/')) return '/en/osaka/';
  if (pathname.startsWith('/zh/osaka/')) return '/zh/osaka/';
  if (pathname.startsWith('/en/')) return '/en/';
  if (pathname.startsWith('/zh/')) return '/zh/';
  return '/';
}

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // 外部オリジン（広告・解析・フォント等）はService Workerで扱わない
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;

  if (e.request.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('.html')) {
    // HTML: ネットワーク優先（常に最新版を取得、オフライン時のみキャッシュ）
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request).then(r => r || caches.match(offlineFallback(url.pathname))))
    );
  } else {
    // 静的アセット: キャッシュ優先（高速化・オフライン対応）
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }))
    );
  }
});
