/* The bank generator.

   Its own fixtures, not the shipped pack. Two rounds of borrowed content have
   been removed from this file: a JSON fixture pinning all 18 banks tile for
   tile against the prototype's bankFor(), and, after that, tests reaching into
   `LANGUAGE.scenarios[0].items[5]` for a long answer and `items[6]` for one
   with an alternate. Both made editing a sentence fail a test about buildBank.

   What is asserted here is the generator's contract, which content growth does
   not disturb: the same item and index give the same bank, every answer tile is
   in it, no text repeats, and it is oversupplied by the multiplier. */

import { describe, expect, it } from 'vitest';

import { TILE_MULTIPLIER } from '../../src/config';
import type { SentenceItem, Tile } from '../../src/data/types';
import { MIN_BANK_TILES, buildBank } from '../../src/lib/buildBank';

const texts = (tiles: readonly Tile[]) => tiles.map((t) => t[0]);

/* A stand-in language: no spaces between tiles, and pools big enough that a
   12-tile bank never exhausts them. Japanese-shaped because the joiner rule is
   what buildBank cares about, but none of it is shipped content. */
const JOINER = '';

const GRAMMAR: readonly Tile[] = [
  ['を', 'o'],
  ['は', 'wa'],
  ['が', 'ga'],
  ['に', 'ni'],
  ['で', 'de'],
  ['の', 'no'],
  ['か', 'ka'],
  ['です', 'desu'],
  ['ます', 'masu'],
  ['ください', 'kudasai'],
  ['お願いします', 'onegaishimasu'],
  ['もらいます', 'moraimasu'],
];

const WORDS: readonly Tile[] = [
  ['パン', 'pan'],
  ['ケーキ', 'keeki'],
  ['コーヒー', 'koohii'],
  ['これ', 'kore'],
  ['それ', 'sore'],
  ['一つ', 'hitotsu'],
  ['二つ', 'futatsu'],
  ['三つ', 'mittsu'],
  ['袋', 'fukuro'],
  ['甘い', 'amai'],
];

const POOLS = { grammar: GRAMMAR, words: WORDS };

/** Three tiles — the ordinary case. */
const ITEM: SentenceItem = {
  id: '01',
  en: 'One bread, please.',
  ans: [['パン', 'pan'], ['を', 'o'], ['ください', 'kudasai']],
  tags: { particles: [], conjugations: [] },
};

/** Two tiles, so the minimum size is what decides the bank. */
const SHORT: SentenceItem = {
  id: '02',
  en: 'Bread, please.',
  ans: [['パン', 'pan'], ['を', 'o']],
  tags: { particles: [], conjugations: [] },
};

/** Six tiles, so the multiplier is what decides the bank, not the minimum. */
const LONG: SentenceItem = {
  id: '03',
  en: 'Is this cake sweet?',
  ans: [
    ['これ', 'kore'],
    ['の', 'no'],
    ['ケーキ', 'keeki'],
    ['は', 'wa'],
    ['甘い', 'amai'],
    ['です', 'desu'],
  ],
  tags: { particles: [], conjugations: [] },
};

/** Its alternate needs もらいます, which the canonical answer does not supply. */
const WITH_ALT: SentenceItem = {
  id: '04',
  en: "I'll take this one.",
  ans: [['これ', 'kore'], ['を', 'o'], ['お願いします', 'onegaishimasu']],
  alts: ['これをもらいます'],
  tags: { particles: [], conjugations: [] },
};

const bankFor = (item: SentenceItem, index = 0, multiplier = TILE_MULTIPLIER) =>
  buildBank(item, index, POOLS, multiplier, JOINER);

describe('buildBank', () => {
  it('is deterministic — the same item and index give the same bank', () => {
    expect(texts(bankFor(ITEM, 3))).toEqual(texts(bankFor(ITEM, 3)));
  });

  it('varies the order by index, so consecutive items do not look alike', () => {
    expect(texts(bankFor(ITEM, 0))).not.toEqual(texts(bankFor(ITEM, 1)));
  });

  it('always contains every tile the answer needs', () => {
    for (const item of [ITEM, SHORT, LONG, WITH_ALT]) {
      const bank = texts(bankFor(item));
      for (const tile of item.ans) {
        expect(bank, `${item.id} is missing ${tile[0]}`).toContain(tile[0]);
      }
    }
  });

  it('never drops below the minimum size, however short the sentence', () => {
    expect(bankFor(SHORT).length).toBeGreaterThanOrEqual(MIN_BANK_TILES);
  });

  it('scales with the multiplier once past the minimum', () => {
    expect(bankFor(LONG, 0, 1.5).length).toBeLessThan(bankFor(LONG, 0, 4.5).length);
  });

  it('oversupplies by roughly the multiplier', () => {
    expect(bankFor(LONG, 0, 3).length).toBe(Math.ceil(LONG.ans.length * 3));
  });

  it('holds no duplicate tile text, so a tile index identifies one tile', () => {
    for (const [index, item] of [ITEM, SHORT, LONG, WITH_ALT].entries()) {
      const bank = texts(bankFor(item, index));
      expect(new Set(bank).size, `${item.id}`).toBe(bank.length);
    }
  });

  it('seeds the tiles an alternate needs but the canonical answer lacks', () => {
    expect(texts(bankFor(WITH_ALT, 6))).toContain('もらいます');
  });

  it('does not run out when the pool is smaller than the target size', () => {
    const tiny = { grammar: GRAMMAR.slice(0, 2), words: [] };
    const bank = buildBank(ITEM, 0, tiny, TILE_MULTIPLIER, JOINER);

    expect(bank.length).toBeLessThan(MIN_BANK_TILES);
    expect(texts(bank)).toEqual(expect.arrayContaining(texts(ITEM.ans)));
  });
});
