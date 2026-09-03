/* The shapes content takes once it is in play.

   schema.ts holds the same content at rest, where an exercise names its tiles
   by id. resolve.ts is the one-way trip between the two:

     schema.ts (stored)            resolve.ts        drill.ts (in play)
     ------------------            ----------        ------------------
     StoredExercise                                  DrillItem
       answerTileIds: [              each id           answer: [
         'noun:パン',       ─────►    looked up  ─────►   { id: 'noun:パン',
         'particle:を',              in                     newLanguageText: 'パン',
         'verb:ください',             store.tiles            reading: 'pan',
       ]                                                    type: 'noun' },
                                                          … ]

   Normalised for storage, denormalised for use. buildBank and the components
   never see an id or a lookup table — they are handed the tiles.

   What a resolved pack contains:

     DrillPack
      ├─ code, name, joiner, fontStack     (inherited from DrillLanguage)
      ├─ grammar[]      → Tile             shared distractor pool
      └─ scenarios[]    → DrillScenario
          ├─ id, name, kicker, blurb
          ├─ words[]    → Tile             this situation's distractors
          └─ items[]    → DrillItem
              ├─ promptText, note, tags[]
              ├─ answer[]        → Tile    the canonical answer, in order
              └─ alternates[][]  → Tile    each row a complete answer

   These shapes take over from types.ts in step 7, which is why the names
   overlap with nothing there. */

import type { ScenarioId, TileType } from './schema';

/**
 * One tile, ready to draw.
 *
 * ```
 * { id: 'particle:を', newLanguageText: 'を', reading: 'o', type: 'particle' }
 * ```
 *
 * StoredTile's `scenarioIds` is dropped on the way in — which situations an
 * authored tile belongs to is a fact about the library, not about the tile
 * sitting in front of a learner. `id` survives because it is the tile's
 * identity: two tiles with the same `newLanguageText` are the same tile only
 * if their ids agree.
 */
export interface Tile {
  readonly id: string;
  /** The tile's text in the language being learned, e.g. パン. */
  readonly newLanguageText: string;
  /** Its reading in latin script — romaji for Japanese, pinyin for Mandarin. */
  readonly reading: string;
  readonly type: TileType;
}

/**
 * One drill item: a prompt, and every tile sequence that answers it.
 *
 * ```
 * promptText  'One bread, please.'
 * answer      [パン] [を] [ください]              ← canonical
 * alternates  [ [パン] [を] [お願いします] ]       ← row 0, also accepted
 * ```
 *
 * `answer` and each row of `alternates` are complete answers in their own
 * right, so judging is "does the built sentence match any one of them".
 */
export interface DrillItem {
  readonly id: string;
  /** The native language prompt shown to the learner. */
  readonly promptText: string;
  /** The canonical answer, in order. */
  readonly answer: readonly Tile[];
  /**
   * Other complete answers accepted as correct. Always an array, often empty —
   * never optional, so no caller has to spell `?? []`.
   */
  readonly alternates: readonly (readonly Tile[])[];
  /** The grammar explanation shown after a second miss. */
  readonly note: string;
  /** Flat grammar labels. Carried through; nothing reads them yet. */
  readonly tags: readonly string[];
}

/**
 * One situation, with its items and the vocabulary its distractors draw on.
 *
 * `words` and `items` are independent lists, not a whole and its parts — a
 * tile can be in either, both, or only one:
 *
 * ```
 * words[]   一つ  三つ  ケーキ  コーヒー   ← offered as distractors
 * items[]   パン  を    ください  クロワッサン ← used in answers
 *           └── パン is in both; クロワッサン only ever in an answer ──┘
 * ```
 */
export interface DrillScenario {
  readonly id: ScenarioId;
  readonly name: string;
  readonly kicker: string;
  readonly blurb: string;
  readonly items: readonly DrillItem[];
  /** Scene vocabulary, mixed with the grammar pool to make distractors. */
  readonly words: readonly Tile[];
}

/**
 * The facts about a language that are not content: how its script joins, and
 * what renders it. Supplied alongside the store, since neither is a property of
 * any situation in it.
 */
export interface DrillLanguage {
  /** BCP 47 tag. The pack's identity in the registry. */
  readonly code: string;
  /** The language's name in English. UI copy uses it directly. */
  readonly name: string;
  /**
   * What goes between tiles when they are joined into a sentence. Empty for
   * Japanese, which is written without spaces; ' ' for a space-separated
   * language. The one genuinely script-dependent rule in the app.
   */
  readonly joiner: string;
  /** Font families to try ahead of the body stack for new-language text. */
  readonly fontStack: string;
}

/** One language the app can drill: its facts, its distractor pool, its sets. */
export interface DrillPack extends DrillLanguage {
  /**
   * The shared distractor pool: this language's particles, endings and function
   * words. Every situation draws from it on top of its own vocabulary, so a
   * wrong tile is always grammatically plausible.
   */
  readonly grammar: readonly Tile[];
  /** The situations this language drills, in home-screen order. */
  readonly scenarios: readonly DrillScenario[];
}
