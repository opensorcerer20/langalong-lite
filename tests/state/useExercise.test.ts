/* The question-driven seam.

   Driven through act() rather than through components, like useTsumiki's own
   tests. The reducer is shared with useTsumiki, so these are about what this
   hook adds: compiling a set, judging a choice, and recording it as *direct*
   evidence rather than inferred. */

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { REVEAL_AFTER_MISSES, VOCAB_SET_SIZE } from '../../src/config';
import { LANGUAGE } from '../../src/data/languages';
import type { ExerciseMode } from '../../src/lib/progress';
import { createMemoryProgressStore } from '../../src/storage/memoryProgressStore';
import type { ProgressStore } from '../../src/storage/types';
import { appReducer, initialState } from '../../src/state/appReducer';
import type { AppState } from '../../src/state/appReducer';
import { useExercise } from '../../src/state/useExercise';

const BAKERY = LANGUAGE.scenarios[0]!;

let progress: ProgressStore;

beforeEach(() => {
  progress = createMemoryProgressStore();
});

/* The reducer the app owns, stood up here so the hook has the same state to
   share that useTsumiki would give it. */
function open(mode: ExerciseMode = 'vocab') {
  let state: AppState = appReducer(initialState, {
    type: 'openExercise',
    scenario: 0,
    mode,
  });

  const view = renderHook(
    ({ current }: { current: AppState }) =>
      useExercise({
        language: LANGUAGE,
        scenario: BAKERY,
        mode: current.mode,
        state: current,
        dispatch: (action) => {
          state = appReducer(state, action);
          view.rerender({ current: state });
        },
        progress,
      }),
    { initialProps: { current: state } },
  );

  /* The reducer state is shared with useTsumiki in the app, so the hook does
     not return `placed`. Tests that care about it read it here. */
  return Object.assign(view, { state: () => state });
}

/** Tap the option that answers the current question, then check. */
const solve = (view: ReturnType<typeof open>) => {
  const { question, choices } = view.result.current;
  const answer = question!.answer[0]![0];
  act(() => view.result.current.tap(choices.findIndex((tile) => tile[0] === answer)));
  act(() => view.result.current.check());
};

/** Tap an option that is not the answer, then check. */
const missOnce = (view: ReturnType<typeof open>) => {
  const { question, choices } = view.result.current;
  const answer = question!.answer[0]![0];
  act(() => view.result.current.tap(choices.findIndex((tile) => tile[0] !== answer)));
  act(() => view.result.current.check());
};

