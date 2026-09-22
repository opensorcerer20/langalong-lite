import { describe, expect, it } from 'vitest';

import type { SentenceItem, Tile } from '../../src/data/types';
import { wrongPositions } from '../../src/lib/diffAnswer';

/* The fixture is Japanese, which is written without spaces. */
const JOINER = '';

const BANK: readonly Tile[] = [
  ['パン', 'pan'],
  ['を', 'o'],
  ['ください', 'kudasai'],
  ['お願いします', 'onegaishimasu'],
  ['は', 'wa'],
  ['が', 'ga'],
];

const ITEM: SentenceItem = {
  id: '01',
  en: 'One bread, please.',
  ans: [
    ['パン', 'pan'],
    ['を', 'o'],
    ['ください', 'kudasai'],
  ],
  alts: ['パンをお願いします'],
  note: 'を marks the direct object.',
  tags: { particles: [], conjugations: [] },
};

const wrong = (placed: readonly number[]) => wrongPositions(ITEM, BANK, placed, JOINER);

describe('wrongPositions', () => {
  it('marks nothing on a correct line', () => {
    expect(wrong([0, 1, 2])).toEqual([]);
  });

  it('marks nothing on an empty line', () => {
    expect(wrong([])).toEqual([]);
  });

  it('marks an extra tile wedged into a correct line', () => {
    expect(wrong([0, 4, 1, 2])).toEqual([1]);
  });

  /* A missing tile is not a wrong one — there is nothing on the line to mark. */
  it('marks nothing when the line is a correct answer with a tile left out', () => {
    expect(wrong([0, 2])).toEqual([]);
  });

  it('marks the wrong particle rather than the whole line', () => {
    expect(wrong([0, 4, 2])).toEqual([1]);
  });

  it('marks every tile when none of them belong', () => {
    expect(wrong([4, 5])).toEqual([0, 1]);
  });

  /* The point of comparing against alternates: お願いします is nowhere in `ans`,
     so judging against the canonical answer alone would mark it wrong. */
  it('judges a line against the alternate it is closest to', () => {
    expect(wrong([0, 1, 3])).toEqual([]);
    expect(wrong([0, 3])).toEqual([]);
  });

  it('marks an extra tile in a line built towards an alternate', () => {
    expect(wrong([0, 1, 5, 3])).toEqual([2]);
  });

  /* Content and bank drifting apart must not leave a position unaccounted for. */
  it('marks a position whose bank index does not resolve', () => {
    expect(wrong([0, 99, 1, 2])).toEqual([1]);
  });
});
