/* What the drill writes down.

   These are the tests that would notice history quietly stopping — a wiring
   change that leaves the app working perfectly while recording nothing is
   invisible in every other suite here. */

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { LANGUAGE } from '../../src/data/languages';
import { conjugationKey, itemKey, particleKey, tileKey } from '../../src/lib/keys';
import { revealIndices } from '../../src/lib/revealPlacement';
import { createMemoryProgressStore } from '../../src/storage/memoryProgressStore';
import type { ProgressStore } from '../../src/storage/types';
import { useTsumiki } from '../../src/state/useTsumiki';

const BAKERY = LANGUAGE.scenarios[0]!;
const FIRST_ITEM = BAKERY.items[0]!;
const FIRST_KEY = itemKey(LANGUAGE.code, BAKERY.id, FIRST_ITEM.id);

let progress: ProgressStore;

beforeEach(() => {
  progress = createMemoryProgressStore();
});

const open = () => {
  const view = renderHook(() => useTsumiki(LANGUAGE, progress));
  act(() => view.result.current.openScenario(0));
  return view;
};

/** Place the tiles spelling the current item's answer, then check. */
const solve = (view: ReturnType<typeof open>) => {
  const { item, bank } = view.result.current;
  for (const index of revealIndices(item, bank)) act(() => view.result.current.tap(index));
  act(() => view.result.current.check());
};

/** Place one tile that cannot be the whole answer, then check. */
const missOnce = (view: ReturnType<typeof open>) => {
  act(() => view.result.current.tap(0));
  act(() => view.result.current.check());
};

