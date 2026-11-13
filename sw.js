// Service worker: makes the page itself (HTML, Transformers.js library, fonts)
// available offline. The model weights and the ONNX Runtime WASM binary are
// cached separately by Transformers.js in the "transformers-cache" Cache.
// Bump VERSION whenever index.html or the library version changes.
const VERSION = "soph-v1";
const PRECACHE = ["./", "./index.html"];

// Cross-origin hosts whose responses never change for a pinned URL.
const IMMUTABLE_HOSTS = ["cdn.jsdelivr.net", "fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k.startsWith("soph-") && k !== VERSION).map((k) => caches.delete(k)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Same-origin: network first so new deploys show up, cache as offline fallback.
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
          return res;
        })
        .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match("./index.html"))),
    );
    return;
  }

  // Pinned CDN assets and fonts: cache first.
  // (.wasm is skipped: Transformers.js already caches the ONNX Runtime binary itself.)
  if (IMMUTABLE_HOSTS.includes(url.hostname) && !url.pathname.endsWith(".wasm")) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok || res.type === "opaque") { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
        return res;
      })),
    );
  }
  // Everything else (e.g. huggingface.co model files) passes straight through.
});
