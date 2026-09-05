/* Authored JSON in, LanguagePack out.

   The lexicon is the point: a reading is written once, and everything else
   names a tile by its text alone.

     AUTHORED                          RUNTIME
     lexicon: { "パン": "pan",  ─┐
                "を":   "o" }    │
                                 ├──►  ans: [["パン","pan"], ["を","o"]]
     ans: "パン|を"             ─┘

   So "a text reads one way per pack" becomes a property of the file's shape
   rather than a rule a test enforces.

   Errors throw with the text and its location. A pack loads at module scope, so
   a bad one fails at import — dev server and suite go red together.

   No schema library: a pack is compiled in, so tsc checks it against PackFile
   and the throws below cover the rest. If content ever arrives at runtime
   instead — fetched, or out of IndexedDB — it is untrusted input and zod is the
   right answer.

   Pure, imports no content, same rule as lib/.

   Part 1 of 2: the authored shapes and text → tile. `loadPack` itself is next. */

import type { Tile } from './types';

/** What separates one tile from the next inside an authored answer. */
export const TILE_SEPARATOR = '|';

/* ── The authored shapes ─────────────────────────────────────────────────────

   {
     "code": "ja", "name": "Japanese", "joiner": "", "fontStack": "'Noto Sans JP'",
     "lexicon":      { "パン": "pan", "を": "o", "ください": "kudasai" },
     "grammar":      ["を", "ください"],
     "particles":    { "o":   { "tile": "を", "gloss": "marks the direct object" } },
     "conjugations": { "tai": { "name": "want to", "note": "verb stem + たい" } },
     "scenarios": [{
       "id": "bakery", "name": "Bakery", "blurb": "At the counter.",
       "words": ["ケーキ"],
       "items": [{ "id": "01", "en": "One bread, please.", "ans": "パン|を|ください",
                   "alts": ["パンをお願いします"], "note": "…", "teaches": ["o"] }]
     }]
   }

   Optional: words, alts, note, teaches. Everything else is required.       */

export interface ItemEntry {
  /** Unique in its situation, permanent once shipped — history keys on it. */
  readonly id: string;
  readonly en: string;
  /**
   * Canonical answer, tile boundaries marked: `"パン|を|ください"`.
   *
   * Authored because it is underivable — 食べたい is one tile or two depending
   * on whether the sentence teaches 〜たい.
   */
  readonly ans: string;
  /** Other accepted answers, written whole. Segmented against the tiles in play. */
  readonly alts?: readonly string[];
  readonly note?: string;
  /** Particle and pattern ids mixed: `["o", "tai"]`. Sorted by lookup. */
  readonly teaches?: readonly string[];
}

export interface ScenarioEntry {
  /** Lowercase, ":"-free, unique in the pack, permanent once shipped. */
  readonly id: string;
  readonly name: string;
  readonly blurb: string;
  /** *Extra* distractors only — words in no answer. Answer vocabulary is derived. */
  readonly words?: readonly string[];
  readonly items: readonly ItemEntry[];
}

/** Keyed by particle id. `tile` must also appear in `grammar`. */
export interface ParticleEntry {
  readonly tile: string;
  readonly gloss: string;
}

/** Keyed by pattern id. */
export interface ConjugationEntry {
  readonly name: string;
  readonly note: string;
}

export interface PackFile {
  readonly code: string;
  readonly name: string;
  readonly joiner: string;
  readonly fontStack: string;
  /** Text → reading, for every tile in the pack. */
  readonly lexicon: Readonly<Record<string, string>>;
  /** The shared distractor pool, as texts. Order decides draw order. */
  readonly grammar: readonly string[];
  readonly particles: Readonly<Record<string, ParticleEntry>>;
  readonly conjugations: Readonly<Record<string, ConjugationEntry>>;
  readonly scenarios: readonly ScenarioEntry[];
}

/* ── Expanding text into tiles ───────────────────────────────────────────── */

/**
 * `"パン"` → `["パン", "pan"]`, or a throw.
 *
 * @param where For the error message: `bakery 03`, `grammar pool`.
 */
export function tileFor(
  lexicon: Readonly<Record<string, string>>,
  text: string,
  where: string,
): Tile {
  const reading = lexicon[text];

  if (reading === undefined) {
    throw new Error(`${where} — "${text}" is not in the lexicon`);
  }
  /* Would otherwise reach the screen as a tile with a blank line under it. */
  if (reading.trim() === '') {
    throw new Error(`${where} — "${text}" has an empty reading in the lexicon`);
  }

  return [text, reading];
}

/**
 * `"パン|を|ください"` → three tiles.
 *
 * Segments are trimmed, so `"パン | を"` reads the same as `"パン|を"`.
 */
export function tilesFor(
  lexicon: Readonly<Record<string, string>>,
  ans: string,
  where: string,
): Tile[] {
  const segments = ans.split(TILE_SEPARATOR).map((segment) => segment.trim());

  /* "パン||を" or a trailing "パン|". Dropping it would load a different
     sentence than the one written. */
  if (segments.some((segment) => segment === '')) {
    throw new Error(`${where} — "${ans}" has an empty tile between separators`);
  }

  return segments.map((text) => tileFor(lexicon, text, where));
}

/** A grammar pool or a situation's extra words. Order preserved. */
export function tileList(
  lexicon: Readonly<Record<string, string>>,
  texts: readonly string[],
  where: string,
): Tile[] {
  return texts.map((text) => tileFor(lexicon, text, where));
}