describe('useExercise', () => {
  it('compiles a set for the situation and mode it is given', () => {
    const { result } = open();
    expect(result.current.total).toBe(VOCAB_SET_SIZE);
    expect(result.current.question?.mode).toBe('vocab');
    expect(result.current.question?.scenarioId).toBe('bakery');
  });

  /* This hook is called unconditionally, as the rules of hooks require, so it
     needs an answer for the mode it does not drive. */
  it('has nothing to run in sentence mode, rather than failing', () => {
    const { result } = open('sentence');
    expect(result.current.questions).toEqual([]);
    expect(result.current.question).toBeUndefined();
    expect(result.current.total).toBe(0);
    expect(result.current.progress).toBe(0);
  });

  it('keeps the same choices array across re-renders, so tiles do not remount', () => {
    const view = open();
    const before = view.result.current.choices;
    act(() => view.result.current.tap(0));
    expect(view.result.current.choices).toBe(before);
  });

  it('settles the question when the right option is chosen', () => {
    const view = open();
    solve(view);
    expect(view.result.current.done).toBe(true);
  });

  it('counts a miss and clears the line when the wrong one is chosen', () => {
    const view = open();
    missOnce(view);
    expect(view.result.current.done).toBe(false);
  });

  it('advances through the set and finishes it', () => {
    const view = open();
    for (let i = 0; i < VOCAB_SET_SIZE; i++) {
      solve(view);
      act(() => view.result.current.next());
    }
    expect(view.result.current.progress).toBe(1);
  });

  it('fills the blank with the answer when the learner gives up', () => {
    const view = open();
    const { question, choices } = view.result.current;
    act(() => view.result.current.reveal());

    expect(view.result.current.done).toBe(true);
    /* Not just settled — settled showing the right word. */
    const placed = view.state().placed.map((index) => choices[index]?.[0]);
    expect(placed).toEqual(question!.answer.map((tile) => tile[0]));
  });

  it('offers the answer only after enough misses', () => {
    const view = open();
    expect(view.result.current.showReveal).toBe(false);
    for (let i = 0; i < REVEAL_AFTER_MISSES; i++) missOnce(view);
    expect(view.result.current.showReveal).toBe(true);
  });

  /* Vocabulary questions carry no note, so the miss ladder never reaches one
     however many times the learner misses. */
  it('never shows a note for a question that has none', () => {
    const view = open();
    for (let i = 0; i < 5; i++) missOnce(view);
    expect(view.result.current.showNote).toBe(false);
  });

  describe('what it writes down', () => {
    it('records against the tile being reviewed', async () => {
      const view = open();
      const key = view.result.current.question!.key;
      solve(view);

      const log = await progress.attemptsFor(key);
      expect(log).toHaveLength(1);
      expect(log[0]).toMatchObject({
        outcome: 'right',
        unit: 'tile',
        mode: 'vocab',
        scenarioId: 'bakery',
        languageCode: 'ja',
      });
    });

    /* The whole point of the mode. A sentence drill writes to the same tile row
       marked viaItem, meaning "inferred from a sentence they built". Answering
       the word directly is the thing that row was always standing in for. */
    it('marks the row as direct evidence, unlike the sentence drill', async () => {
      const view = open();
      const key = view.result.current.question!.key;
      solve(view);

      const [attempt] = await progress.attemptsFor(key);
      expect(attempt?.viaItem).toBeUndefined();
    });

    it('records a wrong choice too, with the misses that preceded it', async () => {
      const view = open();
      const key = view.result.current.question!.key;
      missOnce(view);
      missOnce(view);
      solve(view);

      const log = await progress.attemptsFor(key);
      expect(log.map((a) => a.outcome)).toEqual(['wrong', 'wrong', 'right']);
      expect(log.map((a) => a.misses)).toEqual([0, 1, 2]);
    });

    it('keeps a reveal distinct from a wrong answer', async () => {
      const view = open();
      const key = view.result.current.question!.key;
      act(() => view.result.current.reveal());
      expect((await progress.attemptsFor(key))[0]).toMatchObject({ outcome: 'shown' });
    });

    it('times each attempt', async () => {
      const view = open();
      const key = view.result.current.question!.key;
      solve(view);

      const [attempt] = await progress.attemptsFor(key);
      expect(attempt?.durationMs).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(attempt?.durationMs)).toBe(true);
    });

    it('records nothing for a check the reducer would ignore', async () => {
      const view = open();
      const key = view.result.current.question!.key;
      act(() => view.result.current.check());
      expect(await progress.attemptsFor(key)).toEqual([]);
    });

    it('records nothing once the question is already settled', async () => {
      const view = open();
      const key = view.result.current.question!.key;
      solve(view);
      act(() => view.result.current.check());
      act(() => view.result.current.reveal());
      expect(await progress.attemptsFor(key)).toHaveLength(1);
    });

    it('records the second question against its own key', async () => {
      const view = open();
      const first = view.result.current.question!.key;
      solve(view);
      act(() => view.result.current.next());
      const second = view.result.current.question!.key;
      solve(view);

      expect(second).not.toBe(first);
      expect(await progress.attemptsFor(first)).toHaveLength(1);
      expect(await progress.attemptsFor(second)).toHaveLength(1);
    });
  });
});
