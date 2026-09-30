const CACHE_NAME = 'pali-converter-v2';

// รายการไฟล์ทั้งหมดที่ต้องเก็บไว้ในแคช
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 1. ตอนติดตั้ง Service Worker ให้เก็บบันทึกไฟล์ทันที
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching all assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  // บังคับให้ Service Worker ตัวใหม่ทำงานทันทีไม่ต้องรอปิดแอป
  self.skipWaiting();
});

// 2. ตอนเริ่มทำงาน ให้ลบ Cache เก่าออก
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. ตอนมีการเรียกขอไฟล์ หรือ Refresh หน้าเว็บ (Fetch Event)
self.addEventListener('fetch', (event) => {
  // รองรับการทำงานกับ HTTP/HTTPS เท่านั้น
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // ถ้ามีไฟล์อยู่ใน Cache ให้ส่งไฟล์ใน Cache ออกไปทันที (แม้จะ Refresh หน้าเว็บก็ตาม)
      if (cachedResponse) {
        // แอบแวบไปดึงไฟล์ใหม่จากเน็ตมาอัปเดตไว้ตุนในเครื่อง (ถ้ามีเน็ต)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {
          /* ออฟไลน์อยู่ ไม่เป็นไร */
        });

        return cachedResponse;
      }

      // ถ้าไม่มีใน Cache ค่อยไปดึงจาก Network
      return fetch(event.request).catch(() => {
        // หากเน็ตดับ และดึงหน้าหลัก ให้ส่ง index.html ในแคชกลับไป
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});