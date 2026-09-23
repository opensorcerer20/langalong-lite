/* The drill rules, as one pure function. Nothing reaches it at runtime — the
   single import is a type.

   Actions carry verdicts, not evidence: useTsumiki does the judging. */

import type { Verdict } from '../lib/checkAnswer';

/** Which screen is showing. */
export type Screen = 'home' | 'drill';

/** Free learning, or timed: each attempt must be checked before the clock runs out. */
export type DrillMode = 'free' | 'timed';

/**
 * How the last Check went.
 *
 * - `alt` — accepted, but not the phrasing being taught. Offered, not settled.
 * - `timeout` — the clock ran out before Check; a miss, like `wrong`.
 * - `right`, `accepted`, `shown` — done: the line locks and the button advances.
 */
export type DrillStatus = 'idle' | 'wrong' | 'timeout' | 'alt' | 'right' | 'accepted' | 'shown';

export interface AppState {
  readonly screen: Screen;
  readonly mode: DrillMode;
  /** Index into the language's scenarios. */
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
  /** Timed mode: an attempt is on the clock, from its first tap until Check. */
  readonly clockRunning: boolean;
}

export const initialState: AppState = {
  screen: 'home',
  mode: 'free',
  scenario: 0,
  item: 0,
  placed: [],
  misses: 0,
  status: 'idle',
  firstTry: 0,
  finished: false,
  clockRunning: false,
};

export type AppAction =
  | { type: 'openScenario'; scenario: number }
  | { type: 'setMode'; mode: DrillMode }
  | { type: 'goHome' }
  | { type: 'tap'; bankIndex: number }
  | { type: 'untap'; position: number }
  | { type: 'check'; verdict: Verdict }
  | { type: 'timeout' }
  /* The bank positions that spell the answer. */
  | { type: 'reveal'; placed: readonly number[] }
  | { type: 'next'; itemCount: number }
  | { type: 'restart' };

/** True once the answer is settled, right or revealed: the line stops accepting taps. */
export function isDone(state: AppState): boolean {
  return state.status === 'right' || state.status === 'accepted' || state.status === 'shown';
}

/** The state an item starts in. */
const FRESH_ITEM = { placed: [], misses: 0, status: 'idle', clockRunning: false } as const;

function miss(state: AppState, status: 'wrong' | 'timeout'): AppState {
  return {
    ...state,
    status,
    misses: state.misses + 1,
    /* The first miss clears the line; later ones leave it standing to be
       marked up. */
    placed: state.misses === 0 ? [] : state.placed,
    clockRunning: false,
  };
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'openScenario':
      /* Entering a set always restarts it, including the score. */
      return {
        ...initialState,
        screen: 'drill',
        scenario: action.scenario,
        mode: state.mode,
      };

    case 'setMode':
      return { ...state, mode: action.mode };

    case 'goHome':
      /* Leaves the drill where it was; openScenario is what resets it. */
      return { ...state, screen: 'home', clockRunning: false };

    case 'tap':
      if (isDone(state)) return state;
      if (state.placed.includes(action.bankIndex)) return state;
      return {
        ...state,
        placed: [...state.placed, action.bankIndex],
        /* Clears the "not quite" line as soon as they start over. */
        status: 'idle',
        clockRunning: state.clockRunning || state.mode === 'timed',
      };

    case 'untap':
      if (isDone(state)) return state;
      return {
        ...state,
        /* The tile and everything after it, so the next tap lands in the spot
           just vacated without anything having to remember the gap. */
        placed: state.placed.slice(0, action.position),
        status: 'idle',
      };

    case 'check': {
      if (isDone(state)) return state;
      if (state.placed.length === 0) return state;

      const checked = { ...state, clockRunning: false };

      /* An alternate taken on the offer scores like any other clean answer:
         misses are what count, not which phrasing they landed on. */
      const scored = {
        ...checked,
        firstTry: state.misses === 0 ? state.firstTry + 1 : state.firstTry,
      };

      if (action.verdict === 'canonical') return { ...scored, status: 'right' };

      if (action.verdict === 'alt') {
        /* A tap or an untap would have reset the status, so a check still in
           `alt` can only be the answer that was offered. */
        if (state.status === 'alt') return { ...scored, status: 'accepted' };
        return { ...checked, status: 'alt' };
      }

      return miss(state, 'wrong');
    }

    case 'timeout':
      /* A timer that fires after Check, or after leaving the drill, is stale. */
      if (!state.clockRunning || isDone(state)) return state;
      return miss(state, 'timeout');

    case 'reveal':
      if (isDone(state)) return state;
      return {
        ...state,
        placed: action.placed,
        status: 'shown',
        clockRunning: false,
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
