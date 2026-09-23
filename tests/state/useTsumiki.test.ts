/* The hook, driven through act() rather than through components — these are
   about the wiring between content, config and the reducer.

   On a stand-in pack, not the shipped one. What is tested is that the hook
   resolves whatever pack it is handed; the previous version asserted the second
   situation was called "Train station", which made renaming or reordering the
   shipped situations fail a state test. */

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  HIGHLIGHT_AFTER_MISSES,
  NOTE_AFTER_MISSES,
  REVEAL_AFTER_MISSES,
  TIMED_SECONDS,
} from '../../src/config';
import type { LanguagePack, SentenceItem, Tile } from '../../src/data/types';
import { revealIndices } from '../../src/lib/revealPlacement';
import { useTsumiki } from '../../src/state/useTsumiki';

const GRAMMAR: readonly Tile[] = [
  ['を', 'o'],
  ['は', 'wa'],
  ['が', 'ga'],
  ['に', 'ni'],
  ['で', 'de'],
  ['です', 'desu'],
  ['ます', 'masu'],
  ['か', 'ka'],
  ['ください', 'kudasai'],
];

const WORDS: readonly Tile[] = [
  ['パン', 'pan'],
  ['ケーキ', 'keeki'],
  ['これ', 'kore'],
  ['それ', 'sore'],
  ['袋', 'fukuro'],
  ['甘い', 'amai'],
];

const item = (id: string, ans: readonly Tile[], note?: string): SentenceItem => ({
  id,
  en: `Prompt ${id}`,
  ans,
  ...(note === undefined ? {} : { note }),
  tags: { particles: [], conjugations: [] },
});

/* Situation 0 has three items so progress reads in thirds, and its first item
   carries a note — showNote requires one. */
const LANGUAGE: LanguagePack = {
  code: 'xx',
  name: 'Test language',
  joiner: '',
  fontStack: 'serif',
  grammar: GRAMMAR,
  particles: [],
  conjugations: [],
  scenarios: [
    {
      id: 'first',
      name: 'First situation',
      lessonNum: '01',
      blurb: 'The first one.',
      words: WORDS,
      items: [
        item(
          '01',
          [
            ['パン', 'pan'],
            ['を', 'o'],
            ['ください', 'kudasai'],
          ],
          'を marks the object.',
        ),
        item(
          '02',
          [
            ['ケーキ', 'keeki'],
            ['を', 'o'],
            ['ください', 'kudasai'],
          ],
          'The same frame.',
        ),
        item(
          '03',
          [
            ['これ', 'kore'],
            ['は', 'wa'],
            ['甘い', 'amai'],
            ['です', 'desu'],
          ],
          'は is the topic.',
        ),
      ],
    },
    {
      id: 'second',
      name: 'Second situation',
      lessonNum: '02',
      blurb: 'The second one.',
      words: WORDS,
      items: [
        item(
          '01',
          [
            ['袋', 'fukuro'],
            ['を', 'o'],
            ['ください', 'kudasai'],
          ],
          'A bag, please.',
        ),
        item(
          '02',
          [
            ['それ', 'sore'],
            ['を', 'o'],
            ['ください', 'kudasai'],
          ],
          'That one.',
        ),
      ],
    },
    /* Situation 2 exists for the alternate path. */
    {
      id: 'third',
      name: 'Third situation',
      lessonNum: '03',
      blurb: 'The third one.',
      words: WORDS,
      items: [
        {
          ...item('01', [
            ['これ', 'kore'],
            ['は', 'wa'],
            ['甘い', 'amai'],
            ['です', 'desu'],
          ]),
          alts: ['これが甘いです'],
        },
      ],
    },
  ],
};

const SECOND = LANGUAGE.scenarios[1]!;

const open = (scenario = 0) => {
  const view = renderHook(() => useTsumiki(LANGUAGE));
  act(() => view.result.current.openScenario(scenario));
  return view;
};

/** Place the tiles that spell the current item's canonical answer. */
const solve = (view: ReturnType<typeof open>) => {
  const { item, bank } = view.result.current;
  for (const index of revealIndices(item, bank)) {
    act(() => view.result.current.tap(index));
  }
};

/** Place one tile that is not the whole answer. */
const guessWrong = (view: ReturnType<typeof open>) => {
  act(() => view.result.current.tap(0));
  act(() => view.result.current.check());
};

/* By property, not by position: tap(0) might happen to be an answer tile, which
   would leave nothing for the marks to point at. */
/** A bank index holding a tile the current answer does not use. */
const distractor = (view: ReturnType<typeof open>) => {
  const { item, bank } = view.result.current;
  const wanted = item.ans.map((tile) => tile[0]);
  const index = bank.findIndex((tile) => !wanted.includes(tile[0]));
  expect(index, 'bank has no distractor').toBeGreaterThanOrEqual(0);
  return index;
};

