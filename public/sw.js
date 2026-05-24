// RISE Service Worker — bump CACHE_VERSION on each deploy to invalidate caches.
const CACHE_VERSION = "rise-v8-2026-05-24";
const STATIC_CACHE = `rise-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `rise-runtime-${CACHE_VERSION}`;

// Files to pre-cache for offline shell.
const PRECACHE_URLS = [
  "/",
  "/portal",
  "/portal/tracker",
  "/offline.html",
  "/manifest.json",
  "/favicon.png",
  "/favicon-32.png",
  "/apple-touch-icon.png",
  "/logo-header.png",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(PRECACHE_URLS).catch((err) => {
        // Pre-cache failures shouldn't block install; log and continue.
        console.warn("[sw] precache failed:", err);
      })
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

function isApiRequest(url) {
  return (
    url.hostname.includes("supabase.co") ||
    url.pathname.startsWith("/functions/") ||
    url.pathname.startsWith("/api/")
  );
}

function isStaticAsset(url) {
  // Static asset extensions that benefit from cache-first.
  return /\.(?:css|js|mjs|png|jpg|jpeg|webp|svg|woff2?|ttf|ico)(\?.*)?$/i.test(
    url.pathname
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only handle GET — POST/PUT/etc go straight to the network.
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Skip non-http(s) schemes (e.g. chrome-extension://)
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  // API / Supabase: network-first, fall back to cached response if any.
  if (isApiRequest(url)) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // Don't cache cross-origin Supabase responses — they often vary by auth.
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Navigation requests: network-first with offline fallback.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // Cache successful navigation responses.
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          return caches.match("/offline.html");
        })
    );
    return;
  }

  // Static assets: cache-first.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req)
          .then((res) => {
            if (res && res.ok && res.type !== "opaque") {
              const copy = res.clone();
              caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, copy));
            }
            return res;
          })
          .catch(() => cached);
      })
    );
    return;
  }

  // Default: network-first with cache fallback.
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});

// Allow page to send a message to skip waiting (for instant SW updates).
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
