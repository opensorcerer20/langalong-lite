/* ESLint, flat config.

   Deliberately narrow. `tsc` already runs in strict mode with
   noUncheckedIndexedAccess and exactOptionalPropertyTypes, so type correctness
   is settled before ESLint sees the file — what is left for it is the class of
   thing types cannot express. In practice that is the React rules: a hook
   called conditionally, or a dependency array that has gone stale.

   Rules are not type-aware (no `projectService`). Type-aware linting would add
   no-floating-promises, which this codebase would actually use — see
   fireAndForget in useTsumiki — but it roughly triples the run and duplicates
   what `npm run typecheck` already does. Worth revisiting, not worth assuming.

   eslint-config-prettier goes last and only ever turns rules off: formatting is
   Prettier's job, so the two can never disagree about it. */

import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  /* Not linted. `_ds/` and `prototype/` are vendored and frozen; the rest is
     generated or installed. Mirrors .prettierignore. */
  {
    ignores: ['dist/', 'node_modules/', '_ds/', 'prototype/', '.vite/'],
  },

  js.configs.recommended,
  tseslint.configs.recommended,

  {
    files: ['**/*.{ts,tsx}'],
    /* `configs.flat` is the namespace holding the flat-config versions; the
       top-level `configs.recommended` is still the eslintrc one and ESLint 10
       rejects it outright. */
    extends: [reactHooks.configs.flat['recommended-latest']],
    rules: {
      /* The repo's own convention, which tsc does not enforce: an intentionally
         unused binding is named with a leading underscore. `withoutLexicon` in
         assemblePack.ts destructures one out on purpose. */
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
    },
  },

  /* Fast Refresh only reloads a module cleanly when it exports components and
     nothing else. This catches the accidental helper export that silently turns
     hot reload into a full page reload. */
  {
    files: ['src/components/**/*.tsx'],
    extends: [reactRefresh.configs.vite],
  },

  prettier,
);
