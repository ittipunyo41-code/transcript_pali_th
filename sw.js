const CACHE_NAME = 'pali-converter-v4';

const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install: เก็บแคชทีละไฟล์อย่างปลอดภัย
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of ASSETS) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn('[SW] Caching failed for:', asset, err);
        }
      }
    })
  );
  self.skipWaiting();
});

// Activate: ลบแคชเวอร์ชันเก่า
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: ใช้ Cache-First สำหรับการดึงข้อมูล/Refresh หน้าเว็บ
self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        // หากเน็ตดับแล้วมีการรีเฟรชหรือเปลี่ยนหน้า ให้ดึงหน้าหลักมาแสดง
        if (event.request.mode === 'navigate') {
          return caches.match('/') || caches.match('/index.html');
        }
      });
    })
  );
});