/*
 * Service worker: makes the game work offline and installable.
 *
 * Strategy: NETWORK FIRST, cache as fallback. Online players always get the latest deployed
 * files (no stale-version problems after an update); every successful response is copied into
 * the cache, and that copy is served only when the network is unavailable.
 */
var CACHE = 'cttt-v1';
var CORE = [
  './', 'index.html', 'css/style.css', 'icon.png', 'manifest.webmanifest',
  'js/book.js', 'js/engine.js', 'js/audio.js', 'js/game.js', 'js/ai-worker.js'
];

self.addEventListener('install', function (ev) {
  // pre-cache everything the game needs so it works offline right after the first visit
  ev.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (ev) {
  // drop caches left behind by older versions of this worker
  ev.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (ev) {
  var req = ev.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;   // only our own files
  ev.respondWith(
    fetch(req).then(function (res) {
      if (res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
      return res;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: true }).then(function (hit) { return hit || caches.match('index.html'); });
    })
  );
});
