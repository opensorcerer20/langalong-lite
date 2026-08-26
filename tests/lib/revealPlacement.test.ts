import { describe, expect, it } from 'vitest';

import { TILE_MULTIPLIER } from '../../src/config';
import { LANGUAGE } from '../../src/data/languages';
import type { SentenceItem, Tile } from '../../src/data/types';
import { buildBank } from '../../src/lib/buildBank';
import { buildString, isCorrect } from '../../src/lib/checkAnswer';
import { revealIndices } from '../../src/lib/revealPlacement';

const ITEM: SentenceItem = {
  en: 'One bread, please.',
  ans: [['パン', 'pan'], ['を', 'o'], ['ください', 'kudasai']],
  note: 'を marks the direct object.',
};

describe('revealIndices', () => {
  it('points at the bank positions that spell the answer', () => {
    const bank: readonly Tile[] = [
      ['ください', 'kudasai'],
      ['は', 'wa'],
      ['パン', 'pan'],
      ['を', 'o'],
    ];
    expect(revealIndices(ITEM, bank)).toEqual([2, 3, 0]);
  });

  /* The claimed-position guard. A bank holding the same text twice must not
     return the same index twice, or the answer line renders short. */
  it('claims each position once when the bank repeats a tile', () => {
    const doubled: SentenceItem = {
      en: 'Bread bread.',
      ans: [['パン', 'pan'], ['パン', 'pan']],
      note: 'Contrived.',
    };
    const bank: readonly Tile[] = [['パン', 'pan'], ['を', 'o'], ['パン', 'pan']];
    expect(revealIndices(doubled, bank)).toEqual([0, 2]);
  });

  it('falls back to 0 for a tile missing from the bank', () => {
    expect(revealIndices(ITEM, [['パン', 'pan']])).toEqual([0, 0, 0]);
  });

  it('returns one index per answer tile', () => {
    const pools = { grammar: LANGUAGE.grammar, words: [] };
    const bank = buildBank(ITEM, 0, pools, TILE_MULTIPLIER, LANGUAGE.joiner);
    expect(revealIndices(ITEM, bank)).toHaveLength(ITEM.ans.length);
  });
});

/* The property that actually matters: revealing produces a correct answer. */
describe('revealIndices over the shipped content', () => {
  it.each(LANGUAGE.scenarios)('builds an accepted answer for every $name item', (scenario) => {
    scenario.items.forEach((item, index) => {
      const bank = buildBank(
        item,
        index,
        { grammar: LANGUAGE.grammar, words: scenario.words },
        TILE_MULTIPLIER,
        LANGUAGE.joiner,
      );
      const built = buildString(bank, revealIndices(item, bank), LANGUAGE.joiner);
      const where = `${scenario.name} item ${index}: "${built}"`;
      expect(isCorrect(item, built, LANGUAGE.joiner), where).toBe(true);
    });
  });
});
