// sw.js — VR Szoba (network-first HTML + auto-reload)
const VERSION = "vr-szoba-v5";
const STATIC_CACHE = `static-${VERSION}`;
const PAGES_CACHE  = `pages-${VERSION}`;

const ASSETS = [
  "/vr-szoba/",
  "/vr-szoba/index.html",
  "/vr-szoba/manifest.json",
  "/vr-szoba/icon-192.png",
  "/vr-szoba/icon-512.png",
  "/vr-szoba/szoba-led.jpg",
  "/vr-szoba/szoba-feher.jpg",
  "/vr-szoba/szoba-fa.jpg",
  "/vr-szoba/szoba-neon.jpg"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(STATIC_CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting(); // az új SW azonnal aktiválódhat
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys
        .filter(k => ![STATIC_CACHE, PAGES_CACHE].includes(k))
        .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim(); // azonnal átveszi az oldalt
});

// Stratégia:
// - HTML (navigáció): network-first, cache fallback
// - Képek: cache-first
// - CSS/JS: stale-while-revalidate
self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);

  // 1) Navigációs kérések (HTML)
  const isHTML =
    req.mode === "navigate" ||
    (req.headers.get("accept") || "").includes("text/html");

  if (isHTML) {
    e.respondWith(networkFirst(req));
    return;
  }

  // 2) Képek: cache-first
  if (/\.(png|jpe?g|webp|svg)$/i.test(url.pathname)) {
    e.respondWith(cacheFirst(STATIC_CACHE, req));
    return;
  }

  // 3) CSS/JS: stale-while-revalidate
  if (/\.(css|js)$/i.test(url.pathname)) {
    e.respondWith(staleWhileRevalidate(STATIC_CACHE, req));
    return;
  }

  // Egyéb: próbáld hálózatról, majd cache
  e.respondWith(fetch(req).catch(() => caches.match(req)));
});

async function networkFirst(req) {
  try {
    const fresh = await fetch(req, { cache: "no-store" });
    const copy = fresh.clone();
    const cache = await caches.open(PAGES_CACHE);
    cache.put(req, copy);
    return fresh;
  } catch {
    const cached = await caches.match(req);
    if (cached) return cached;
    // végső fallback: kezdőlap
    return caches.match("/vr-szoba/index.html");
  }
}

async function cacheFirst(cacheName, req) {
  const cached = await caches.match(req);
  if (cached) return cached;
  const resp = await fetch(req);
  const copy = resp.clone();
  (await caches.open(cacheName)).put(req, copy);
  return resp;
}

async function staleWhileRevalidate(cacheName, req) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const networkPromise = fetch(req).then((resp) => {
    cache.put(req, resp.clone());
    return resp;
  });
  return cached || networkPromise;
}


