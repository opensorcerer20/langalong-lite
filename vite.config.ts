/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import stylex from '@stylexjs/unplugin/vite';

import { pwa } from './tools/pwa';

/**
 * The StyleX plugin, with its dev-server hook kept only for `npm run dev`.
 *
 * The hook starts an HMR poll that is only cleared when a listening http
 * server closes. Vitest (`test`) and vite-node scripts (`script`) never
 * listen, so the poll keeps the process alive after it finishes.
 */
function stylexFor(mode: string) {
  const plugin = stylex();
  if (mode === 'development') return plugin;

  const { configureServer: _configureServer, ...withoutDevServer } = plugin;
  return withoutDevServer;
}

export default defineConfig(({ mode }) => {
  /* loadEnv, because Vite reads this file before .env. The empty prefix loads
     non-VITE_ keys too, so DEV_PORT stays out of the client bundle. */
  const env = loadEnv(mode, '.', '');

  /* Optional, in .env.local. Unset, Vite picks its own port. */
  const devPort = Number(env['DEV_PORT']) || undefined;

  return {
    /* StyleX must run under Vitest too: an uncompiled stylex.create() throws.
       Ahead of react(), as its docs place it. */
    plugins: [stylexFor(mode), react(), pwa()],

    /* Relative urls, so dist/ works under the GitHub Pages subpath. */
    base: './',

    /* No public/: fonts, icons and the design system go through the bundler
       and get hashed. */
    publicDir: false,

    /* Spread, not assigned: exactOptionalPropertyTypes forbids `port: undefined`. */
    server: {
      ...(devPort === undefined ? {} : { port: devPort }),
      strictPort: devPort !== undefined,
    },

    preview: {
      ...(devPort === undefined ? {} : { port: devPort + 1 }),
      strictPort: devPort !== undefined,
    },

    /* Only index.html: prototype/ must never become a build input. */
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
