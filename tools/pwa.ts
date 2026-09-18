/* The Vite plugin that makes the build installable: the web app manifest, the
   icons it declares, and the service worker. Build-time only. */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { transformWithEsbuild, type Plugin } from 'vite';

import { cacheName, precacheList } from '../src/lib/precache';

/* ── The web app manifest ────────────────────────────────────────────────────

   - `name`, `description` and `theme_color` must match index.html.
   - start_url and scope are "./", matching vite's `base`.
   - icon-180.png is absent on purpose: it is the iOS icon, and the target is
     Android. */
const MANIFEST = {
  name: 'Tsumiki',
  short_name: 'Tsumiki',
  description: 'Build the Japanese sentences you will actually need.',
  start_url: './',
  scope: './',
  display: 'standalone',
  orientation: 'portrait',
  background_color: '#f3f2f2',
  theme_color: '#f3f2f2',
  lang: 'en',
};

const ICONS = [
  { file: 'icon-192.png', sizes: '192x192', purpose: 'any' },
  { file: 'icon-512.png', sizes: '512x512', purpose: 'any' },
  { file: 'icon-maskable-512.png', sizes: '512x512', purpose: 'maskable' },
] as const;

function manifestJson(srcs: readonly string[]) {
  const icons = ICONS.map((icon, index) => ({
    src: srcs[index],
    sizes: icon.sizes,
    type: 'image/png',
    purpose: icon.purpose,
  }));

  return JSON.stringify({ ...MANIFEST, icons }, null, 2);
}

/** A repo-root file, named from here rather than from the working directory. */
function repoFile(path: string): string {
  return fileURLToPath(new URL(`../${path}`, import.meta.url));
}

/**
 * - Icons go through emitFile, not public/, so they are hashed.
 * - Every url emitted is relative, for the same reason as `base`.
 * - Dev serves the manifest from memory, since emitFile throws in serve mode.
 *   No worker in dev: a cache-first worker would fight HMR.
 */
export function pwa(): Plugin {
  let refs: string[] = [];
  let isBuild = false;

  return {
    name: 'tsumiki-pwa',

    configResolved(config) {
      isBuild = config.command === 'build';
    },

    buildStart() {
      if (!isBuild) return;

      refs = ICONS.map((icon) =>
        this.emitFile({
          type: 'asset',
          name: icon.file,
          source: readFileSync(repoFile(`icons/${icon.file}`)),
        }),
      );
    },

    async generateBundle(_options, bundle) {
      this.emitFile({
        type: 'asset',
        fileName: 'manifest.webmanifest',
        source: manifestJson(refs.map((ref) => `./${this.getFileName(ref)}`)),
      });

      /* Named by hand: whether they are in `bundle` yet depends on plugin hook
         order. precacheList dedupes, so a repeat is harmless. */
      const entries = precacheList([...Object.keys(bundle), 'index.html', 'manifest.webmanifest']);

      /* `define` injects the precache list; see the declares in sw.ts. */
      const source = readFileSync(repoFile('src/sw.ts'), 'utf8');
      const { code } = await transformWithEsbuild(source, 'sw.ts', {
        format: 'iife',
        define: {
          __PRECACHE__: JSON.stringify(entries),
          __CACHE_NAME__: JSON.stringify(cacheName(entries)),
        },
      });

      this.emitFile({ type: 'asset', fileName: 'sw.js', source: code });
    },

    configureServer(server) {
      server.middlewares.use('/manifest.webmanifest', (_req, response) => {
        response.setHeader('Content-Type', 'application/manifest+json');
        /* Unhashed: the dev server reads icons/ off disk at its real path. */
        response.end(manifestJson(ICONS.map((icon) => `./icons/${icon.file}`)));
      });
    },
  };
}
