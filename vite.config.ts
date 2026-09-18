/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import stylex from '@stylexjs/unplugin/vite';

import { pwa } from './tools/pwa';

/**
 * The StyleX plugin, minus its dev-server hook under Vitest.
 *
 * That hook starts an HMR poll that Vitest never clears, hanging every test
 * run for ten seconds on exit. Tests only need the transform.
 */
function stylexFor(mode: string) {
  const plugin = stylex();
  if (mode !== 'test') return plugin;

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
