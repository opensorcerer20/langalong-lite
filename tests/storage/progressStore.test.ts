/* The ProgressStore contract, run over both implementations.

   One suite, two stores. The in-memory store is both the test double and the
   fallback a learner actually gets when IndexedDB will not open, so the two
   behaving differently would be a real bug rather than a test-only one — which
   is why the contract is written once and applied to both rather than each
   store getting its own tests. */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';

import type { NewAttempt } from '../../src/lib/progress';
import { SCHEDULER_VERSION } from '../../src/lib/progress';
import { openDatabase } from '../../src/storage/db';
import { createIdbProgressStore } from '../../src/storage/idbProgressStore';
import { createMemoryProgressStore } from '../../src/storage/memoryProgressStore';
import type { ProgressStore } from '../../src/storage/types';

const T0 = 1_700_000_000_000;

function attempt(over: Partial<NewAttempt> = {}): NewAttempt {
  return {
    key: 'ja:item:bakery:01',
    languageCode: 'ja',
    unit: 'item',
    at: T0,
    outcome: 'right',
    misses: 0,
    durationMs: 4200,
    ...over,
  };
}

/* Each implementation is created fresh per test. The IndexedDB one gets a new
   factory as well, so no state leaks between tests through the database. */
const IMPLEMENTATIONS: readonly [string, () => Promise<ProgressStore>][] = [
  ['memory', async () => createMemoryProgressStore()],
  [
    'indexeddb',
    async () => {
      globalThis.indexedDB = new IDBFactory();
      return createIdbProgressStore(await openDatabase());
    },
  ],
];

describe.each(IMPLEMENTATIONS)('ProgressStore (%s)', (_name, create) => {
  let store: ProgressStore;

  beforeEach(async () => {
    store = await create();
  });

  afterEach(async () => {
    await store.clear();
  });

  it('has nothing to say about a key never attempted', async () => {
    expect(await store.getSchedule('ja:item:bakery:01')).toBeUndefined();
    expect(await store.attemptsFor('ja:item:bakery:01')).toEqual([]);
  });

  it('creates a row on the first attempt', async () => {
    await store.recordAttempt(attempt());

    expect(await store.getSchedule('ja:item:bakery:01')).toMatchObject({
      key: 'ja:item:bakery:01',
      languageCode: 'ja',
      unit: 'item',
      firstSeenAt: T0,
      lastSeenAt: T0,
      lastResult: 'right',
      attempts: 1,
      correct: 1,
      reps: 1,
      lapses: 0,
    });
  });

  it('leaves the scheduler fields untouched, because no scheduler has run', async () => {
    await store.recordAttempt(attempt());
    const row = await store.getSchedule('ja:item:bakery:01');

    expect(row).toMatchObject({
      schedulerVersion: SCHEDULER_VERSION,
      intervalDays: 0,
      stability: null,
      difficulty: null,
      /* Due now: everything seen is reviewable until something schedules it. */
      dueAt: T0,
    });
  });

  it('accumulates attempts into one row and keeps firstSeenAt', async () => {
    await store.recordAttempt(attempt({ at: T0 }));
    await store.recordAttempt(attempt({ at: T0 + 1000, outcome: 'wrong', misses: 1 }));
    await store.recordAttempt(attempt({ at: T0 + 2000 }));

    expect(await store.getSchedule('ja:item:bakery:01')).toMatchObject({
      firstSeenAt: T0,
      lastSeenAt: T0 + 2000,
      attempts: 3,
      correct: 2,
      lapses: 1,
      reps: 1,
    });
  });

  it('keeps the attempt log append-only and in order', async () => {
    await store.recordAttempt(attempt({ at: T0, outcome: 'wrong' }));
    await store.recordAttempt(attempt({ at: T0 + 1000, outcome: 'shown' }));
    await store.recordAttempt(attempt({ at: T0 + 2000, outcome: 'right' }));

    const log = await store.attemptsFor('ja:item:bakery:01');
    expect(log.map((a) => a.outcome)).toEqual(['wrong', 'shown', 'right']);
    expect(log.map((a) => a.at)).toEqual([T0, T0 + 1000, T0 + 2000]);
  });

  it('keeps separate keys apart', async () => {
    await store.recordAttempt(attempt({ key: 'ja:item:bakery:01' }));
    await store.recordAttempt(attempt({ key: 'ja:tile:パン', unit: 'tile', viaItem: 'ja:item:bakery:01' }));

    expect(await store.getSchedule('ja:item:bakery:01')).toMatchObject({ unit: 'item', attempts: 1 });
    expect(await store.getSchedule('ja:tile:パン')).toMatchObject({ unit: 'tile', attempts: 1 });
  });

  it('round-trips viaItem, which marks a tile row as indirect evidence', async () => {
    await store.recordAttempt(
      attempt({ key: 'ja:tile:パン', unit: 'tile', viaItem: 'ja:item:bakery:01' }),
    );
    const [logged] = await store.attemptsFor('ja:tile:パン');
    expect(logged?.viaItem).toBe('ja:item:bakery:01');
  });

  it('reads many rows at once, skipping keys it has never seen', async () => {
    await store.recordAttempt(attempt({ key: 'ja:item:bakery:01' }));
    await store.recordAttempt(attempt({ key: 'ja:item:bakery:02' }));

    const rows = await store.getSchedules([
      'ja:item:bakery:01',
      'ja:item:bakery:02',
      'ja:item:bakery:99',
    ]);

    expect(rows.size).toBe(2);
    expect(rows.get('ja:item:bakery:01')).toMatchObject({ attempts: 1 });
    expect(rows.get('ja:item:bakery:99')).toBeUndefined();
  });

  describe('due', () => {
    it('returns rows at or before the cutoff, soonest first', async () => {
      await store.recordAttempt(attempt({ key: 'ja:item:bakery:02', at: T0 + 2000 }));
      await store.recordAttempt(attempt({ key: 'ja:item:bakery:01', at: T0 + 1000 }));
      await store.recordAttempt(attempt({ key: 'ja:item:bakery:03', at: T0 + 9000 }));

      const rows = await store.due('ja', T0 + 5000, 10);
      expect(rows.map((r) => r.key)).toEqual(['ja:item:bakery:01', 'ja:item:bakery:02']);
    });

    it('honours the limit', async () => {
      await store.recordAttempt(attempt({ key: 'ja:item:bakery:01', at: T0 + 1000 }));
      await store.recordAttempt(attempt({ key: 'ja:item:bakery:02', at: T0 + 2000 }));

      expect(await store.due('ja', T0 + 5000, 1)).toHaveLength(1);
      expect(await store.due('ja', T0 + 5000, 0)).toHaveLength(0);
    });

    it('does not mix languages', async () => {
      await store.recordAttempt(attempt({ key: 'ja:item:bakery:01' }));
      await store.recordAttempt(attempt({ key: 'es:item:panaderia:01', languageCode: 'es' }));

      expect(await store.due('ja', T0 + 5000, 10)).toHaveLength(1);
      expect(await store.due('es', T0 + 5000, 10)).toHaveLength(1);
      expect(await store.due('de', T0 + 5000, 10)).toHaveLength(0);
    });
  });

  it('forgets everything on clear', async () => {
    await store.recordAttempt(attempt());
    await store.clear();

    expect(await store.getSchedule('ja:item:bakery:01')).toBeUndefined();
    expect(await store.attemptsFor('ja:item:bakery:01')).toEqual([]);
    expect(await store.due('ja', T0 + 5000, 10)).toEqual([]);
  });
});
