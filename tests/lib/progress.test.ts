/* The roll-up arithmetic.

   No database in sight, which is the point of keeping this in lib/: these are
   the rules a future scheduler will read, and they are worth pinning down
   independently of where the rows happen to be stored. */

import { describe, expect, it } from 'vitest';

import type { NewAttempt, Outcome, ScheduleRecord, StoredAttempt } from '../../src/lib/progress';
import { hydrateAttempt, rollUp, SCHEDULER_VERSION } from '../../src/lib/progress';

const T0 = 1_700_000_000_000;

function attempt(outcome: Outcome, at = T0, over: Partial<NewAttempt> = {}): NewAttempt {
  return {
    key: 'ja:item:bakery:01',
    languageCode: 'ja',
    unit: 'item',
    mode: 'sentence',
    at,
    outcome,
    misses: outcome === 'right' ? 0 : 1,
    durationMs: 3000,
    ...over,
  };
}

/** Fold a run of outcomes, one per second, from nothing. */
function history(...outcomes: readonly Outcome[]): ScheduleRecord {
  let row: ScheduleRecord | undefined;
  outcomes.forEach((outcome, i) => {
    row = rollUp(row, attempt(outcome, T0 + i * 1000));
  });
  if (!row) throw new Error('history needs at least one outcome');
  return row;
}

describe('rollUp', () => {
  describe('creating a row', () => {
    it('takes its identity from the attempt', () => {
      expect(rollUp(undefined, attempt('right'))).toMatchObject({
        key: 'ja:item:bakery:01',
        languageCode: 'ja',
        unit: 'item',
      });
    });

    it('starts the scheduler fields at their defaults', () => {
      expect(rollUp(undefined, attempt('right'))).toMatchObject({
        schedulerVersion: SCHEDULER_VERSION,
        intervalDays: 0,
        ease: 2.5,
        stability: null,
        difficulty: null,
      });
    });

    it('is due immediately, so the by-due index is ordered from the first row', () => {
      expect(rollUp(undefined, attempt('right', T0)).dueAt).toBe(T0);
    });
  });

  describe('timestamps', () => {
    it('pins firstSeenAt to the first attempt and moves lastSeenAt to the latest', () => {
      const row = history('right', 'wrong', 'right');
      expect(row.firstSeenAt).toBe(T0);
      expect(row.lastSeenAt).toBe(T0 + 2000);
    });
  });

  describe('counting', () => {
    it('counts every attempt but credits only the right ones', () => {
      const row = history('wrong', 'right', 'shown', 'right');
      expect(row.attempts).toBe(4);
      expect(row.correct).toBe(2);
    });
  });

  describe('reps', () => {
    it('builds a run of clean successes', () => {
      expect(history('right', 'right', 'right').reps).toBe(3);
    });

    it('breaks the run on a wrong answer', () => {
      expect(history('right', 'right', 'wrong').reps).toBe(0);
    });

    /* A reveal is not a success. Letting it hold a run would let a learner keep
       a streak alive on sentences they never actually recalled. */
    it('breaks the run on a reveal too', () => {
      expect(history('right', 'right', 'shown').reps).toBe(0);
    });

    it('starts counting again after a break', () => {
      expect(history('right', 'wrong', 'right', 'right').reps).toBe(2);
    });
  });

  describe('lapses', () => {
    it('does not count a first attempt that was wrong — nothing was lost yet', () => {
      expect(history('wrong').lapses).toBe(0);
      expect(history('wrong', 'wrong').lapses).toBe(0);
    });

    it('counts losing something that had been right', () => {
      expect(history('right', 'wrong').lapses).toBe(1);
    });

    it('counts a reveal after a success as a lapse', () => {
      expect(history('right', 'shown').lapses).toBe(1);
    });

    /* The reason lapses key on the transition rather than on the outcome: a
       hard sentence missed repeatedly would otherwise inflate its own count and
       any scheduler reading it would over-punish. */
    it('counts a run of misses as one lapse, not one per miss', () => {
      expect(history('right', 'wrong', 'wrong', 'wrong').lapses).toBe(1);
    });

    it('counts each separate loss', () => {
      expect(history('right', 'wrong', 'right', 'wrong').lapses).toBe(2);
    });
  });

  describe('lastResult', () => {
    it('keeps a reveal distinguishable from a wrong answer', () => {
      expect(history('shown').lastResult).toBe('shown');
      expect(history('wrong').lastResult).toBe('wrong');
    });
  });

  it('never mutates the row it was given', () => {
    const first = rollUp(undefined, attempt('right', T0));
    const snapshot = { ...first };
    rollUp(first, attempt('wrong', T0 + 1000));
    expect(first).toEqual(snapshot);
  });
});

/* Reading back what an older version of the app wrote.

   IndexedDB stores values rather than rows against a schema, so adding a field
   to NewAttempt does not touch what is already in the database. These are the
   only tests of that repair that can ever be written from scratch: once real
   databases exist in the wild, the rows they hold are whatever they are, and a
   mistake here is permanent. */
describe('hydrateAttempt', () => {
  /* Written out as a loose object rather than built from `attempt()`, because
     the whole point is that it is missing fields the current type requires. */
  const legacy: StoredAttempt = {
    key: 'ja:item:bakery:01',
    languageCode: 'ja',
    unit: 'item',
    at: T0,
    outcome: 'right',
    misses: 0,
    durationMs: 3000,
  };

  it('calls a row with no mode a sentence, because nothing else could have written it', () => {
    expect(hydrateAttempt(legacy).mode).toBe('sentence');
  });

  it('recovers the scenario from an item key, which carries one', () => {
    expect(hydrateAttempt(legacy).scenarioId).toBe('bakery');
  });

  /* A tile key genuinely does not record which situation it was answered in.
     Leaving the field absent is the honest answer; inventing one would put a
     wrong scenario into a learner's history rather than a visible gap. */
  it('leaves the scenario absent on a key that cannot say', () => {
    const onTile = hydrateAttempt({ ...legacy, key: 'ja:tile:パン', unit: 'tile' });
    expect(onTile.mode).toBe('sentence');
    expect('scenarioId' in onTile).toBe(false);
  });

  it('leaves an unparseable key alone rather than throwing', () => {
    const bad = hydrateAttempt({ ...legacy, key: 'nonsense' });
    expect(bad.mode).toBe('sentence');
    expect('scenarioId' in bad).toBe(false);
  });

  it('does not overwrite what a current row already says', () => {
    const current = { ...legacy, mode: 'vocab', scenarioId: 'station' } as const;
    expect(hydrateAttempt(current)).toMatchObject({ mode: 'vocab', scenarioId: 'station' });
  });

  it('rolls up into a row indistinguishable from one written today', () => {
    expect(rollUp(undefined, hydrateAttempt(legacy))).toMatchObject({
      key: 'ja:item:bakery:01',
      unit: 'item',
      attempts: 1,
      correct: 1,
    });
  });
});
