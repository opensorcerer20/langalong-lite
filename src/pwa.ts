/* Installing the service worker, and getting out from under a foreign one.

   Pairs with sw.ts: that file is the worker, this one registers it. Not in
   lib/, which is pure — this reaches for navigator and returns nothing. */

/** Resolved against the document, so a subpath deploy scopes the worker to it. */
const SCRIPT = './sw.js';

/**
 * Install the service worker, once the page has finished loading.
 *
 * - Production only. A cache-first worker in front of the dev server hands you
 *   back the file you just fixed.
 * - Deferred to `load`, so precaching the bundle does not compete with the
 *   fonts still arriving.
 * - Nothing waits on this and nothing observes it. Offline support is either
 *   there on the next visit or it is not.
 */
export function registerServiceWorker(): void {
  /* `serviceWorker` is absent rather than failing outside a secure context —
     plain http to a phone on the LAN, say. The app works, minus offline. */
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;

  if (document.readyState === 'complete') void install();
  else window.addEventListener('load', () => void install(), { once: true });
}

async function install(): Promise<void> {
  try {
    await dropForeignWorker();
    await navigator.serviceWorker.register(SCRIPT);
  } catch (error) {
    /* Shaped like openRepository's warning: name the consequence, not the api. */
    console.warn('Tsumiki: offline support is unavailable this session.', error);
  }
}

/**
 * Unregister a worker that is controlling this page and is not ours.
 *
 * `github.io` is a single origin shared by every repository's Pages site, so a
 * root-scoped worker left behind by another project would serve its cached
 * shell here. The prototype's worker is the documented case — see
 * MAINTENANCE.md.
 *
 * Narrow on purpose: a worker scoped to someone else's directory never controls
 * this page, so it is not in `controller` and is left alone. No reload either —
 * our worker claims the page on activate, and the next load is clean.
 */
async function dropForeignWorker(): Promise<void> {
  const { controller } = navigator.serviceWorker;
  if (!controller) return;
  if (controller.scriptURL === new URL(SCRIPT, location.href).href) return;

  for (const registration of await navigator.serviceWorker.getRegistrations()) {
    if (registration.active?.scriptURL === controller.scriptURL) {
      await registration.unregister();
    }
  }
}
