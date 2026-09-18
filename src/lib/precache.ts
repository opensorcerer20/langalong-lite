/* What the service worker precaches, derived from the filenames Vite emitted.

   Build-time only: tools/pwa.ts calls this and injects the result into sw.ts.
   Kept out of the plugin so it can be tested. */

/** Emitted files that must never be precached. */
const SKIP = new Set(['sw.js']);

/**
 * Bundle filenames -> the urls to cache, relative to the worker.
 *
 * - `./` leads, because a visit to the app's root requests the directory
 *   rather than `index.html`. Caching only the latter misses offline.
 * - Relative throughout, so one `sw.js` works at a domain root and under a
 *   subpath. This is the same constraint `base: './'` is set for.
 * - Deduped and sorted: the result feeds `cacheName`, so two identical builds
 *   have to produce the same list in the same order.
 * - `sw.js` is excluded. A worker that precaches itself can serve its own
 *   replacement out of cache and never update.
 */
export function precacheList(fileNames: Iterable<string>): string[] {
  const files = [...new Set(fileNames)].filter((name) => !SKIP.has(name)).sort();

  return ['./', ...files.map((name) => `./${name}`)];
}

/**
 * A cache name that changes whenever the precached set does. The entries carry
 * Vite's content hashes, so every build gets a new cache and `activate` drops
 * the old one. FNV-1a: cache busting needs no crypto hash.
 */
export function cacheName(entries: readonly string[]): string {
  let hash = 2166136261;

  for (const character of entries.join('\n')) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }

  return `tsumiki-${(hash >>> 0).toString(36)}`;
}
