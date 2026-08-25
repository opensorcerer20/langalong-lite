/* Runs before every test file. Adds the DOM matchers (toBeInTheDocument,
   toBeVisible, toBeDisabled …) and clears the rendered tree between tests. */

import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(cleanup);
