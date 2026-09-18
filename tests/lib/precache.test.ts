/* The precache list and the cache name derived from it.

   Both are build-time, but neither is observable until a worker is already
   installed in someone's browser — a wrong list means the app opens offline
   and is missing its stylesheet, and a cache name that fails to change means
   a build that never reaches anyone. */

import { describe, expect, it } from 'vitest';

import { cacheName, precacheList } from '../../src/lib/precache';

/* The shape a real build produces, shortened. */
const BUNDLE = [
  'index.html',
  'manifest.webmanifest',
  'sw.js',
  'assets/index-Bh-vP1k9.js',
  'assets/index-BIVAEjMb.css',
  'assets/noto-sans-jp-subset-Dl03R6Sl.woff2',
];

describe('precacheList', () => {
  it('leads with the directory, which is what a visit to the root asks for', () => {
    expect(precacheList(BUNDLE)[0]).toBe('./');
  });

  it('caches index.html as well, for a visit that names it', () => {
    expect(precacheList(BUNDLE)).toContain('./index.html');
  });

  it('excludes the worker, which must never serve its own replacement', () => {
    expect(precacheList(BUNDLE)).not.toContain('./sw.js');
  });

  it('keeps the hashed filenames, which is what makes the list build-specific', () => {
    expect(precacheList(BUNDLE)).toContain('./assets/index-Bh-vP1k9.js');
  });

  it('makes every url relative, so one worker serves a root and a subpath', () => {
    for (const entry of precacheList(BUNDLE)) {
      expect(entry.startsWith('./')).toBe(true);
    }
  });

  it('dedupes, because the plugin names index.html whether or not it is in the bundle', () => {
    const listed = precacheList([...BUNDLE, 'index.html', 'manifest.webmanifest']);

    expect(listed).toEqual(precacheList(BUNDLE));
    expect(listed.filter((entry) => entry === './index.html')).toHaveLength(1);
  });

  it('is order-independent, so hook ordering cannot change the cache name', () => {
    expect(precacheList([...BUNDLE].reverse())).toEqual(precacheList(BUNDLE));
  });
});

describe('cacheName', () => {
  it('is stable across identical builds', () => {
    expect(cacheName(precacheList(BUNDLE))).toBe(cacheName(precacheList(BUNDLE)));
  });

  it('changes when a hashed asset does — the whole point of deriving it', () => {
    const rebuilt = BUNDLE.map((name) =>
      name === 'assets/index-Bh-vP1k9.js' ? 'assets/index-NEWHASH1.js' : name,
    );

    expect(cacheName(precacheList(rebuilt))).not.toBe(cacheName(precacheList(BUNDLE)));
  });

  it('changes when a file is added', () => {
    const added = [...BUNDLE, 'assets/icon-512-C3kAtHLj.png'];

    expect(cacheName(precacheList(added))).not.toBe(cacheName(precacheList(BUNDLE)));
  });

  it('changes when a file is removed', () => {
    const removed = BUNDLE.filter((name) => name !== 'assets/index-BIVAEjMb.css');

    expect(cacheName(precacheList(removed))).not.toBe(cacheName(precacheList(BUNDLE)));
  });

  it('is a plain cache-storage key', () => {
    expect(cacheName(precacheList(BUNDLE))).toMatch(/^tsumiki-[0-9a-z]+$/);
  });
});
