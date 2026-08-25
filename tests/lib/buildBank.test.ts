/* The bank generator, including a parity check against the prototype.

   prototype-banks.json was produced by running the original bankFor() in
   prototype/app.js over every item in both sets. It pins the exact tile order
   of all 18 banks, so any change to the draw stride or the shuffle arithmetic
   shows up here rather than as a silently different app. */

import { describe, expect, it } from 'vitest';

import { TILE_MULTIPLIER } from '../../src/config';
import { GRAMMAR } from '../../src/data/grammar';
import { SCENARIOS } from '../../src/data/scenarios';
import type { SentenceItem, Tile } from '../../src/data/types';
import { MIN_BANK_TILES, buildBank } from '../../src/lib/buildBank';
import PROTOTYPE_BANKS from '../fixtures/prototype-banks.json';

const kana = (tiles: readonly Tile[]) => tiles.map((t) => t[0]);

describe('buildBank — parity with the prototype', () => {
  it.each(SCENARIOS)('reproduces every $name bank tile for tile', (scenario) => {
    const expected = (PROTOTYPE_BANKS as Record<string, string[][]>)[scenario.name];
    expect(expected, `no fixture for "${scenario.name}"`).toBeDefined();

    scenario.items.forEach((item, index) => {
      const bank = buildBank(
        item,
        index,
        { grammar: GRAMMAR, words: scenario.words },
        TILE_MULTIPLIER,
      );
      expect(kana(bank), `${scenario.name} item ${index}`).toEqual(expected?.[index]);
    });
  });
});

describe('buildBank', () => {
  const scenario = SCENARIOS[0]!;
  const pools = { grammar: GRAMMAR, words: scenario.words };
  const bankFor = (item: SentenceItem, index = 0, multiplier = TILE_MULTIPLIER) =>
    buildBank(item, index, pools, multiplier);

  it('is deterministic — the same item and index give the same bank', () => {
    const item = scenario.items[0]!;
    expect(kana(bankFor(item, 3))).toEqual(kana(bankFor(item, 3)));
  });

  it('varies the order by index, so consecutive items do not look alike', () => {
    const item = scenario.items[0]!;
    expect(kana(bankFor(item, 0))).not.toEqual(kana(bankFor(item, 1)));
  });

  it('always contains every tile the answer needs', () => {
    for (const item of scenario.items) {
      const bank = kana(bankFor(item));
      for (const tile of item.ans) {
        expect(bank).toContain(tile[0]);
      }
    }
  });

  it('never drops below the minimum size, however short the sentence', () => {
    const short: SentenceItem = {
      en: 'Bread, please.',
      ans: [['パン', 'pan'], ['を', 'o']],
      note: 'Two tiles only.',
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

  it('holds no duplicate kana, so a tile index identifies one tile', () => {
    for (const [index, item] of scenario.items.entries()) {
      const bank = kana(bankFor(item, index));
      expect(new Set(bank).size, `item ${index}`).toBe(bank.length);
    }
  });

  it('seeds the tiles an alternate needs but the canonical answer lacks', () => {
    /* "これをもらいます" needs もらいます, which the canonical これをお願いします
       does not supply. */
    const item = scenario.items[6]!;
    expect(item.alts).toContain('これをもらいます');
    expect(kana(bankFor(item, 6))).toContain('もらいます');
  });

  it('does not run out when the pool is smaller than the target size', () => {
    const item = scenario.items[0]!;
    const tiny = { grammar: GRAMMAR.slice(0, 2), words: [] };
    const bank = buildBank(item, 0, tiny, TILE_MULTIPLIER);
    expect(bank.length).toBeLessThan(MIN_BANK_TILES);
    expect(kana(bank)).toEqual(expect.arrayContaining(kana(item.ans)));
  });
});
