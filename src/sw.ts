/* The service worker. Cache-first over a precached shell, so Tsumiki opens
   offline and the lessons come with it — the packs are bundled into the JS, so
   there is no separate content cache to keep.

   Not part of the app bundle. vite.config.ts transpiles this file on its own,
   replaces the two injected constants, and emits it as dist/sw.js. It therefore
   cannot import anything: what it needs has to arrive through `define`. */

/** The urls to precache. Injected; see precacheList in lib/precache.ts. */
declare const __PRECACHE__: readonly string[];

/** Named for this build's content, so a new build is a new cache. */
declare const __CACHE_NAME__: string;

/* ── The worker globals ──────────────────────────────────────────────────────

   Declared here rather than by adding "WebWorker" to tsconfig's lib: that is
   program-wide, and it redeclares enough of DOM to break every component. Only
   the handful of members this file touches are described. */

interface WorkerEvent extends Event {
  waitUntil(work: Promise<unknown>): void;
}

interface WorkerFetchEvent extends Event {
  readonly request: Request;
  respondWith(response: Response | Promise<Response>): void;
}

interface WorkerScope {
  addEventListener(type: 'install' | 'activate', listener: (event: WorkerEvent) => void): void;
  addEventListener(type: 'fetch', listener: (event: WorkerFetchEvent) => void): void;
  readonly clients: { claim(): Promise<void> };
}

const worker = self as unknown as WorkerScope;

/* ── Lifecycle ───────────────────────────────────────────────────────────── */

/* No skipWaiting: a new worker installs and then waits. Swapping the bundle
   under a page that is already running is how you get a half-updated app. */
worker.addEventListener('install', (event) => {
  event.waitUntil(caches.open(__CACHE_NAME__).then((cache) => cache.addAll(__PRECACHE__)));
});

worker.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names.filter((name) => name !== __CACHE_NAME__).map((name) => caches.delete(name)),
        ),
      )
      /* Take over open pages now. By this point they are already being served
         the build this cache belongs to, so there is nothing to mismatch. */
      .then(() => worker.clients.claim()),
  );
});

/* ── Serving ─────────────────────────────────────────────────────────────── */

worker.addEventListener('fetch', (event) => {
  const { request } = event;

  /* Let the network have everything this worker has no opinion about: writes,
     and anything off-origin. Returning without respondWith is the default. */
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== location.origin) return;

  event.respondWith(serve(request));
});

async function serve(request: Request): Promise<Response> {
  const hit = await caches.match(request);
  if (hit) return hit;

  try {
    return await fetch(request);
  } catch (error) {
    /* Offline and not precached. A navigation still has an answer — the app
       shell renders the same at any url, because there is no router. Anything
       else genuinely failed. */
    if (request.mode === 'navigate') {
      const shell = await caches.match('./index.html');
      if (shell) return shell;
    }
    throw error;
  }
}

/* Makes this a module, which isolatedModules requires. esbuild emits an IIFE,
   so nothing survives into the classic worker script. */
export {};
