/* The Vite plugin that makes the build installable: the web app manifest, the
   icons it declares, and the service worker.

   Lives outside src/ because none of it is application code — it runs at build
   time and reads files off disk. What it emits is the app's, but this is the
   thing that assembles it. Not scripts/ either: those are commands you run
   (npm run font, npm run import), and a plugin is something Vite calls.

   Paths here are resolved against this file, so they climb out of tools/. */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { transformWithEsbuild, type Plugin } from 'vite';

import { cacheName, precacheList } from '../src/lib/precache';

/* ── The web app manifest ────────────────────────────────────────────────────

   Ported from prototype/manifest.webmanifest, which the React conversion left
   behind. `name`, `description` and `theme_color` must match index.html.

   start_url and scope are "./" — resolved against the manifest's own url, so an
   install works at a domain root or under a subpath, matching vite's `base`.

   icon-180.png is deliberately absent: it is the apple-touch-icon, and the
   apple-* meta tags are not being added. Nothing references it. */
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

/** `purpose` is the only thing separating the two 512s. */
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
 * Emits the manifest, the icons it declares, and the service worker.
 *
 * - Icons go through emitFile rather than a public/ directory, so they are
 *   hashed like every other asset. publicDir is off; see the note in the config.
 * - `manifest.webmanifest` and `sw.js` have fixed filenames, because both are
 *   named elsewhere: the first by index.html, the second by its registration.
 *   The hashes ride inside them — in the icon urls, and in the precache list.
 * - Every url they contain is relative, resolved against the emitting file,
 *   for the same reason `base` is.
 * - Dev serves the manifest from memory: emitFile throws in serve mode, and a
 *   404 on every page load is how you learn to stop reading the console. No
 *   worker in dev at all — a cache-first worker in front of HMR is an hour
 *   spent debugging a file you already fixed.
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

      /* index.html and the manifest are named rather than read off `bundle`:
         both are emitted during generateBundle, by this plugin and by Vite's
         html plugin, so whether they are in there yet depends on hook order.
         precacheList dedupes, so naming one that is already present is free. */
      const entries = precacheList([...Object.keys(bundle), 'index.html', 'manifest.webmanifest']);

      /* Transpiled alone, not bundled: sw.ts imports nothing, and a worker is
         a separate script with its own global scope. `define` is how the
         generated list reaches it — see the declares at the top of sw.ts. */
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
