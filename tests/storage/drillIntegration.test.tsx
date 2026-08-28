/* A real drill, played through the real components, into a real database.

   Every other suite covers one side of the seam: the contract tests exercise
   the stores without an app, the recording tests exercise the app without
   IndexedDB. This is the one that would catch the two being wired together
   wrongly — clicking actual tiles and then reading the rows back out. */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';

import { App } from '../../src/components/App';
import { TILE_MULTIPLIER } from '../../src/config';
import { LANGUAGE } from '../../src/data/languages';
import { buildBank } from '../../src/lib/buildBank';
import { itemKey, particleKey, tileKey } from '../../src/lib/keys';
import { revealIndices } from '../../src/lib/revealPlacement';
import { openRepository } from '../../src/storage';
import type { Repository } from '../../src/storage';

const BAKERY = LANGUAGE.scenarios[0]!;
const FIRST_ITEM = BAKERY.items[0]!;
const FIRST_KEY = itemKey(LANGUAGE.code, BAKERY.id, FIRST_ITEM.id);

const bankFor = (index: number) =>
  buildBank(
    BAKERY.items[index]!,
    index,
    { grammar: LANGUAGE.grammar, words: BAKERY.words },
    TILE_MULTIPLIER,
    LANGUAGE.joiner,
  );

let repository: Repository;

beforeEach(async () => {
  globalThis.indexedDB = new IDBFactory();
  repository = await openRepository();
});

/** Open the bakery set, as a learner would. */
async function openBakery(user: ReturnType<typeof userEvent.setup>) {
  render(<App language={LANGUAGE} progress={repository.progress} />);
  await user.click(screen.getByRole('button', { name: /Bakery/ }));
}

/** Click the bank tiles that spell the first item's answer, then Check. */
async function solveFirst(user: ReturnType<typeof userEvent.setup>) {
  const tiles = document.querySelectorAll('[data-variant="bank"]');
  for (const index of revealIndices(FIRST_ITEM, bankFor(0))) {
    await user.click(tiles[index] as HTMLElement);
  }
  await user.click(screen.getByRole('button', { name: 'Check' }));
}

describe('a drill played into IndexedDB', () => {
  it('uses durable storage', () => {
    expect(repository.durable).toBe(true);
  });

  it('writes the sentence and its tiles to the database', async () => {
    const user = userEvent.setup();
    await openBakery(user);
    await solveFirst(user);

    expect(await repository.progress.getSchedule(FIRST_KEY)).toMatchObject({
      attempts: 1,
      correct: 1,
      reps: 1,
      lastResult: 'right',
      schedulerVersion: 0,
    });

    for (const tile of FIRST_ITEM.ans) {
      expect(
        await repository.progress.getSchedule(tileKey(LANGUAGE.code, tile)),
        `no row for ${tile[0]}`,
      ).toMatchObject({ unit: 'tile', correct: 1 });
    }
  });

  /* The whole reason Phase 0's tagging exists, proven end to end rather than
     at the seam: clicking real tiles in the real app produces a row against the
     grammar point the sentence teaches, not only against the sentence. */
  it('writes the grammar points the sentence is tagged with', async () => {
    const user = userEvent.setup();
    await openBakery(user);
    await solveFirst(user);

    expect(FIRST_ITEM.tags.particles.length).toBeGreaterThan(0);
    for (const id of FIRST_ITEM.tags.particles) {
      expect(
        await repository.progress.getSchedule(particleKey(LANGUAGE.code, id)),
        `no row for particle "${id}"`,
      ).toMatchObject({ unit: 'particle', correct: 1 });
    }
  });

  it('stamps the stored rows with the exercise and the situation', async () => {
    const user = userEvent.setup();
    await openBakery(user);
    await solveFirst(user);

    const [logged] = await repository.progress.attemptsFor(FIRST_KEY);
    expect(logged).toMatchObject({ mode: 'sentence', scenarioId: BAKERY.id });
  });

  it('survives the app being torn down and reopened', async () => {
    const user = userEvent.setup();
    await openBakery(user);
    await solveFirst(user);

    /* A second repository over the same database — what a reload looks like. */
    const reopened = await openRepository();
    expect(await reopened.progress.getSchedule(FIRST_KEY)).toMatchObject({ correct: 1 });
  });

  it('makes what was answered queryable as due work', async () => {
    const user = userEvent.setup();
    await openBakery(user);
    await solveFirst(user);

    const due = await repository.progress.due(LANGUAGE.code, Date.now(), 50);
    expect(due.some((row) => row.key === FIRST_KEY)).toBe(true);
  });

  it('records a miss before the answer that follows it', async () => {
    const user = userEvent.setup();
    await openBakery(user);

    const tiles = document.querySelectorAll('[data-variant="bank"]');
    await user.click(tiles[0] as HTMLElement);
    await user.click(screen.getByRole('button', { name: 'Check' }));
    await solveFirst(user);

    const log = await repository.progress.attemptsFor(FIRST_KEY);
    expect(log.map((a) => a.outcome)).toEqual(['wrong', 'right']);
    expect(log.map((a) => a.misses)).toEqual([0, 1]);
  });
});
