import { describe, expect, it } from 'vitest';

import type { SentenceItem, Tile } from '../../src/data/types';
import { acceptedAnswers, buildString, isCorrect } from '../../src/lib/checkAnswer';

const BANK: readonly Tile[] = [
  ['ください', 'kudasai'],
  ['パン', 'pan'],
  ['を', 'o'],
  ['お願いします', 'onegaishimasu'],
];

const ITEM: SentenceItem = {
  en: 'One bread, please.',
  ans: [['パン', 'pan'], ['を', 'o'], ['ください', 'kudasai']],
  alts: ['パンをお願いします'],
  note: 'を marks the direct object.',
};

describe('buildString', () => {
  it('joins the placed tiles in the order they were placed', () => {
    expect(buildString(BANK, [1, 2, 0])).toBe('パンをください');
  });

  it('reflects order, so the same tiles in the wrong order differ', () => {
    expect(buildString(BANK, [2, 1, 0])).toBe('をパンください');
  });

  it('is empty when nothing is placed', () => {
    expect(buildString(BANK, [])).toBe('');
  });

  it('skips an index the bank does not have rather than writing "undefined"', () => {
    expect(buildString(BANK, [1, 99, 2])).toBe('パンを');
  });
});

describe('acceptedAnswers', () => {
  it('lists the canonical answer first, then the alternates', () => {
    expect(acceptedAnswers(ITEM)).toEqual(['パンをください', 'パンをお願いします']);
  });

  it('is just the canonical answer when there are no alternates', () => {
    const noAlts: SentenceItem = { en: ITEM.en, ans: ITEM.ans, note: ITEM.note };
    expect(acceptedAnswers(noAlts)).toEqual(['パンをください']);
  });
});

describe('isCorrect', () => {
  it('accepts the canonical answer', () => {
    expect(isCorrect(ITEM, 'パンをください')).toBe(true);
  });

  /* The reason judging is on the joined string: this alternate is built from a
     different set of tiles than the canonical answer. */
  it('accepts an alternate', () => {
    expect(isCorrect(ITEM, 'パンをお願いします')).toBe(true);
  });

  it('rejects the right tiles in the wrong order', () => {
    expect(isCorrect(ITEM, 'をパンください')).toBe(false);
  });

  it('rejects a wrong particle', () => {
    expect(isCorrect(ITEM, 'パンはください')).toBe(false);
  });

  it('rejects a prefix of the answer, so a half-built sentence is not correct', () => {
    expect(isCorrect(ITEM, 'パンを')).toBe(false);
  });

  it('rejects an empty answer line', () => {
    expect(isCorrect(ITEM, '')).toBe(false);
  });
});
