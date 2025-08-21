// sw.js — offline cache a VR Szobához
const CACHE = "vr-szoba-v4"; // <- verziót léptettük!

const ASSETS = [
  "/vr-szoba/",
  "/vr-szoba/index.html",
  "/vr-szoba/manifest.json",
  "/vr-szoba/icon-192.png",
  "/vr-szoba/icon-512.png",
  // Galéria új képei
  "/vr-szoba/szoba-led.jpg",
  "/vr-szoba/szoba-feher.jpg",
  "/vr-szoba/szoba-fa.jpg",
  "/vr-szoba/szoba-neon.jpg"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting(); // azonnal aktiválódjon
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
    caches.match(e.request).then(r => r ||
      fetch(e.request).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return resp;
      })
    ).catch(() => r)
  );
});
