// sw.js — UVR (network-first HTML + auto-reload)
const VERSION = "vr-szoba-v13"; // dizájnfrissítés miatt verziólépés
const STATIC_CACHE = `static-${VERSION}`;
const PAGES_CACHE  = `pages-${VERSION}`;

const ASSETS = [
  // Alap
  "/vr-szoba/",
  "/vr-szoba/index.html",
  "/vr-szoba/manifest.json",

  // App ikon / logó
  "/vr-szoba/Új%20logo.jpg",
  "/vr-szoba/icon-192.png",
  "/vr-szoba/icon-512.png",

  // VR galéria
  "/vr-szoba/szoba-led.jpg",
  "/vr-szoba/szoba-feher.jpg",
  "/vr-szoba/szoba-fa.jpg",
  "/vr-szoba/szoba-neon.jpg",

  // UV Minigolf képek — .jpeg
  "/vr-szoba/balna.jpeg",
  "/vr-szoba/buvar.jpeg",
  "/vr-szoba/capa.jpeg",
  "/vr-szoba/hajo.jpeg",
  "/vr-szoba/teknos.jpeg",

  // Quest 3 bemutató kép
  "/vr-szoba/quest3.jpg"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(STATIC_CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => ![STATIC_CACHE, PAGES_CACHE].includes(k))
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

// HTML: network-first; képek: cache-first; CSS/JS: S-W-R; egyéb: fetch → cache fallback
self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);

  // Csak a saját scope-unkban dolgozunk
  if (!url.pathname.startsWith("/vr-szoba/")) return;

  const isHTML =
    req.mode === "navigate" ||
    (req.headers.get("accept") || "").includes("text/html");

  if (isHTML) {
    e.respondWith(networkFirst(req));
    return;
  }

  if (/\.(png|jpe?g|webp|svg)$/i.test(url.pathname)) {
    e.respondWith(cacheFirst(STATIC_CACHE, req));
    return;
  }

  if (/\.(css|js)$/i.test(url.pathname)) {
    e.respondWith(staleWhileRevalidate(STATIC_CACHE, req));
    return;
  }

  e.respondWith(fetch(req).catch(() => caches.match(req)));
});

async function networkFirst(req) {
  try {
    const fresh = await fetch(req, { cache: "no-store" });
    const cache = await caches.open(PAGES_CACHE);
    cache.put(req, fresh.clone());
    return fresh;
  } catch {
    const cached = await caches.match(req);
    if (cached) return cached;
    return caches.match("/vr-szoba/index.html");
  }
}

async function cacheFirst(cacheName, req) {
  const cached = await caches.match(req, { ignoreSearch: true });
  if (cached) return cached;
  const resp = await fetch(req);
  const cache = await caches.open(cacheName);
  cache.put(req, resp.clone());
  return resp;
}

async function staleWhileRevalidate(cacheName, req) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req, { ignoreSearch: true });

  const networkPromise = fetch(req)
    .then((resp) => {
      cache.put(req, resp.clone());
      return resp;
    })
    .catch(() => cached || Promise.reject());

  return cached || networkPromise;
}
