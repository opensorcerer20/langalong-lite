/* Runs before every test file. Adds the DOM matchers (toBeInTheDocument,
   toBeVisible, toBeDisabled …) and clears the rendered tree between tests. */

/* jsdom does not implement IndexedDB, so the storage tests would have nothing
   to run against. Polyfilling it rather than mocking it is the point: upgrade
   paths, transaction lifetimes and key ranges are where IndexedDB bugs live,
   and a mock tests none of them. */
import 'fake-indexeddb/auto';

import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(cleanup);
