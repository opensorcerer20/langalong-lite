/* The bank generator.

   A fixture pinning all 18 banks tile for tile against the prototype's
   bankFor() used to sit at the top of this file. It was removed deliberately:
   it asserted fidelity to `prototype/`, which is frozen and no longer the
   product, and it failed on every content change — a new sentence, a new
   vocabulary word or a new situation all reshuffle banks by design. What
   remains is the generator's actual contract, which content growth does not
   disturb: the same item and index give the same bank, every answer tile is in
   it, no text repeats, and it is oversupplied by the multiplier. */

import { describe, expect, it } from 'vitest';

import { TILE_MULTIPLIER } from '../../src/config';
import { LANGUAGE } from '../../src/data/languages';
import type { SentenceItem, Tile } from '../../src/data/types';
import { MIN_BANK_TILES, buildBank } from '../../src/lib/buildBank';

const texts = (tiles: readonly Tile[]) => tiles.map((t) => t[0]);

describe('buildBank', () => {
  const scenario = LANGUAGE.scenarios[0]!;
  const pools = { grammar: LANGUAGE.grammar, words: scenario.words };
  const bankFor = (item: SentenceItem, index = 0, multiplier = TILE_MULTIPLIER) =>
    buildBank(item, index, pools, multiplier, LANGUAGE.joiner);

  it('is deterministic — the same item and index give the same bank', () => {
    const item = scenario.items[0]!;
    expect(texts(bankFor(item, 3))).toEqual(texts(bankFor(item, 3)));
  });

  it('varies the order by index, so consecutive items do not look alike', () => {
    const item = scenario.items[0]!;
    expect(texts(bankFor(item, 0))).not.toEqual(texts(bankFor(item, 1)));
  });

  it('always contains every tile the answer needs', () => {
    for (const item of scenario.items) {
      const bank = texts(bankFor(item));
      for (const tile of item.ans) {
        expect(bank).toContain(tile[0]);
      }
    }
  });

  it('never drops below the minimum size, however short the sentence', () => {
    const short: SentenceItem = {
      id: 'short',
      en: 'Bread, please.',
      ans: [['パン', 'pan'], ['を', 'o']],
      note: 'Two tiles only.',
      tags: { particles: [], conjugations: [] },
    };
    expect(bankFor(short).length).toBeGreaterThanOrEqual(MIN_BANK_TILES);
  });

  it('scales with the multiplier once past the minimum', () => {
    const long = scenario.items[5]!; /* 6 tiles */
    expect(bankFor(long, 0, 1.5).length).toBeLessThan(bankFor(long, 0, 4.5).length);
  });

  it('oversupplies by roughly the multiplier', () => {
    const long = scenario.items[5]!;
    expect(bankFor(long, 0, 3).length).toBe(Math.ceil(long.ans.length * 3));
  });

  it('holds no duplicate tile text, so a tile index identifies one tile', () => {
    for (const [index, item] of scenario.items.entries()) {
      const bank = texts(bankFor(item, index));
      expect(new Set(bank).size, `item ${index}`).toBe(bank.length);
    }
  });

  it('seeds the tiles an alternate needs but the canonical answer lacks', () => {
    /* "これをもらいます" needs もらいます, which the canonical これをお願いします
       does not supply. */
    const item = scenario.items[6]!;
    expect(item.alts).toContain('これをもらいます');
    expect(texts(bankFor(item, 6))).toContain('もらいます');
  });

  it('does not run out when the pool is smaller than the target size', () => {
    const item = scenario.items[0]!;
    const tiny = { grammar: LANGUAGE.grammar.slice(0, 2), words: [] };
    const bank = buildBank(item, 0, tiny, TILE_MULTIPLIER, LANGUAGE.joiner);
    expect(bank.length).toBeLessThan(MIN_BANK_TILES);
    expect(texts(bank)).toEqual(expect.arrayContaining(texts(item.ans)));
  });
});
