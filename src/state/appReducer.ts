/* The whole of the app's behaviour, as one pure function.

   This file imports no values at all — only the `ExerciseMode` type, which is
   erased at compile time and so costs nothing at runtime. Where a transition
   needs to know what the answer is — `check` and `reveal` — the caller puts the
   *verdict* in the action rather than the material to reach one: `check`
   carries whether the answer was right, `reveal` carries the positions to fill.
   Judging belongs to whichever hook is driving, where the content and the
   language's joiner already are.

   That split is what makes these rules exercise-agnostic, and `mode` is now the
   proof: the miss ladder, the first-try score and advancing through a set are
   written once and drive a vocabulary cloze exactly as they drive a sentence.
   The pieces that differ between exercises are the ones that were never in
   here. */

import type { ExerciseMode } from '../lib/progress';

/** Which screen is showing. */
export type Screen = 'home' | 'drill';

/**
 * How the last Check went.
 *
 * `right` and `shown` are the two "done" states — the answer line is locked and
 * the primary button advances instead of checking.
 */
export type DrillStatus = 'idle' | 'wrong' | 'right' | 'shown';

export interface AppState {
  readonly screen: Screen;
  /**
   * Which exercise is running.
   *
   * Not part of `screen`: every mode uses the same screen, the same miss
   * ladder and the same done screen, and differs only in what is being asked.
   * Folding it into `screen` would make each new exercise a new screen value
   * and every rule below branch on it.
   */
  readonly mode: ExerciseMode;
  /** Index into SCENARIOS. */
  readonly scenario: number;
  /** Index of the current item within that scenario's set. */
  readonly item: number;
  /** Bank positions the learner has placed, in order. */
  readonly placed: readonly number[];
  /** Misses on the current item. Drives the note and the reveal button. */
  readonly misses: number;
  readonly status: DrillStatus;
  /** Items answered correctly with no prior miss. The score on the done screen. */
  readonly firstTry: number;
  /** Set finished — show the done screen instead of the drill. */
  readonly finished: boolean;
}

export const initialState: AppState = {
  screen: 'home',
  mode: 'sentence',
  scenario: 0,
  item: 0,
  placed: [],
  misses: 0,
  status: 'idle',
  firstTry: 0,
  finished: false,
};

export type AppAction =
  /* Was `openScenario`. A situation is no longer one thing to open — it is
     four, and which one is being opened is the argument that was missing. */
  | { type: 'openExercise'; scenario: number; mode: ExerciseMode }
  | { type: 'goHome' }
  | { type: 'tap'; bankIndex: number }
  | { type: 'untap'; position: number }
  /* The verdict, not the evidence. useTsumiki already computed this to decide
     what to record before dispatching — it had to, because a store write
     cannot wait for a re-render — so passing it in removes a second, separate
     judgement of the same answer rather than moving work around. */
  | { type: 'check'; correct: boolean }
  /* The bank positions that spell the answer, worked out by the caller. Which
     positions those are depends on what kind of exercise this is; that the
     line then locks does not. */
  | { type: 'reveal'; placed: readonly number[] }
  | { type: 'next'; itemCount: number }
  | { type: 'restart' };

/** True once the answer is settled, right or revealed: the line stops accepting taps. */
export function isDone(state: AppState): boolean {
  return state.status === 'right' || state.status === 'shown';
}

/** The state an item starts in. Keeps the four per-item fields in one place. */
const FRESH_ITEM = { placed: [], misses: 0, status: 'idle' } as const;

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'openExercise':
      /* Entering a set always restarts it, including the score. */
      return {
        ...initialState,
        screen: 'drill',
        mode: action.mode,
        scenario: action.scenario,
      };

    case 'goHome':
      /* Leaves the exercise where it was; openExercise is what resets it. */
      return { ...state, screen: 'home' };

    case 'tap':
      if (isDone(state)) return state;
      if (state.placed.includes(action.bankIndex)) return state;
      return {
        ...state,
        placed: [...state.placed, action.bankIndex],
        /* Clears the "not quite" line as soon as they start over. */
        status: 'idle',
      };

    case 'untap':
      if (isDone(state)) return state;
      return {
        ...state,
        placed: state.placed.filter((_, position) => position !== action.position),
        status: 'idle',
      };

    case 'check': {
      if (isDone(state)) return state;
      if (state.placed.length === 0) return state;

      if (action.correct) {
        return {
          ...state,
          status: 'right',
          /* Credit only if they had not already missed this one. */
          firstTry: state.misses === 0 ? state.firstTry + 1 : state.firstTry,
        };
      }
      return {
        ...state,
        status: 'wrong',
        misses: state.misses + 1,
        /* A wrong answer clears the line — they rebuild rather than edit. */
        placed: [],
      };
    }

    case 'reveal':
      if (isDone(state)) return state;
      return {
        ...state,
        placed: action.placed,
        status: 'shown',
        /* No firstTry credit: revealing forfeits it. */
      };

    case 'next': {
      const isLast = state.item >= action.itemCount - 1;
      return {
        ...state,
        ...FRESH_ITEM,
        item: isLast ? state.item : state.item + 1,
        finished: isLast,
      };
    }

    case 'restart':
      /* Replays the current set from the top, score included, without
         disturbing which scenario is open. */
      return {
        ...state,
        ...FRESH_ITEM,
        item: 0,
        firstTry: 0,
        finished: false,
      };
  }
}
