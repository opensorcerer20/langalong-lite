/* Cache-first service worker: the whole app shell is precached on install, so
   Tsumiki opens offline. Bump CACHE when any precached file changes — the old
   cache is dropped on activate.

   Reference copy. Since the prototype moved under prototype/, this worker's
   scope is prototype/ — the shared fonts/, icons/ and _ds/ at the repo root are
   still precached by addAll(), but the fetch handler below never sees requests
   for them, so a genuinely offline load falls back to system fonts. The React
   app in src/ has no service worker at all; offline support is on the list to
   re-add there. */

const CACHE = "tsumiki-v3";

const SHELL = [
  "./",
  "index.html",
  "app.js",
  "fonts.css",
  "manifest.webmanifest",
  "../fonts/archivo-latin-var.woff2",
  "../fonts/noto-sans-jp-subset.woff2",
  "../_ds/modernist-47face9e-49d1-431f-a4b3-bbfe4229952e/styles.css",
  "../icons/icon-192.png",
  "../icons/icon-512.png",
  "../icons/icon-180.png",
  "../icons/icon-maskable-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).catch(() => {
      /* Offline and not precached: a navigation still gets the shell. */
      if (req.mode === "navigate") return caches.match("index.html");
      return Response.error();
    }))
  );
});
