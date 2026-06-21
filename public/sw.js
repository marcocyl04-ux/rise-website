// RISE Service Worker — network-first with offline fallback
const CACHE_VERSION = "v8";
const CACHE_NAME = `rise-${CACHE_VERSION}`;
const OFFLINE_URL = "/portal";

self.addEventListener("install", (event) => {
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
  if (event.request.method !== "GET") return;

  var url = new URL(event.request.url);

  // IMPORTANT: Do NOT intercept cross-origin requests (CSS/JS from nutrition CDN).
  // The browser handles these natively with proper HTTP caching.
  // Intercepting them from the SW causes "no CSS" blank page bugs.
  if (url.origin !== self.location.origin) return;

  // Same-origin: network-first with cache fallback
  // IMPORTANT: Do NOT cache authenticated portal pages (could leak data on shared devices).
  if (url.pathname.startsWith("/portal/")) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(function (response) {
        if (response.ok) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(function () {
        return caches.match(event.request).then(function (cached) {
          return cached || caches.match(OFFLINE_URL);
        });
      })
  );
});