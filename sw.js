const CACHE_PREFIX = 'pali-converter-';
const CACHE_NAME = `${CACHE_PREFIX}v5`;

const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install: เก็บแคชทีละไฟล์อย่างปลอดภัย
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    for (const asset of ASSETS) {
      try {
        await cache.add(asset);
      } catch (error) {
        console.warn('[SW] Caching failed for:', asset, error);
      }
    }

    if (!await cache.match('/') && !await cache.match('/index.html')) {
      throw new Error('[SW] Unable to cache the app shell');
    }
    await self.skipWaiting();
  })());
});

// Activate: ลบแคชเวอร์ชันเก่า
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
        .map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

// Fetch: ใช้ Cache-First สำหรับการดึงข้อมูล/Refresh หน้าเว็บ
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  if (event.request.method !== 'GET' || requestUrl.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(event.request);
    if (cachedResponse) return cachedResponse;

    try {
      const response = await fetch(event.request);
      if (response.ok && response.type !== 'opaque') {
        try {
          await cache.put(event.request, response.clone());
        } catch (error) {
          console.warn('[SW] Runtime caching failed for:', event.request.url, error);
        }
      }
      return response;
    } catch (error) {
      if (event.request.mode === 'navigate') {
        const appShell = await cache.match('/') || await cache.match('/index.html');
        if (appShell) return appShell;
      }
      return new Response('Offline: this resource is not cached.', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
  })());
});