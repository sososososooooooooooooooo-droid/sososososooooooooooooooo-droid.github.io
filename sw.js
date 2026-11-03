// Bump VERSION whenever you change any game file so installed copies pick up the update.
const VERSION = "2";
const C = "sidescroller-v" + VERSION;
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-512-maskable.png"];

self.addEventListener("install", e => {
  // cache: "reload" bypasses the HTTP cache so we never precache a stale copy
  e.waitUntil(
    caches.open(C)
      .then(c => c.addAll(FILES.map(u => new Request(u, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== C).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Cache-first for instant/offline loads, refreshing the cache in the background
// when online (stale-while-revalidate). Page navigations fall back to index.html.
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || !req.url.startsWith(self.location.origin)) return;
  e.respondWith(
    caches.open(C).then(async cache => {
      const hit = await cache.match(req, { ignoreSearch: true });
      const refresh = fetch(req).then(res => {
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      });
      if (hit) { refresh.catch(() => {}); return hit; }
      try { return await refresh; }
      catch (_) {
        if (req.mode === "navigate") return (await cache.match("./index.html")) || Response.error();
        return Response.error();
      }
    })
  );
});
