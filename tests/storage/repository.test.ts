/* Assembling the repository, and the degradation path.

   The fallback is the part worth testing: a learner in a private window with
   site data blocked should still get a working drill, and the app should know
   that it is not saving anything rather than quietly assuming it is. */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';

import { LANGUAGE, LANGUAGES } from '../../src/data/languages';
import { openRepository } from '../../src/storage';

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('openRepository', () => {
  it('reports durable storage when IndexedDB opens', async () => {
    const repository = await openRepository();
    expect(repository.durable).toBe(true);
  });

  it('serves the compiled packs through the content source', async () => {
    const repository = await openRepository();
    expect(await repository.content.languages()).toBe(LANGUAGES);
    expect(await repository.content.active()).toBe(LANGUAGE);
  });

  it('stores and reads progress back through the assembled store', async () => {
    const repository = await openRepository();
    await repository.progress.recordAttempt({
      key: 'ja:item:bakery:01',
      languageCode: 'ja',
      unit: 'item',
      at: 1_700_000_000_000,
      outcome: 'right',
      misses: 0,
      durationMs: 2500,
    });
    expect(await repository.progress.getSchedule('ja:item:bakery:01')).toMatchObject({ correct: 1 });
  });

  describe('when IndexedDB cannot be opened', () => {
    beforeEach(() => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      // @ts-expect-error — removing the global is the condition under test
      delete globalThis.indexedDB;
    });

    /* Working, but honest about it: progress still records, and `durable` says
       the recording will not outlive the session. */
    it('still returns a working repository, and says it is not durable', async () => {
      const repository = await openRepository();
      expect(repository.durable).toBe(false);

      await repository.progress.recordAttempt({
        key: 'ja:item:bakery:01',
        languageCode: 'ja',
        unit: 'item',
        at: 1_700_000_000_000,
        outcome: 'right',
        misses: 0,
        durationMs: 2500,
      });
      expect(await repository.progress.getSchedule('ja:item:bakery:01')).toMatchObject({ correct: 1 });
    });

    it('still serves content — the drill does not depend on storage', async () => {
      const repository = await openRepository();
      expect(await repository.content.active()).toBe(LANGUAGE);
    });
  });
});
