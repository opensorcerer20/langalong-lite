/* The service worker: cache-first over a precached shell. The lessons are
   bundled into the JS, so there is no separate content cache.

   Transpiled alone by tools/pwa.ts, so it cannot import anything; the two
   constants below arrive through `define`. */

/** The urls to precache. Injected; see precacheList in lib/precache.ts. */
declare const __PRECACHE__: readonly string[];

/** Named for this build's content, so a new build is a new cache. */
declare const __CACHE_NAME__: string;

/* ── The worker globals ──────────────────────────────────────────────────────

   Declared by hand: adding "WebWorker" to tsconfig's lib is program-wide and
   breaks the DOM types every component uses. */

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
  skipWaiting(): Promise<void>;
}

const worker = self as unknown as WorkerScope;

/* ── Lifecycle ───────────────────────────────────────────────────────────── */

/* skipWaiting, so a new build takes over on the next launch; an installed app
   is rarely fully closed. Safe only because the build is one bundle with no
   code splitting. Revisit if a lazy import ever appears. */
worker.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(__CACHE_NAME__)
      .then((cache) => cache.addAll(__PRECACHE__))
      .then(() => worker.skipWaiting()),
  );
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
      .then(() => worker.clients.claim()),
  );
});

/* ── Serving ─────────────────────────────────────────────────────────────── */

worker.addEventListener('fetch', (event) => {
  const { request } = event;

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
    /* Offline navigation to any url gets the shell: there is no router. */
    if (request.mode === 'navigate') {
      const shell = await caches.match('./index.html');
      if (shell) return shell;
    }
    throw error;
  }
}

/* Required by isolatedModules; the emitted IIFE drops it. */
export {};
