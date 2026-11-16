// Offline cache for Rufus Crush. The whole game is nine static files, so
// they are all fetched at install time; after that no network is needed.
// 0ec9105deae0 is replaced by build.sh so each build gets a fresh cache.
const PREFIX = "rufus-crush-";
const CACHE = PREFIX + "0ec9105deae0";
const FILES = [
  "./",
  "index.html",
  "rufus.js",
  "engine.js",
  "rufus-crush.wasm",
  "manifest.webmanifest",
  "icons/icon-180.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(FILES.map((f) => new Request(f, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

// Only this game's old caches are cleared. Other games served from the same
// site keep theirs: cache storage is shared by everything on one origin.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Cache first: the build id in the cache name is what rolls out updates.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(req, { ignoreSearch: true, cacheName: CACHE }).then((hit) => hit || fetch(req))
  );
});
