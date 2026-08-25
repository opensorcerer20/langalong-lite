/* The hook, driven through act() rather than through components — these are
   about the wiring between content, config and the reducer. */

import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { NOTE_AFTER_MISSES, REVEAL_AFTER_MISSES } from '../../src/config';
import { SCENARIOS } from '../../src/data/scenarios';
import { revealIndices } from '../../src/lib/revealPlacement';
import { useTsumiki } from '../../src/state/useTsumiki';

const open = (scenario = 0) => {
  const view = renderHook(() => useTsumiki());
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

describe('useTsumiki', () => {
  it('starts on the home screen with every scenario available', () => {
    const { result } = renderHook(() => useTsumiki());
    expect(result.current.state.screen).toBe('home');
    expect(result.current.scenarios).toEqual(SCENARIOS);
  });

  it('resolves the open scenario, its item and its tile bank', () => {
    const { result } = open(1);
    expect(result.current.scenario.name).toBe('Train station');
    expect(result.current.item).toBe(SCENARIOS[1]?.items[0]);
    expect(result.current.total).toBe(SCENARIOS[1]?.items.length);
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
    const kana = result.current.bank.map((t) => t[0]);
    for (const tile of result.current.item.ans) {
      expect(kana).toContain(tile[0]);
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
    expect(state.placed.map((i) => bank[i]?.[0]).join('')).toBe(
      item.ans.map((t) => t[0]).join(''),
    );
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