/** Place `bankIndex` on its own and check it, for one guaranteed miss. */
const missWith = (view: ReturnType<typeof open>, bankIndex: number) => {
  act(() => view.result.current.tap(bankIndex));
  act(() => view.result.current.check());
};

describe('useTsumiki', () => {
  it('starts on the home screen with every scenario available', () => {
    const { result } = renderHook(() => useTsumiki(LANGUAGE));
    expect(result.current.state.screen).toBe('home');
    expect(result.current.scenarios).toEqual(LANGUAGE.scenarios);
  });

  it('resolves the open scenario, its item and its tile bank', () => {
    const { result } = open(1);
    expect(result.current.scenario).toBe(SECOND);
    expect(result.current.item).toBe(SECOND.items[0]);
    expect(result.current.total).toBe(SECOND.items.length);
    expect(result.current.bank.length).toBeGreaterThan(0);
  });

  it('keeps the same bank array across re-renders, so tiles do not remount', () => {
    const view = open();
    const before = view.result.current.bank;
    act(() => view.result.current.tap(0));
    expect(view.result.current.bank).toBe(before);
  });

  it('builds a new bank when the item changes', () => {
    const view = open();
    const before = view.result.current.bank;
    solve(view);
    act(() => view.result.current.check());
    act(() => view.result.current.next());
    expect(view.result.current.bank).not.toBe(before);
  });

  it('holds every tile the current answer needs', () => {
    const { result } = open();
    const texts = result.current.bank.map((t) => t[0]);
    for (const tile of result.current.item.ans) {
      expect(texts).toContain(tile[0]);
    }
  });

  it('marks the answer done once it is correct', () => {
    const view = open();
    solve(view);
    act(() => view.result.current.check());
    expect(view.result.current.done).toBe(true);
    expect(view.result.current.state.firstTry).toBe(1);
  });

  it('reveals an answer that checks out as correct', () => {
    const view = open();
    act(() => view.result.current.reveal());
    const { bank, state, item } = view.result.current;
    expect(state.placed.map((i) => bank[i]?.[0]).join('')).toBe(item.ans.map((t) => t[0]).join(''));
  });

  it('holds the note back until the configured miss count', () => {
    const view = open();
    expect(view.result.current.showNote).toBe(false);

    for (let miss = 1; miss < NOTE_AFTER_MISSES; miss++) {
      guessWrong(view);
      expect(view.result.current.showNote).toBe(false);
    }
    guessWrong(view);
    expect(view.result.current.state.misses).toBe(NOTE_AFTER_MISSES);
    expect(view.result.current.showNote).toBe(true);
  });

  it('shows the note as soon as the answer is settled, however few the misses', () => {
    const view = open();
    solve(view);
    act(() => view.result.current.check());
    expect(view.result.current.state.misses).toBe(0);
    expect(view.result.current.showNote).toBe(true);
  });

  it('holds the reveal button back until the configured miss count', () => {
    const view = open();
    for (let miss = 1; miss < REVEAL_AFTER_MISSES; miss++) {
      guessWrong(view);
      expect(view.result.current.showReveal).toBe(false);
    }
    guessWrong(view);
    expect(view.result.current.showReveal).toBe(true);
  });

  it('hides the reveal button once the answer is settled', () => {
    const view = open();
    for (let miss = 0; miss < REVEAL_AFTER_MISSES; miss++) guessWrong(view);
    act(() => view.result.current.reveal());
    expect(view.result.current.showReveal).toBe(false);
  });

  it('holds the wrong-tile marks back until the configured miss count', () => {
    const view = open();
    const bad = distractor(view);

    for (let miss = 1; miss < HIGHLIGHT_AFTER_MISSES; miss++) {
      missWith(view, bad);
      expect(view.result.current.wrongPositions).toEqual([]);
    }
    missWith(view, bad);
    expect(view.result.current.state.misses).toBe(HIGHLIGHT_AFTER_MISSES);
    expect(view.result.current.wrongPositions).toEqual([0]);
  });

  it('clears the marks when a tile is taken off the line', () => {
    const view = open();
    const bad = distractor(view);
    for (let miss = 0; miss < HIGHLIGHT_AFTER_MISSES; miss++) missWith(view, bad);
    expect(view.result.current.wrongPositions).not.toEqual([]);

    act(() => view.result.current.untap(0));
    expect(view.result.current.wrongPositions).toEqual([]);
  });

  it('clears the marks when another tile is added to the line', () => {
    const view = open();
    const bad = distractor(view);
    for (let miss = 0; miss < HIGHLIGHT_AFTER_MISSES; miss++) missWith(view, bad);

    /* A different tile: tapping one already on the line is a no-op, so it would
       not reset the status. */
    const other = view.result.current.bank.findIndex((_, index) => index !== bad);
    act(() => view.result.current.tap(other));
    expect(view.result.current.wrongPositions).toEqual([]);
  });

  it('marks nothing once the answer is settled', () => {
    const view = open();
    const bad = distractor(view);
    for (let miss = 0; miss < HIGHLIGHT_AFTER_MISSES; miss++) missWith(view, bad);

    act(() => view.result.current.reveal());
    expect(view.result.current.done).toBe(true);
    expect(view.result.current.wrongPositions).toEqual([]);
  });

  it('tracks progress across the set and reads full when finished', () => {
    const view = open();
    const total = view.result.current.total;
    expect(view.result.current.progress).toBe(0);

    solve(view);
    act(() => view.result.current.check());
    act(() => view.result.current.next());
    expect(view.result.current.progress).toBeCloseTo(1 / total);

    act(() => view.result.current.restart());
    for (let i = 0; i < total; i++) {
      act(() => view.result.current.reveal());
      act(() => view.result.current.next());
    }
    expect(view.result.current.state.finished).toBe(true);
    expect(view.result.current.progress).toBe(1);
  });

  it('flags the last item of the set', () => {
    const view = open();
    expect(view.result.current.isLastItem).toBe(false);
    for (let i = 0; i < view.result.current.total - 1; i++) {
      act(() => view.result.current.reveal());
      act(() => view.result.current.next());
    }
    expect(view.result.current.isLastItem).toBe(true);
  });

  it('returns home and back into a fresh run of the same set', () => {
    const view = open();
    guessWrong(view);
    act(() => view.result.current.goHome());
    expect(view.result.current.state.screen).toBe('home');

    act(() => view.result.current.openScenario(0));
    expect(view.result.current.state).toMatchObject({ item: 0, misses: 0, placed: [] });
  });
});

