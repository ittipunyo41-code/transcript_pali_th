const CACHE_NAME = 'pali-converter-v3';

const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// บันทึกไฟล์ทีละไฟล์ ถ้าไฟล์ไหนหาไม่เจอจะไม่ทำให้ไฟล์อื่นพัง
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of ASSETS) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn('[SW] Failed to cache asset:', asset, err);
        }
      }
    })
  );
  self.skipWaiting();
});

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

// กลยุทธ์: ดึงจาก Cache ก่อนเสมอ (Cache-First) แม้รีเฟรชตอนไม่มีเน็ตก็ยังติด
self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        // หากเน็ตดับและเป็นการเปลี่ยนหน้า/รีเฟรช ให้คืนค่า index.html
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html') || caches.match('./');
        }
      });
    })
  );
});