// sw.js — basic offline cache for VR Szoba
const CACHE = "vr-szoba-v1";
const ASSETS = [
  "/vr-szoba/",
  "/vr-szoba/index.html",
  "/vr-szoba/manifest.json",
  "/vr-szoba/icons/icon-192.png",
  "/vr-szoba/icons/icon-512.png"
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

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
      const copy = resp.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return resp;
    }).catch(() => r))
  );
});
