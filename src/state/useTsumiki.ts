/* The seam.

   Everything else in src/ sits on one side or the other: data/ is inert
   content, lib/ and appReducer are pure logic that never import content, and
   components/ are presentational. This hook is the single place they meet — it
   looks the current scenario and item up in the content, builds the tile bank
   for them, and hands the reducer the pieces it needs.

   Storage meets them here too, and only here. appReducer stays pure and knows
   nothing about a database; the hook watches what it decides and writes that
   down. The language pack arrives as an argument rather than being imported,
   which is what lets main.tsx resolve it through a ContentSource that may one
   day be asynchronous without anything below this line changing.

   It is also where the config dials are applied, so no component has to know
   what "two misses" means. */

import { useCallback, useMemo, useReducer, useRef } from 'react';

import { NOTE_AFTER_MISSES, REVEAL_AFTER_MISSES, TILE_MULTIPLIER } from '../config';
import type { LanguagePack, Scenario, SentenceItem, Tile } from '../data/types';
import { buildBank } from '../lib/buildBank';
import { buildString, isCorrect } from '../lib/checkAnswer';
import { itemKey, tileKey } from '../lib/keys';
import type { Outcome } from '../lib/progress';
import type { ProgressStore } from '../storage/types';
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
   content is never actually empty, so this fails loudly rather than forcing
   every read below to carry a fallback. */
function first<T>(list: readonly T[], what: string): T {
  const head = list[0];
  if (!head) throw new Error(`${what} is empty — the app has no content to drill`);
  return head;
}

/* A write must never be on the path between a tap and the screen updating, so
   nothing here is awaited. A failed write costs a row of history; a write the
   drill waited on would cost the drill. */
function fireAndForget(write: Promise<void>): void {
  void write.catch((error: unknown) => {
    console.warn('Tsumiki: an attempt was not recorded.', error);
  });
}

/**
 * @param language The pack to drill. Resolved by the caller, so this hook never
 *                 imports the registry and stays testable against a stand-in.
 * @param progress Where attempts are recorded. Omitted, nothing is recorded —
 *                 which is what a component test wants, and what the app itself
 *                 falls back to if storage cannot be opened.
 */
export function useTsumiki(language: LanguagePack, progress?: ProgressStore): Tsumiki {
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

  /* When the current item went on screen, or when the last attempt on it
     settled. Held in a ref rather than in the reducer because elapsed time is
     not a drill rule and appReducer must stay pure. */
  const presentedAt = useRef(Date.now());

  /**
   * Write down one attempt, and — when the item is settled — one indirect
   * attempt per tile in its answer.
   *
   * Every check is recorded, not only the one that settles the item, so the log
   * holds each retrieval the learner actually made. A presentation can be
   * reconstructed from it later: `misses === 0` marks the first attempt of one.
   */
  const record = useCallback(
    (outcome: Outcome, settled: boolean) => {
      if (!progress) return;

      const at = Date.now();
      /* Time since the item appeared, or since the previous attempt on it. */
      const durationMs = at - presentedAt.current;
      presentedAt.current = at;

      const key = itemKey(language.code, scenario.id, item.id);
      const base = { languageCode: language.code, at, durationMs } as const;

      fireAndForget(
        progress.recordAttempt({ ...base, key, unit: 'item', outcome, misses: state.misses }),
      );

      if (!settled) return;

      /* Indirect evidence, and marked as such by viaItem: building the sentence
         correctly does not establish that every tile in it was known. There is
         also no way to tell which tile was wrong — checkAnswer compares whole
         joined strings — so a settled item can only give all of its tiles the
         same outcome. */
      for (const tile of item.ans) {
        fireAndForget(
          progress.recordAttempt({
            ...base,
            key: tileKey(language.code, tile),
            unit: 'tile',
            outcome,
            misses: 0,
            viaItem: key,
          }),
        );
      }
    },
    [progress, language.code, scenario.id, item, state.misses],
  );

  /** Restart the clock for an item about to go on screen. */
  const present = useCallback(() => {
    presentedAt.current = Date.now();
  }, []);

  const openScenario = useCallback(
    (index: number) => {
      present();
      dispatch({ type: 'openScenario', scenario: index });
    },
    [present],
  );
  const goHome = useCallback(() => dispatch({ type: 'goHome' }), []);
  const tap = useCallback((bankIndex: number) => dispatch({ type: 'tap', bankIndex }), []);
  const untap = useCallback((position: number) => dispatch({ type: 'untap', position }), []);

  const check = useCallback(() => {
    /* The reducer's own guards, mirrored. Without them a check it ignores —
       nothing placed, or the line already settled — would still be written down
       as an attempt the learner never made. */
    if (isDone(state) || state.placed.length === 0) return;

    const right = isCorrect(item, buildString(bank, state.placed, language.joiner), language.joiner);
    record(right ? 'right' : 'wrong', right);
    dispatch({ type: 'check', item, bank, joiner: language.joiner });
  }, [state, item, bank, language.joiner, record]);

  const reveal = useCallback(() => {
    if (isDone(state)) return;
    record('shown', true);
    dispatch({ type: 'reveal', item, bank });
  }, [state, item, bank, record]);

  const next = useCallback(() => {
    present();
    dispatch({ type: 'next', itemCount: total });
  }, [total, present]);

  const restart = useCallback(() => {
    present();
    dispatch({ type: 'restart' });
  }, [present]);

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
