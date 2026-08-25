/* The drill rules. No content is loaded here — the item and bank a transition
   needs come in on the action, which is the point of keeping the reducer free
   of data imports. */

import { describe, expect, it } from 'vitest';

import type { SentenceItem, Tile } from '../../src/data/types';
import { appReducer, initialState, isDone } from '../../src/state/appReducer';
import type { AppAction, AppState } from '../../src/state/appReducer';

const BANK: readonly Tile[] = [
  ['ください', 'kudasai'],
  ['は', 'wa'],
  ['パン', 'pan'],
  ['を', 'o'],
];

const ITEM: SentenceItem = {
  en: 'One bread, please.',
  ans: [['パン', 'pan'], ['を', 'o'], ['ください', 'kudasai']],
  alts: ['パンをお願いします'],
  note: 'を marks the direct object.',
};

/** パン + を + ください, in bank positions. */
const RIGHT = [2, 3, 0];
const WRONG = [2, 1, 0];

const drilling = (over: Partial<AppState> = {}): AppState => ({
  ...initialState,
  screen: 'drill',
  ...over,
});

const run = (state: AppState, ...actions: AppAction[]) => actions.reduce(appReducer, state);

const place = (state: AppState, positions: number[]) =>
  run(state, ...positions.map((bankIndex): AppAction => ({ type: 'tap', bankIndex })));

const CHECK: AppAction = { type: 'check', item: ITEM, bank: BANK };
const REVEAL: AppAction = { type: 'reveal', item: ITEM, bank: BANK };

describe('navigation', () => {
  it('opens a scenario on the drill screen at its first item', () => {
    const state = appReducer(initialState, { type: 'openScenario', scenario: 1 });
    expect(state).toMatchObject({ screen: 'drill', scenario: 1, item: 0, finished: false });
  });

  it('restarts a set from scratch when it is reopened, score included', () => {
    const midway = drilling({ scenario: 1, item: 4, firstTry: 3, misses: 2, placed: [1] });
    expect(appReducer(midway, { type: 'openScenario', scenario: 1 })).toMatchObject({
      item: 0,
      firstTry: 0,
      misses: 0,
      placed: [],
    });
  });

  it('goes home without discarding the drill in progress', () => {
    const midway = drilling({ item: 3, firstTry: 2 });
    expect(appReducer(midway, { type: 'goHome' })).toMatchObject({
      screen: 'home',
      item: 3,
      firstTry: 2,
    });
  });
});

describe('placing tiles', () => {
  it('appends taps to the answer line in order', () => {
    expect(place(drilling(), [2, 3]).placed).toEqual([2, 3]);
  });

  it('removes a placed tile by its position, not its bank index', () => {
    const state = place(drilling(), [2, 3, 0]);
    expect(appReducer(state, { type: 'untap', position: 1 }).placed).toEqual([2, 0]);
  });

  it('ignores a tile that is already placed', () => {
    const state = place(drilling(), [2]);
    expect(appReducer(state, { type: 'tap', bankIndex: 2 }).placed).toEqual([2]);
  });

  it('clears a "not quite" status as soon as a tile is placed', () => {
    const missed = run(drilling(), ...[2, 1, 0].map((b): AppAction => ({ type: 'tap', bankIndex: b })), CHECK);
    expect(missed.status).toBe('wrong');
    expect(appReducer(missed, { type: 'tap', bankIndex: 2 }).status).toBe('idle');
  });

  it('locks the answer line once the answer is settled', () => {
    for (const status of ['right', 'shown'] as const) {
      const settled = drilling({ status, placed: RIGHT });
      expect(appReducer(settled, { type: 'tap', bankIndex: 1 }).placed).toEqual(RIGHT);
      expect(appReducer(settled, { type: 'untap', position: 0 }).placed).toEqual(RIGHT);
    }
  });
});

describe('checking', () => {
  it('accepts the canonical answer', () => {
    expect(run(place(drilling(), RIGHT), CHECK).status).toBe('right');
  });

  it('clears the answer line and counts a miss when wrong', () => {
    const state = run(place(drilling(), WRONG), CHECK);
    expect(state).toMatchObject({ status: 'wrong', misses: 1, placed: [] });
  });

  it('accumulates misses across attempts', () => {
    const twice = run(place(run(place(drilling(), WRONG), CHECK), WRONG), CHECK);
    expect(twice.misses).toBe(2);
  });

  it('does nothing on an empty answer line', () => {
    const empty = drilling();
    expect(appReducer(empty, CHECK)).toBe(empty);
  });

  it('does nothing once the answer is settled', () => {
    const settled = drilling({ status: 'right', placed: RIGHT, firstTry: 1 });
    expect(appReducer(settled, CHECK)).toBe(settled);
  });
});

describe('the first-try score', () => {
  it('credits an answer built with no prior miss', () => {
    expect(run(place(drilling(), RIGHT), CHECK).firstTry).toBe(1);
  });

  it('withholds credit after a miss', () => {
    const afterMiss = run(place(drilling(), WRONG), CHECK);
    expect(run(place(afterMiss, RIGHT), CHECK).firstTry).toBe(0);
  });

  it('withholds credit when the answer was revealed', () => {
    expect(run(place(drilling(), WRONG), CHECK, REVEAL).firstTry).toBe(0);
  });

  it('accumulates across items', () => {
    let state = run(place(drilling(), RIGHT), CHECK, { type: 'next', itemCount: 3 });
    state = run(place(state, RIGHT), CHECK);
    expect(state.firstTry).toBe(2);
  });
});

describe('revealing', () => {
  it('fills the answer line with the answer and locks it', () => {
    const state = appReducer(drilling(), REVEAL);
    expect(state.placed).toEqual(RIGHT);
    expect(state.status).toBe('shown');
    expect(isDone(state)).toBe(true);
  });

  it('replaces whatever was already placed', () => {
    expect(appReducer(place(drilling(), [1]), REVEAL).placed).toEqual(RIGHT);
  });

  it('does not count as a miss', () => {
    expect(appReducer(drilling({ misses: 3 }), REVEAL).misses).toBe(3);
  });
});

describe('advancing', () => {
  it('moves to the next item with a clean slate but keeps the score', () => {
    const state = run(place(drilling(), RIGHT), CHECK, { type: 'next', itemCount: 3 });
    expect(state).toMatchObject({
      item: 1,
      placed: [],
      misses: 0,
      status: 'idle',
      finished: false,
      firstTry: 1,
    });
  });

  it('finishes the set on the last item instead of running past the end', () => {
    const last = drilling({ item: 2, firstTry: 2 });
    const state = appReducer(last, { type: 'next', itemCount: 3 });
    expect(state).toMatchObject({ item: 2, finished: true, firstTry: 2 });
  });

  it('restarts the set from the top and resets the score', () => {
    const finished = drilling({ item: 2, finished: true, firstTry: 2, status: 'right' });
    expect(appReducer(finished, { type: 'restart' })).toMatchObject({
      item: 0,
      finished: false,
      firstTry: 0,
      misses: 0,
      placed: [],
      status: 'idle',
      screen: 'drill',
    });
  });
});

describe('isDone', () => {
  it('is true only once the answer is settled', () => {
    expect(isDone(drilling({ status: 'idle' }))).toBe(false);
    expect(isDone(drilling({ status: 'wrong' }))).toBe(false);
    expect(isDone(drilling({ status: 'right' }))).toBe(true);
    expect(isDone(drilling({ status: 'shown' }))).toBe(true);
  });
});
