// sw.js — offline cache a VR Szobához
const CACHE = "vr-szoba-v5";

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
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// HTML (navigáció) => network-first, minden más => cache-first
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then(resp => {
          const copy = resp.clone();
          caches.open(CACHE).then(c => c.put("/vr-szoba/", copy));
          return resp;
        })
        .catch(() => caches.match("/vr-szoba/"))
    );
    return;
  }

  // statikus fájlok: cache-first
  e.respondWith(
    caches.match(req).then(r => r ||
      fetch(req).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return resp;
      })
    )
  );
});
