/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import stylex from 'unplugin-stylex/vite';

/* The config is a function so it can read .env files. Vite loads this file
   before it processes .env, so process.env does not carry their values here —
   loadEnv is the way to reach them from config. */
export default defineConfig(({ mode }) => {
  /* An empty prefix loads every key rather than only VITE_ ones, and also picks
     up plain shell variables. DEV_PORT deliberately has no VITE_ prefix, so it
     stays a build-time setting and never reaches the client bundle. */
  const env = loadEnv(mode, process.cwd(), '');

  /* Set DEV_PORT in .env.local (gitignored) to claim a port that does not
     collide with other dev servers on this machine. Unset, Vite picks its own. */
  const devPort = Number(env['DEV_PORT']) || undefined;

  return {
    /* StyleX compiles away entirely: stylex.create() calls are replaced at build
       time with atomic class names and the CSS is extracted. It has to run in the
       test pipeline too — an uncompiled stylex.create() throws at runtime. */
    plugins: [react(), stylex()],

    /* No public/ directory. The shared assets at the repo root are pulled in
       through the bundler instead: fonts via relative url() in styles/fonts.css,
       the design system via a plain import in main.tsx, the favicon via a
       relative href in index.html. All three get hashed into dist/assets. */
    publicDir: false,

    server: {
      port: devPort,
      /* Fail loudly on a collision rather than silently sliding to the next free
         port, which is how you end up looking at a different app than you think. */
      strictPort: devPort !== undefined,
    },

    /* The preview server is configured separately from the dev server. */
    preview: {
      port: devPort === undefined ? undefined : devPort + 1,
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
