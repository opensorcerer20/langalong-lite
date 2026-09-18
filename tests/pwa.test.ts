/* Service worker registration.

   None of this is observable in the app — it either leaves offline support
   behind for the next visit or it does not — so the tests are the only place
   the behaviour is stated. The case worth the most is the narrow one: a foreign
   worker gets unregistered, and a worker that merely exists does not.

   jsdom has no serviceWorker at all, which is the unsupported case for free. */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { registerServiceWorker } from '../src/pwa';

/** Where SCRIPT resolves to, given jsdom serves the document from the root. */
const OURS = 'http://localhost:3000/sw.js';
const FOREIGN = 'http://localhost:3000/prototype/sw.js';

function aRegistration(scriptURL: string) {
  return { active: { scriptURL }, unregister: vi.fn().mockResolvedValue(true) };
}

function fakeContainer(
  options: {
    controller?: { scriptURL: string } | null;
    registrations?: ReturnType<typeof aRegistration>[];
    registerFails?: boolean;
  } = {},
) {
  const register = options.registerFails
    ? vi.fn().mockRejectedValue(new Error('denied'))
    : vi.fn().mockResolvedValue({});

  const container = {
    controller: options.controller ?? null,
    register,
    getRegistrations: vi.fn().mockResolvedValue(options.registrations ?? []),
  };

  Object.defineProperty(navigator, 'serviceWorker', { value: container, configurable: true });
  return container;
}

/* install() is deliberately not awaited by its caller, so the assertions have
   to wait for work nothing handed back. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  vi.stubEnv('PROD', true);
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  Reflect.deleteProperty(navigator, 'serviceWorker');
});

describe('registerServiceWorker', () => {
  it('does nothing in development, where a cache-first worker fights the dev server', async () => {
    vi.stubEnv('PROD', false);
    const container = fakeContainer();

    registerServiceWorker();
    await settle();

    expect(container.register).not.toHaveBeenCalled();
  });

  it('does nothing when the browser has no serviceWorker — plain http, say', async () => {
    expect('serviceWorker' in navigator).toBe(false);

    expect(() => registerServiceWorker()).not.toThrow();
    await settle();
  });

  it('registers the worker relative to the document, so a subpath scopes it', async () => {
    const container = fakeContainer();

    registerServiceWorker();
    await settle();

    expect(container.register).toHaveBeenCalledWith('./sw.js');
  });
});

describe('the foreign worker cleanup', () => {
  it('leaves our own worker alone', async () => {
    const ours = aRegistration(OURS);
    const container = fakeContainer({ controller: { scriptURL: OURS }, registrations: [ours] });

    registerServiceWorker();
    await settle();

    expect(ours.unregister).not.toHaveBeenCalled();
    expect(container.register).toHaveBeenCalled();
  });

  it('does nothing when no worker controls the page', async () => {
    const container = fakeContainer({ controller: null });

    registerServiceWorker();
    await settle();

    expect(container.getRegistrations).not.toHaveBeenCalled();
    expect(container.register).toHaveBeenCalled();
  });

  it('unregisters a foreign worker that is controlling the page, then registers ours', async () => {
    const stale = aRegistration(FOREIGN);
    const container = fakeContainer({ controller: { scriptURL: FOREIGN }, registrations: [stale] });

    registerServiceWorker();
    await settle();

    expect(stale.unregister).toHaveBeenCalled();
    expect(container.register).toHaveBeenCalledWith('./sw.js');
  });

  /* The reason this is keyed on `controller` and not on "is it ours". On
     github.io every repository's Pages site shares one origin, and another
     project's worker scoped to its own directory is none of our business. */
  it('leaves a foreign registration that is not controlling the page', async () => {
    const stale = aRegistration(FOREIGN);
    const somebodyElse = aRegistration('http://localhost:3000/other-project/sw.js');
    fakeContainer({
      controller: { scriptURL: FOREIGN },
      registrations: [stale, somebodyElse],
    });

    registerServiceWorker();
    await settle();

    expect(stale.unregister).toHaveBeenCalled();
    expect(somebodyElse.unregister).not.toHaveBeenCalled();
  });
});

describe('when registration fails', () => {
  it('warns and carries on, because offline is not load-bearing', async () => {
    const container = fakeContainer({ registerFails: true });

    registerServiceWorker();
    await settle();

    expect(container.register).toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith(
      'Tsumiki: offline support is unavailable this session.',
      expect.any(Error),
    );
  });
});
