/* What the service worker precaches, derived from the filenames Vite emitted.

   Build-time only: vite.config.ts calls this, injects the result into sw.ts,
   and nothing in the running app imports it. It lives here rather than inside
   the plugin so the part with rules in it can be tested. */

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
 * A cache name that changes whenever the precached set does.
 *
 * The entries already carry Vite's content hashes, so hashing the list is
 * enough to make every build a new cache — and `activate` drops the ones that
 * no longer match. That replaces the hand-bumped `tsumiki-v3` in the prototype,
 * which was one forgotten edit away from serving a stale app forever.
 *
 * FNV-1a rather than a crypto hash: cache busting is not a security property,
 * and this stays a plain function with no node imports.
 */
export function cacheName(entries: readonly string[]): string {
  let hash = 2166136261;

  for (const character of entries.join('\n')) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }

  return `tsumiki-${(hash >>> 0).toString(36)}`;
}
