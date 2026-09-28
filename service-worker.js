// FitPlan — basit "stale-while-revalidate" servis çalışanı.
// Uygulamayı bir web sunucusundan (https:// veya localhost) açtığında devreye
// girer; dosyaları önbelleğe alır, böylece internet olmadan da açılır ve daha
// hızlı yüklenir. Telefonda dosya olarak (file://) açıldığında tarayıcılar
// servis çalışanına izin vermez -- bu normaldir, uygulama yine de çalışır.
const CACHE_NAME = 'fitplan-cache-v2';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-192-maskable.png',
  './icons/icon-512-maskable.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .catch(() => {}) // tek tek dosya bulunamazsa kurulum yine de tamamlansın
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
