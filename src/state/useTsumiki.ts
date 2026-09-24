/* The seam — the single place content, logic and state meet.

   Everything else stays on one side: data/ is inert content, lib/ is pure logic
   that never imports content, appReducer takes nothing at runtime, components/
   are presentational.

   What this hook does:

   - looks the current scenario and item up in the content;
   - builds the tile bank for them;
   - judges what the learner built, and hands the reducer the verdict;
   - applies the config dials, so no component knows what "two misses" means. */

import { useCallback, useMemo, useReducer } from 'react';

import {
  HIGHLIGHT_AFTER_MISSES,
  NOTE_AFTER_MISSES,
  REVEAL_AFTER_MISSES,
  TILE_MULTIPLIER,
} from '../config';
import type { LanguagePack, Scenario, SentenceItem, Tile } from '../data/types';
import { buildBank } from '../lib/buildBank';
import { buildString, judge } from '../lib/checkAnswer';
import { wrongPositions } from '../lib/diffAnswer';
import { revealIndices } from '../lib/revealPlacement';
import { appReducer, initialState, isDone } from './appReducer';
import type { AppState } from './appReducer';

export interface Tsumiki {
  readonly state: AppState;
  /** The language being drilled. Components read its name and font from here. */
  readonly language: LanguagePack;
  /** Every situation, for the home screen. */
  readonly scenarios: readonly Scenario[];
  /** The situation currently open. */
  readonly scenario: Scenario;
  /** The item currently being drilled. */
  readonly item: SentenceItem;
  /** The item's tile bank. Stable for as long as the item is. */
  readonly bank: readonly Tile[];
  /** Items in the current set. */
  readonly total: number;
  /** The answer is settled — correct or revealed — so the line is locked. */
  readonly done: boolean;
  /** The current item is the last in the set. */
  readonly isLastItem: boolean;
  /**
   * The item has a note, and enough misses or a settled answer. Never true
   * without a note, so the status line never points at missing help.
   */
  readonly showNote: boolean;
  /** Show the "Show me the answer" button. */
  readonly showReveal: boolean;
  /**
   * A wrong answer is still standing on the line, so the primary button clears
   * it rather than checking the same tiles again.
   */
  readonly canRetry: boolean;
  /**
   * Line positions to mark as wrong. Empty until the miss count earns them, and
   * empty again on the next tap, because that resets the status to `idle`.
   */
  readonly wrongPositions: readonly number[];
  /** How far through the set, 0–1, for the progress rule. */
  readonly progress: number;

  readonly openScenario: (scenario: number) => void;
  readonly goHome: () => void;
  readonly tap: (bankIndex: number) => void;
  readonly untap: (position: number) => void;
  readonly check: () => void;
  readonly retry: () => void;
  readonly reveal: () => void;
  readonly next: () => void;
  readonly restart: () => void;
}

/* Indexing an array yields `| undefined` under noUncheckedIndexedAccess. The
   content is never actually empty, so this fails loudly rather than forcing
   every read below to carry a fallback. */
function first<T>(list: readonly T[], what: string): T {
  const head = list[0];
  if (!head) throw new Error(`${what} is empty — the app has no content to drill`);
  return head;
}

/**
 * @param language The pack to drill. Passed in rather than imported, so this
 *                 hook stays testable against a stand-in.
 */
export function useTsumiki(language: LanguagePack): Tsumiki {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const firstScenario = first(language.scenarios, `Language "${language.code}"`);
  const scenario = language.scenarios[state.scenario] ?? firstScenario;
  const items = scenario.items;
  const item = items[state.item] ?? first(items, `Scenario "${scenario.name}"`);

  /* The bank is a pure function of the item, so memoising it is only about
     identity: React needs the same array back on a re-render caused by placing
     a tile, or every tile would remount and lose keyboard focus. */
  const bank = useMemo(
    () =>
      buildBank(
        item,
        state.item,
        { grammar: language.grammar, words: scenario.words },
        TILE_MULTIPLIER,
        language.joiner,
      ),
    [item, state.item, scenario.words, language.grammar, language.joiner],
  );

  const total = items.length;
  const done = isDone(state);

  const marks = useMemo(
    () =>
      state.status === 'wrong' && state.misses >= HIGHLIGHT_AFTER_MISSES
        ? wrongPositions(item, bank, state.placed, language.joiner)
        : [],
    [state.status, state.misses, state.placed, item, bank, language.joiner],
  );

  const openScenario = useCallback(
    (index: number) => dispatch({ type: 'openScenario', scenario: index }),
    [],
  );
  const goHome = useCallback(() => dispatch({ type: 'goHome' }), []);
  const tap = useCallback((bankIndex: number) => dispatch({ type: 'tap', bankIndex }), []);
  const untap = useCallback((position: number) => dispatch({ type: 'untap', position }), []);

  /* No guard against a repeated check: the reducer reads a second one on an
     offered alternate as taking it. */
  const check = useCallback(() => {
    const verdict = judge(item, buildString(bank, state.placed, language.joiner), language.joiner);
    dispatch({ type: 'check', verdict });
  }, [state.placed, item, bank, language.joiner]);

  const retry = useCallback(() => dispatch({ type: 'retry' }), []);

  const reveal = useCallback(
    () => dispatch({ type: 'reveal', placed: revealIndices(item, bank) }),
    [item, bank],
  );

  const next = useCallback(() => dispatch({ type: 'next', itemCount: total }), [total]);
  const restart = useCallback(() => dispatch({ type: 'restart' }), []);

  return {
    state,
    language,
    scenarios: language.scenarios,
    scenario,
    item,
    bank,
    total,
    done,
    isLastItem: state.item === total - 1,
    showNote: item.note !== undefined && (state.misses >= NOTE_AFTER_MISSES || done),
    showReveal: state.misses >= REVEAL_AFTER_MISSES && !done,
    canRetry: state.status === 'wrong' && state.placed.length > 0,
    wrongPositions: marks,
    /* A finished set reads 100%, not "last item". */
    progress: (state.finished ? total : state.item) / total,
    openScenario,
    goHome,
    tap,
    untap,
    check,
    retry,
    reveal,
    next,
    restart,
  };
}
