// 旧 Service Worker を解除するためだけに残している（登録済みの端末でキャッシュを消して自分を外す）
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(
  caches.keys()
    .then(keys => Promise.all(keys.map(k => caches.delete(k))))
    .then(() => self.registration.unregister())
));
