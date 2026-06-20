// RISE Service Worker — network-first with offline fallback
// Bump this constant to force a cache clear on all clients
const CACHE_VERSION = "v6";
const CACHE_NAME = `rise-${CACHE_VERSION}`;
const OFFLINE_URL = "/portal";

// Cross-origin nutrition CDN to cache (so CSS/JS work in standalone PWA mode)
const NUTRITION_ORIGIN = "https://rise-nutrition-v2.vercel.app";

self.addEventListener("install", (event) => {
  // Activate immediately
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return;

  var url = new URL(event.request.url);

  // Cross-origin nutrition CDN assets: network-first with cache fallback
  // Always fetch fresh so deploys propagate immediately.
  // Only use cache when offline (true offline mode).
  if (url.origin === NUTRITION_ORIGIN) {
    event.respondWith(
      fetch(event.request)
        .then(function (response) {
          if (response && response.ok) {
            var clone = response.clone();
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(function () {
          // Offline: serve cached copy if available
          return caches.match(event.request).then(function (cached) {
            return cached || new Response("", { status: 503, statusText: "Offline" });
          });
        })
    );
    return;
  }

  // Same-origin: network-first with cache fallback
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then(function (response) {
        // Cache successful same-origin responses for offline
        if (response.ok) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(function () {
        // Offline: try cache, then fall back to portal page
        return caches.match(event.request).then(function (cached) {
          return cached || caches.match(OFFLINE_URL);
        });
      })
  );
});