/* Authored JSON in, LanguagePack out.

   The lexicon is the point: a reading is written once, and everything else
   names a tile by its text alone.

     AUTHORED                          RUNTIME
     lexicon: { "パン": "pan",  ─┐
                "を":   "o" }    │
                                 ├──►  ans: [["パン","pan"], ["を","o"]]
     ans: "パン|を"             ─┘

   - Errors throw with the text and its location, e.g. `bakery 03`. A pack
     loads at module scope, so a bad one fails at import.
   - No schema library: a pack is compiled in, so tsc checks it against
     PackFile and the throws below cover the rest.
   - Pure; it is handed a parsed file. */

import { getVocabIn } from '../lib/tags';
import type {
  ConjugationPattern,
  LanguagePack,
  Particle,
  Scenario,
  SentenceItem,
  SentenceTags,
  Tile,
} from './types';

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
  /** Unique in its situation. */
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
  /** Lowercase, ":"-free, unique in the pack. */
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

/* ── The derivations ─────────────────────────────────────────────────────── */

/**
 * `["o", "tai"]` → `{ particles: ["o"], conjugations: ["tai"] }`.
 *
 * One flat list is authored because an author thinks "this teaches を", not
 * "を belongs in the particles bucket". Which bucket follows from the id.
 */
function resolveTeaches(
  teaches: readonly string[],
  particleIds: ReadonlySet<string>,
  patternIds: ReadonlySet<string>,
  where: string,
): SentenceTags {
  const particles: string[] = [];
  const conjugations: string[] = [];

  for (const id of teaches) {
    if (particleIds.has(id)) particles.push(id);
    else if (patternIds.has(id)) conjugations.push(id);
    else throw new Error(`${where} — teaches "${id}", which the pack declares nowhere`);
  }

  return { particles, conjugations };
}

/**
 * A situation's distractor vocabulary: the content words its own answers use,
 * then whatever extras `words` lists.
 *
 * - Deduped by text, grammar-pool tiles excluded.
 * - Deduped silently, so a new sentence never turns an existing `words` entry
 *   into an error.
 */
function deriveWords(
  items: readonly SentenceItem[],
  extras: readonly Tile[],
  grammar: readonly Tile[],
): Tile[] {
  const words: Tile[] = [];
  const seen = new Set<string>(grammar.map((tile) => tile[0]));

  for (const tile of [...items.flatMap((item) => getVocabIn(item, grammar)), ...extras]) {
    if (seen.has(tile[0])) continue;
    seen.add(tile[0]);
    words.push(tile);
  }

  return words;
}

/** `0` → `01`. Position is the number, so reordering renumbers. */
function lessonNumFor(index: number): string {
  return String(index + 1).padStart(2, '0');
}

/* ── Assembling the pack ─────────────────────────────────────────────────── */

/**
 * Expand an authored pack file into the pack the app drills.
 *
 * Throws on anything it cannot resolve. Called at module scope, so a broken
 * pack fails at import rather than mid-drill.
 */
export function loadPack(file: PackFile): LanguagePack {
  const { lexicon } = file;
  const grammar = tileList(lexicon, file.grammar, 'the grammar pool');

  const particles: Particle[] = Object.entries(file.particles).map(([id, entry]) => ({
    id,
    tile: tileFor(lexicon, entry.tile, `particle "${id}"`),
    gloss: entry.gloss,
  }));

  const conjugations: ConjugationPattern[] = Object.entries(file.conjugations).map(
    ([id, entry]) => ({ id, name: entry.name, note: entry.note }),
  );

  const particleIds = new Set(particles.map((particle) => particle.id));
  const patternIds = new Set(conjugations.map((pattern) => pattern.id));

  /* `teaches` resolves an id by which registry holds it, so one id in both
     would silently land in whichever is checked first. */
  for (const id of patternIds) {
    if (particleIds.has(id)) {
      throw new Error(`"${id}" is declared as both a particle and a conjugation pattern`);
    }
  }

  const scenarios: Scenario[] = file.scenarios.map((entry, index) => {
    const items: SentenceItem[] = entry.items.map((item) => {
      const where = `${entry.id} ${item.id}`;

      return {
        id: item.id,
        en: item.en,
        ans: tilesFor(lexicon, item.ans, where),
        /* Spread rather than assigned: under exactOptionalPropertyTypes an
           absent key and a present `undefined` are different things. */
        ...(item.alts === undefined ? {} : { alts: item.alts }),
        ...(item.note === undefined ? {} : { note: item.note }),
        tags: resolveTeaches(item.teaches ?? [], particleIds, patternIds, where),
      };
    });

    return {
      id: entry.id,
      name: entry.name,
      lessonNum: lessonNumFor(index),
      blurb: entry.blurb,
      items,
      words: deriveWords(items, tileList(lexicon, entry.words ?? [], `${entry.id} words`), grammar),
    };
  });

  return {
    code: file.code,
    name: file.name,
    joiner: file.joiner,
    fontStack: file.fontStack,
    grammar,
    particles,
    conjugations,
    scenarios,
  };
}
