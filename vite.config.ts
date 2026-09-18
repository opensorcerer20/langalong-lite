/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import stylex from '@stylexjs/unplugin/vite';

/**
 * The StyleX plugin, with its dev-server hooks removed under Vitest.
 *
 * Vitest boots a Vite dev server, so `configureServer` runs and starts a 150ms
 * HMR poll. That interval is cleared on the http server's `close` event, and
 * Vitest has no http server — so it never clears and the run hangs for ten
 * seconds on exit. Tests need the transform, not the dev middleware.
 *
 * Keyed on `mode` rather than on `process.env.VITEST`, to keep the one Node
 * global this file avoids out of it. `vitest --mode something-else` would lose
 * the workaround and get the hang back, not a wrong result.
 */
function stylexFor(mode: string) {
  const plugin = stylex();
  if (mode !== 'test') return plugin;

  const { configureServer: _configureServer, ...withoutDevServer } = plugin;
  return withoutDevServer;
}

/* ── The web app manifest ────────────────────────────────────────────────────

   Ported from prototype/manifest.webmanifest, which the React conversion left
   behind. `name`, `description` and `theme_color` must match index.html.

   start_url and scope are "./" — resolved against the manifest's own url, so an
   install works at a domain root or under a subpath, matching `base` below.

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

/**
 * Emits the manifest and the icons it declares.
 *
 * - Icons go through emitFile rather than a public/ directory, so they are
 *   hashed like every other asset. publicDir is off; see the note below.
 * - The manifest's own filename is fixed, because index.html links it by name.
 *   The hashes it carries are in the icon urls inside it.
 * - Those urls are "./assets/…", resolved against the manifest — same reason
 *   start_url is relative.
 * - Dev serves it from memory: emitFile throws in serve mode, and a 404 on
 *   every page load is how you learn to stop reading the console.
 */
function pwa(): Plugin {
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
          source: readFileSync(fileURLToPath(new URL(`./icons/${icon.file}`, import.meta.url))),
        }),
      );
    },

    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'manifest.webmanifest',
        source: manifestJson(refs.map((ref) => `./${this.getFileName(ref)}`)),
      });
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

/* The config is a function so it can read .env files. Vite loads this file
   before it processes .env, so process.env does not carry their values here —
   loadEnv is the way to reach them from config. */
export default defineConfig(({ mode }) => {
  /* An empty prefix loads every key rather than only VITE_ ones, and also picks
     up plain shell variables. DEV_PORT deliberately has no VITE_ prefix, so it
     stays a build-time setting and never reaches the client bundle.

     "." rather than process.cwd(): loadEnv joins this with each .env filename
     and stats the result, so a relative dir resolves against the cwd exactly as
     an absolute one does. Saying it this way keeps the sole Node global out of
     an otherwise browser-only project, which would otherwise need @types/node
     on the path — and with it, `process` quietly typechecking inside src/. */
  const env = loadEnv(mode, '.', '');

  /* Set DEV_PORT in .env.local (gitignored) to claim a port that does not
     collide with other dev servers on this machine. Unset, Vite picks its own. */
  const devPort = Number(env['DEV_PORT']) || undefined;

  return {
    /* StyleX compiles away entirely: stylex.create() calls are replaced at build
       time with atomic class names, and the CSS is appended to the app's own CSS
       asset. It has to run in the test pipeline too — an uncompiled
       stylex.create() throws at runtime.

       Ahead of react(), as the plugin's own docs place it. */
    plugins: [stylexFor(mode), react(), pwa()],

    /* Relative asset urls, so dist/ runs wherever it is served from rather than
       only at a domain root. Safe here: there is no router, so no path is ever
       resolved against the document url at runtime. */
    base: './',

    /* No public/ directory. The shared assets at the repo root are pulled in
       through the bundler instead: fonts via relative url() in styles/fonts.css,
       the design system via a plain import in main.tsx, the favicon via a
       relative href in index.html. All three get hashed into dist/assets. */
    publicDir: false,

    /* The port is spread in rather than assigned, because exactOptionalPropertyTypes
       is on: Vite declares `port?: number`, which under that flag means the key may
       be absent but must never be present and undefined. "Unset, Vite picks its own"
       therefore has to mean an omitted key, not an undefined one. */
    server: {
      ...(devPort === undefined ? {} : { port: devPort }),
      /* Fail loudly on a collision rather than silently sliding to the next free
         port, which is how you end up looking at a different app than you think. */
      strictPort: devPort !== undefined,
    },

    /* The preview server is configured separately from the dev server. */
    preview: {
      ...(devPort === undefined ? {} : { port: devPort + 1 }),
      strictPort: devPort !== undefined,
    },

    /* prototype/ is the pre-React app, kept for side-by-side comparison. It is
       served by any static server but must never be treated as a build input. */
    build: {
      rollupOptions: { input: 'index.html' },
    },

    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./tests/setup.ts'],
      include: ['tests/**/*.test.{ts,tsx}'],
      css: true,
    },
  };
});
