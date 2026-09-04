/* The shapes content is *authored* in — the raw format from
   docs/japanese-app-content-architecture.md.

     rawContent.ts  authored  ─buildStore─►  schema.ts  stored  ─resolve─►  drill.ts  in play
     JSON, tuples, no ids                    tables, ids, deduped           tiles looked up

   Tuples, not ids: a tile's id is its type and text joined, so
   ["パン", "pan", "noun"] already says what `noun:パン` says. Same three fields
   in answers, alternates, grammar and vocab alike.

   These types describe raw content that has already been validated —
   validateRaw.ts is the only way in from `unknown`. */

import type { LibraryId, ScenarioId, TileType } from '../schema';

/** One authored tile. `type` is half a tile's identity, so it is required, never defaulted. */
export type RawTuple = readonly [newLanguageText: string, reading: string, type: TileType];

/** Grammar labels, grouped as an author writes them. tags.ts flattens these to `particle:を`. */
export interface RawTags {
  readonly particles?: readonly string[];
  readonly conjugations?: readonly string[];
}

/** One authored exercise. A short phrase is just a shorter `answer` — no separate shape. */
export interface RawEntry {
  /** Authoritative. The file an entry sits in is a convenience, not the source of truth. */
  readonly scenario: ScenarioId;
  /** The native-language prompt, e.g. 'One bread, please.' */
  readonly question: string;
  readonly answer: readonly RawTuple[];
  /** Other complete accepted answers. Optional: 15 of the 18 current entries have none. */
  readonly alts?: readonly (readonly RawTuple[])[];
  /** Shown after a second miss. Required. */
  readonly note: string;
  readonly tags?: RawTags;
}

/** One situation's facts. None of these can be recovered from its entries. */
export interface RawScenarioMeta {
  readonly id: ScenarioId;
  /** Display name, e.g. 'Train station'. */
  readonly name: string;
  /** The home-screen one-liner. */
  readonly blurb: string;
  /** This situation's entries file, relative to the library folder. */
  readonly file: string;
  /**
   * Words offered as wrong options, on top of the grammar pool. Overlaps the
   * answers by hand: holds words in no answer, omits words that are.
   *
   * Order is load-bearing — buildBank steps through [grammar, ...vocab] at a
   * fixed stride. Preserved verbatim on import, never sorted.
   */
  readonly vocab: readonly RawTuple[];
}

/** A library's manifest: everything about the library that is not an exercise. */
export interface RawManifest {
  readonly library: LibraryId;
  /** Shared distractors. Explicit, because を is in the pool *and* in half the bakery answers. */
  readonly grammar: readonly RawTuple[];
  /** Home-screen order. `kicker` is derived from position here, so it cannot drift. */
  readonly scenarios: readonly RawScenarioMeta[];
}

/* No `language` field: joiner and font stack describe Japanese, not this
   content, and stay hand-authored beside the resolveLibrary call in index.ts. */