describe('useTsumiki recording', () => {
  it('records a right answer against the item', async () => {
    const view = open();
    solve(view);

    const log = await progress.attemptsFor(FIRST_KEY);
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({ outcome: 'right', misses: 0, unit: 'item', languageCode: 'ja' });
  });

  /* Which exercise a row came from, and which situation it was answered in.
     Neither is recoverable afterwards — a tile key does not say what scenario
     it was drilled in, and nothing in a row says what kind of exercise wrote
     it — so both are taken at the point they are still known. */
  it('stamps every row with the exercise and the situation', async () => {
    const view = open();
    solve(view);

    const log = await progress.attemptsFor(FIRST_KEY);
    expect(log[0]).toMatchObject({ mode: 'sentence', scenarioId: BAKERY.id });

    const onTile = await progress.attemptsFor(tileKey(LANGUAGE.code, FIRST_ITEM.ans[0]!));
    expect(onTile[0]).toMatchObject({ mode: 'sentence', scenarioId: BAKERY.id });
  });

  it('records every check, not only the one that settles the item', async () => {
    const view = open();
    missOnce(view);
    missOnce(view);
    solve(view);

    const log = await progress.attemptsFor(FIRST_KEY);
    expect(log.map((a) => a.outcome)).toEqual(['wrong', 'wrong', 'right']);
  });

  /* The field a scheduler needs to reconstruct one presentation from the log:
     misses === 0 is the first attempt of one. */
  it('carries the misses that preceded each attempt', async () => {
    const view = open();
    missOnce(view);
    missOnce(view);
    solve(view);

    const log = await progress.attemptsFor(FIRST_KEY);
    expect(log.map((a) => a.misses)).toEqual([0, 1, 2]);
  });

  it('keeps a reveal distinct from a wrong answer', async () => {
    const view = open();
    act(() => view.result.current.reveal());

    const log = await progress.attemptsFor(FIRST_KEY);
    expect(log[0]).toMatchObject({ outcome: 'shown' });
  });

  it('times each attempt', async () => {
    const view = open();
    solve(view);

    const [attempt] = await progress.attemptsFor(FIRST_KEY);
    expect(attempt?.durationMs).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(attempt?.durationMs)).toBe(true);
  });

  describe('tiles', () => {
    it('records one indirect attempt per answer tile when the item settles', async () => {
      const view = open();
      solve(view);

      for (const tile of FIRST_ITEM.ans) {
        const log = await progress.attemptsFor(tileKey(LANGUAGE.code, tile));
        expect(log, `no row for ${tile[0]}`).toHaveLength(1);
        expect(log[0]).toMatchObject({ unit: 'tile', outcome: 'right', viaItem: FIRST_KEY });
      }
    });

    /* Without per-token attribution there is nothing to attribute a miss to, so
       a wrong answer must not smear itself across every tile in the bank. */
    it('records nothing against tiles on a wrong answer', async () => {
      const view = open();
      missOnce(view);

      for (const tile of FIRST_ITEM.ans) {
        expect(await progress.attemptsFor(tileKey(LANGUAGE.code, tile))).toEqual([]);
      }
    });

    it('marks a revealed item’s tiles as shown', async () => {
      const view = open();
      act(() => view.result.current.reveal());

      const first = FIRST_ITEM.ans[0]!;
      const log = await progress.attemptsFor(tileKey(LANGUAGE.code, first));
      expect(log[0]).toMatchObject({ outcome: 'shown', viaItem: FIRST_KEY });
    });
  });

  /* The rows that make per-grammar-point history possible at all. A row against
     the sentence can only ever say "missed sentence 1"; a row against
     ja:particle:o is what can eventually say "keeps missing を". */
  describe('grammar tags', () => {
    /* Bakery 01 is tagged with を and nothing else. Read from the content
       rather than written out, so retagging the sentence moves the test with
       it instead of breaking it. */
    const TAGS = FIRST_ITEM.tags;

    it('records one indirect attempt per tagged particle when the item settles', async () => {
      const view = open();
      solve(view);

      expect(TAGS.particles.length, 'the fixture sentence has no particle tags').toBeGreaterThan(0);
      for (const id of TAGS.particles) {
        const log = await progress.attemptsFor(particleKey(LANGUAGE.code, id));
        expect(log, `no row for particle "${id}"`).toHaveLength(1);
        expect(log[0]).toMatchObject({ unit: 'particle', outcome: 'right', viaItem: FIRST_KEY });
      }
    });

    it('records the conjugation patterns a sentence is tagged with', async () => {
      /* Bakery 08 — 払え + ます — is tagged potential and masu. */
      const view = open();
      const tagged = BAKERY.items.findIndex((item) => item.tags.conjugations.length > 0);
      expect(tagged, 'no bakery sentence teaches a conjugation').toBeGreaterThan(-1);

      for (let i = 0; i < tagged; i++) {
        solve(view);
        act(() => view.result.current.next());
      }
      solve(view);

      const item = BAKERY.items[tagged]!;
      for (const id of item.tags.conjugations) {
        const log = await progress.attemptsFor(conjugationKey(LANGUAGE.code, id));
        expect(log, `no row for pattern "${id}"`).toHaveLength(1);
        expect(log[0]).toMatchObject({ unit: 'conjugation', outcome: 'right' });
      }
    });

    /* Same rule as tiles, and for the same reason: checkAnswer judges whole
       joined strings, so a miss cannot be attributed to the particle. Writing
       one anyway would blame を for a word-order mistake. */
    it('records nothing against tags on a wrong answer', async () => {
      const view = open();
      missOnce(view);

      for (const id of TAGS.particles) {
        expect(await progress.attemptsFor(particleKey(LANGUAGE.code, id))).toEqual([]);
      }
    });

    it('marks tag rows as indirect, like tile rows', async () => {
      const view = open();
      act(() => view.result.current.reveal());

      const [id] = TAGS.particles;
      const log = await progress.attemptsFor(particleKey(LANGUAGE.code, id!));
      expect(log[0]).toMatchObject({ outcome: 'shown', viaItem: FIRST_KEY });
    });
  });

  describe('the rolled-up row', () => {
    it('counts the attempts and the successes', async () => {
      const view = open();
      missOnce(view);
      solve(view);

      expect(await progress.getSchedule(FIRST_KEY)).toMatchObject({
        attempts: 2,
        correct: 1,
        reps: 1,
        lapses: 0,
        lastResult: 'right',
      });
    });

    it('leaves the row unscheduled, for a scheduler to pick up later', async () => {
      const view = open();
      solve(view);

      expect(await progress.getSchedule(FIRST_KEY)).toMatchObject({
        schedulerVersion: 0,
        stability: null,
        difficulty: null,
      });
    });
  });

  describe('attempts the reducer would ignore', () => {
    it('records nothing when the answer line is empty', async () => {
      const view = open();
      act(() => view.result.current.check());
      expect(await progress.attemptsFor(FIRST_KEY)).toEqual([]);
    });

    it('records nothing for a check after the item is already settled', async () => {
      const view = open();
      solve(view);
      act(() => view.result.current.check());
      act(() => view.result.current.reveal());

      expect(await progress.attemptsFor(FIRST_KEY)).toHaveLength(1);
    });
  });

  it('drills normally with no store at all', () => {
    const view = renderHook(() => useTsumiki(LANGUAGE));
    act(() => view.result.current.openScenario(0));
    const { item, bank } = view.result.current;
    for (const index of revealIndices(item, bank)) act(() => view.result.current.tap(index));
    act(() => view.result.current.check());

    expect(view.result.current.state.status).toBe('right');
    expect(view.result.current.state.firstTry).toBe(1);
  });

  it('records the second item against its own key', async () => {
    const view = open();
    solve(view);
    act(() => view.result.current.next());
    solve(view);

    const second = itemKey(LANGUAGE.code, BAKERY.id, BAKERY.items[1]!.id);
    expect(await progress.attemptsFor(FIRST_KEY)).toHaveLength(1);
    expect(await progress.attemptsFor(second)).toHaveLength(1);
  });
});
