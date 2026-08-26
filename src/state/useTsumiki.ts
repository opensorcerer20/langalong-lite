/* The seam.

   Everything else in src/ sits on one side or the other: data/ is inert
   content, lib/ and appReducer are pure logic that never import content, and
   components/ are presentational. This hook is the single place all three meet
   — it looks the current scenario and item up in the content, builds the tile
   bank for them, and hands the reducer the pieces it needs.

   It is also the only file that reads the active language pack. Everything
   downstream takes what it needs from this hook, which is what lets the rest of
   the app stay language-agnostic.

   It is also where the config dials are applied, so no component has to know
   what "two misses" means. */

import { useCallback, useMemo, useReducer } from 'react';

import { NOTE_AFTER_MISSES, REVEAL_AFTER_MISSES, TILE_MULTIPLIER } from '../config';
import { LANGUAGE } from '../data/languages';
import type { LanguagePack, Scenario, SentenceItem, Tile } from '../data/types';
import { buildBank } from '../lib/buildBank';
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
  /** Show the grammar note: enough misses, or the answer is settled. */
  readonly showNote: boolean;
  /** Show the "Show me the answer" button. */
  readonly showReveal: boolean;
  /** How far through the set, 0–1, for the progress rule. */
  readonly progress: number;

  readonly openScenario: (scenario: number) => void;
  readonly goHome: () => void;
  readonly tap: (bankIndex: number) => void;
  readonly untap: (position: number) => void;
  readonly check: () => void;
  readonly reveal: () => void;
  readonly next: () => void;
  readonly restart: () => void;
}

/* Indexing an array yields `| undefined` under noUncheckedIndexedAccess. The
   content is never actually empty, so this fails loudly at startup rather than
   forcing every read below to carry a fallback. */
function first<T>(list: readonly T[], what: string): T {
  const head = list[0];
  if (!head) throw new Error(`${what} is empty — the app has no content to drill`);
  return head;
}

const FIRST_SCENARIO = first(LANGUAGE.scenarios, `Language "${LANGUAGE.code}"`);

export function useTsumiki(): Tsumiki {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const scenario = LANGUAGE.scenarios[state.scenario] ?? FIRST_SCENARIO;
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
        { grammar: LANGUAGE.grammar, words: scenario.words },
        TILE_MULTIPLIER,
        LANGUAGE.joiner,
      ),
    [item, state.item, scenario.words],
  );

  const total = items.length;
  const done = isDone(state);

  const openScenario = useCallback(
    (index: number) => dispatch({ type: 'openScenario', scenario: index }),
    [],
  );
  const goHome = useCallback(() => dispatch({ type: 'goHome' }), []);
  const tap = useCallback((bankIndex: number) => dispatch({ type: 'tap', bankIndex }), []);
  const untap = useCallback((position: number) => dispatch({ type: 'untap', position }), []);
  const check = useCallback(
    () => dispatch({ type: 'check', item, bank, joiner: LANGUAGE.joiner }),
    [item, bank],
  );
  const reveal = useCallback(() => dispatch({ type: 'reveal', item, bank }), [item, bank]);
  const next = useCallback(() => dispatch({ type: 'next', itemCount: total }), [total]);
  const restart = useCallback(() => dispatch({ type: 'restart' }), []);

  return {
    state,
    language: LANGUAGE,
    scenarios: LANGUAGE.scenarios,
    scenario,
    item,
    bank,
    total,
    done,
    isLastItem: state.item === total - 1,
    showNote: state.misses >= NOTE_AFTER_MISSES || done,
    showReveal: state.misses >= REVEAL_AFTER_MISSES && !done,
    /* A finished set reads 100%, not "last item". */
    progress: (state.finished ? total : state.item) / total,
    openScenario,
    goHome,
    tap,
    untap,
    check,
    reveal,
    next,
    restart,
  };
}
