/* The migration's safety net: the resolved en2ja pack against the live ja pack.

   Temporary by design. It exists to prove that moving content into the schema
   from docs/japanese-app-content-architecture.md changed nothing the learner
   sees, and it can only prove that while both packs are still here. Step 8
   deletes it along with src/data/ja/.

   Read it as one claim in several parts: the new pack drills the same sentences,
   in the same order, out of the same tile banks. */

import { describe, expect, it } from 'vitest';

import { TILE_MULTIPLIER } from '../../src/config';
import { EN2JA } from '../../src/data/en2ja';
import { JA } from '../../src/data/ja';
import type { DrillItem, Tile } from '../../src/data/drill';
import type { SentenceItem, Tile as TupleTile } from '../../src/data/types';
import { buildBank } from '../../src/lib/buildBank';
import { segmentLongestFirst } from '../../src/lib/segment';

/** The new pack's tiles as the old pack wrote them, so the two can be compared. */
const asTuples = (tiles: readonly Tile[]): TupleTile[] =>
  tiles.map((tile) => [tile.newLanguageText, tile.reading]);

/**
 * The old pack's tuples as the new pack's objects, so buildBank — which now
 * takes only the new shape — can be run over both.
 *
 * The synthesised id is the tile's text. The real registry keys on
 * `type:text`, but no two tiles in this content share a text, so keying on
 * text alone partitions the tiles identically — and it is exactly the key the
 * old buildBank deduplicated on, which is the behaviour being compared.
 */
const asTiles = (tuples: readonly TupleTile[]): Tile[] =>
  tuples.map(([text, reading]) => ({
    id: text,
    newLanguageText: text,
    reading,
    type: 'noun' as const,
  }));

const texts = (tiles: readonly Tile[]) => tiles.map((tile) => tile.newLanguageText);

describe('the en2ja pack reproduces the ja pack', () => {
  it('declares the same language facts', () => {
    expect(EN2JA.code).toBe(JA.code);
    expect(EN2JA.name).toBe(JA.name);
    expect(EN2JA.joiner).toBe(JA.joiner);
    expect(EN2JA.fontStack).toBe(JA.fontStack);
  });

  it('draws on the same grammar pool, in the same order', () => {
    expect(asTuples(EN2JA.grammar)).toEqual(JA.grammar.map((t) => [...t]));
  });

  it('ships the same situations, in home-screen order', () => {
    expect(EN2JA.scenarios.map((s) => s.name)).toEqual(JA.scenarios.map((s) => s.name));
    expect(EN2JA.scenarios.map((s) => s.kicker)).toEqual(JA.scenarios.map((s) => s.kicker));
    expect(EN2JA.scenarios.map((s) => s.blurb)).toEqual(JA.scenarios.map((s) => s.blurb));
  });
});

/* Paired by position, which the assertions above have already established is
   the same pairing the home screen makes. */
const PAIRS = EN2JA.scenarios.map((scenario, index) => ({
  name: scenario.name,
  fresh: scenario,
  old: JA.scenarios[index]!,
}));

describe.each(PAIRS)('$name', ({ fresh, old }) => {
  it('offers the same scene vocabulary, in the same order', () => {
    expect(asTuples(fresh.words)).toEqual(old.words.map((t) => [...t]));
  });

  it('drills the same number of sentences', () => {
    expect(fresh.items.length).toBe(old.items.length);
  });

  it('asks the same prompts, in the same order', () => {
    expect(fresh.items.map((i) => i.promptText)).toEqual(old.items.map((i) => i.en));
  });

  it('shows the same grammar note on each one', () => {
    expect(fresh.items.map((i) => i.note)).toEqual(old.items.map((i) => i.note));
  });

  it('spells out the same canonical answer, text and reading alike', () => {
    fresh.items.forEach((item, index) => {
      expect(asTuples(item.answer), item.promptText).toEqual(old.items[index]!.ans.map((t) => [...t]));
    });
  });

  /* The old pack stored alternates as written-out strings and split them back
     into tiles at bank time; the new one stores the tiles. Joining the new
     tiles has to land on exactly the old strings, or an answer that used to be
     accepted no longer is. */
  it('accepts the same alternates', () => {
    fresh.items.forEach((item, index) => {
      const joined = item.alternates.map((alternate) =>
        alternate.map((tile) => tile.newLanguageText).join(EN2JA.joiner),
      );
      expect(joined, item.promptText).toEqual([...(old.items[index]!.alts ?? [])]);
    });
  });

  /* The one that would catch a silent regression the others would miss. The
     bank is a deterministic function of the item and the two pools, so if the
     tiles or their order drifted anywhere in the migration, the banks diverge
     even when every assertion above passes. */
  it('builds an identical tile bank for every item', () => {
    fresh.items.forEach((item, index) => {
      const freshBank = buildBank(
        item,
        index,
        { grammar: EN2JA.grammar, words: fresh.words },
        TILE_MULTIPLIER,
      );
      const oldBank = buildBank(
        toDrillItem(old.items[index]!, old),
        index,
        { grammar: asTiles(JA.grammar), words: asTiles(old.words) },
        TILE_MULTIPLIER,
      );
      expect(texts(freshBank), item.promptText).toEqual(texts(oldBank));
    });
  });
});

/**
 * An old-pack item in the new shape, so both can go through the same buildBank.
 *
 * The old `alts` are written-out strings, so recovering their tiles means
 * segmenting them against the vocabulary in play — the very step the new
 * format removes, and the reason this function exists only in this file.
 */
function toDrillItem(item: SentenceItem, scenario: { words: readonly TupleTile[] }): DrillItem {
  const vocab = [...item.ans, ...JA.grammar, ...scenario.words];
  return {
    id: 'old',
    promptText: item.en,
    answer: asTiles(item.ans),
    alternates: (item.alts ?? []).map((alt) => {
      const { tiles, rest } = segmentLongestFirst(alt, vocab, JA.joiner);
      expect(rest, `"${alt}" left "${rest}" unsegmented`).toBe('');
      return asTiles(tiles);
    }),
    note: item.note,
    tags: [],
  };
}
