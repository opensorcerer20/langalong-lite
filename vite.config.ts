/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  /* No public/ directory. The shared assets at the repo root are pulled in
     through the bundler instead: fonts via relative url() in styles/fonts.css,
     the design system via a plain import in main.tsx, the favicon via a
     relative href in index.html. All three get hashed into dist/assets. */
  publicDir: false,

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
});
