const CACHE_NAME = "pali-transcript-v1";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then((networkResponse) => {
            const responseCopy = networkResponse.clone();

            if (new URL(event.request.url).origin === self.location.origin) {
              caches.open(CACHE_NAME)
                .then((cache) => cache.put(event.request, responseCopy));
            }

            return networkResponse;
          })
          .catch(() => {
            if (event.request.mode === "navigate") {
              return caches.match("./index.html");
            }

            return new Response("ไม่สามารถโหลดไฟล์ขณะออฟไลน์ได้", {
              status: 503,
              headers: {
                "Content-Type": "text/plain; charset=utf-8"
              }
            });
          });
      })
  );
});
