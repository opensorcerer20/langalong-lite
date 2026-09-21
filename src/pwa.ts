/* Registering sw.ts, and getting out from under a foreign worker. */

/** Relative, so it works under the GitHub Pages subpath. */
const SCRIPT = './sw.js';

/**
 * - Production only: a cache-first worker would fight the dev server.
 * - Deferred to `load`, so precaching does not compete with the fonts.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;

  if (document.readyState === 'complete') void install();
  else window.addEventListener('load', () => void install(), { once: true });
}

async function install(): Promise<void> {
  try {
    await dropForeignWorker();
    await navigator.serviceWorker.register(SCRIPT);
  } catch (error) {
    console.warn('Tsumiki: offline support is unavailable this session.', error);
  }
}

/**
 * Unregister a worker that is controlling this page and is not ours.
 *
 * `github.io` is a single origin shared by every repository's Pages site, so a
 * root-scoped worker left behind by another project would serve its cached
 * shell here — the prototype's worker, for one.
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
