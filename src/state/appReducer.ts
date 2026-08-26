/* The whole of the app's behaviour, as one pure function.

   This file deliberately imports no language content. Where a transition needs
   to know what the answer is — `check` and `reveal` — the caller puts the item,
   the tile bank and the language's joiner in the action itself. That keeps the
   rules readable on their own and testable without loading a single sentence,
   and it is why useTsumiki, not this file, is the place data meets state. */

import type { SentenceItem, Tile } from '../data/types';
import { buildString, isCorrect } from '../lib/checkAnswer';
import { revealIndices } from '../lib/revealPlacement';

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
  scenario: 0,
  item: 0,
  placed: [],
  misses: 0,
  status: 'idle',
  firstTry: 0,
  finished: false,
};

export type AppAction =
  | { type: 'openScenario'; scenario: number }
  | { type: 'goHome' }
  | { type: 'tap'; bankIndex: number }
  | { type: 'untap'; position: number }
  /* `joiner` rides along for the same reason `item` and `bank` do: judging the
     answer means joining tiles into a string, and how they join is the
     language's business. `reveal` works on tiles alone and so needs none. */
  | { type: 'check'; item: SentenceItem; bank: readonly Tile[]; joiner: string }
  | { type: 'reveal'; item: SentenceItem; bank: readonly Tile[] }
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
    case 'openScenario':
      /* Entering a set always restarts it, including the score. */
      return {
        ...initialState,
        screen: 'drill',
        scenario: action.scenario,
      };

    case 'goHome':
      /* Leaves the drill where it was; openScenario is what resets it. */
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

      const built = buildString(action.bank, state.placed, action.joiner);
      if (isCorrect(action.item, built, action.joiner)) {
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
        placed: revealIndices(action.item, action.bank),
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