describe('an answer the item accepts but does not teach', () => {
  const ALT = ['これ', 'が', '甘い', 'です'];

  /* By tile text, not bank position: buildBank decides where a seeded tile lands. */
  const buildAlt = (view: ReturnType<typeof open>) => {
    for (const text of ALT) {
      const index = view.result.current.bank.findIndex((tile) => tile[0] === text);
      expect(index, `bank is missing ${text}`).toBeGreaterThanOrEqual(0);
      act(() => view.result.current.tap(index));
    }
  };

  it('offers another go instead of settling, and costs nothing', () => {
    const view = open(2);
    buildAlt(view);
    act(() => view.result.current.check());
    expect(view.result.current.state).toMatchObject({ status: 'alt', misses: 0 });
    expect(view.result.current.done).toBe(false);
  });

  it('is taken by a second check, and still scores as a first try', () => {
    const view = open(2);
    buildAlt(view);
    act(() => view.result.current.check());
    act(() => view.result.current.check());
    expect(view.result.current.state).toMatchObject({ status: 'accepted', firstTry: 1 });
    expect(view.result.current.done).toBe(true);
  });

  it('settles as right when the taught phrasing is built after the offer', () => {
    const view = open(2);
    buildAlt(view);
    act(() => view.result.current.check());
    act(() => view.result.current.untap(0));
    solve(view);
    act(() => view.result.current.check());
    expect(view.result.current.state.status).toBe('right');
  });
});

describe('the timed-mode clock', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const openTimed = () => {
    const view = renderHook(() => useTsumiki(LANGUAGE));
    act(() => view.result.current.setMode('timed'));
    act(() => view.result.current.openScenario(0));
    return view;
  };

  const wait = (seconds: number) => act(() => vi.advanceTimersByTime(seconds * 1000));

  it('counts down from the first tap and marks a miss when time runs out', () => {
    const view = openTimed();
    act(() => view.result.current.tap(0));
    wait(1);
    expect(view.result.current.secondsLeft).toBe(TIMED_SECONDS - 1);

    wait(TIMED_SECONDS - 1);
    expect(view.result.current.state).toMatchObject({ status: 'timeout', misses: 1 });
  });

  it('does not time out an attempt that was checked in time', () => {
    const view = openTimed();
    solve(view);
    act(() => view.result.current.check());
    wait(TIMED_SECONDS * 2);
    expect(view.result.current.state).toMatchObject({ status: 'right', misses: 0 });
  });

  it('gives the next attempt a full clock after a timeout', () => {
    const view = openTimed();
    act(() => view.result.current.tap(0));
    wait(TIMED_SECONDS);
    act(() => view.result.current.tap(0));
    expect(view.result.current.secondsLeft).toBe(TIMED_SECONDS);
    expect(view.result.current.state.status).toBe('idle');
  });

  it('never runs in free learning', () => {
    const view = open();
    act(() => view.result.current.tap(0));
    wait(TIMED_SECONDS * 2);
    expect(view.result.current.state).toMatchObject({ status: 'idle', misses: 0 });
  });
});
