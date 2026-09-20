(() => {
  var define_PRECACHE_default = ["./", "./assets/archivo-latin-var-BEIDiHaE.woff2", "./assets/icon-192-DcT1qyrs.png", "./assets/icon-512-C3kAtHLj.png", "./assets/icon-maskable-512-D54OnO-t.png", "./assets/index-Bhl10IqL.js", "./assets/index-DumezOf1.css", "./assets/noto-sans-jp-subset-Dl03R6Sl.woff2", "./index.html", "./manifest.webmanifest"];
  const worker = self;
  worker.addEventListener("install", (event) => {
    event.waitUntil(
      caches.open("tsumiki-o3a68e").then((cache) => cache.addAll(define_PRECACHE_default)).then(() => worker.skipWaiting())
    );
  });
  worker.addEventListener("activate", (event) => {
    event.waitUntil(
      caches.keys().then(
        (names) => Promise.all(
          names.filter((name) => name !== "tsumiki-o3a68e").map((name) => caches.delete(name))
        )
      ).then(() => worker.clients.claim())
    );
  });
  worker.addEventListener("fetch", (event) => {
    const { request } = event;
    if (request.method !== "GET") return;
    if (new URL(request.url).origin !== location.origin) return;
    event.respondWith(serve(request));
  });
  async function serve(request) {
    const hit = await caches.match(request);
    if (hit) return hit;
    try {
      return await fetch(request);
    } catch (error) {
      if (request.mode === "navigate") {
        const shell = await caches.match("./index.html");
        if (shell) return shell;
      }
      throw error;
    }
  }
})();
