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

/* The fixture is Japanese, which is written without spaces. A space-separated
   language is exercised in the SPACED block at the foot of the file. */
const JOINER = '';

describe('buildString', () => {
  it('joins the placed tiles in the order they were placed', () => {
    expect(buildString(BANK, [1, 2, 0], JOINER)).toBe('パンをください');
  });

  it('reflects order, so the same tiles in the wrong order differ', () => {
    expect(buildString(BANK, [2, 1, 0], JOINER)).toBe('をパンください');
  });

  it('is empty when nothing is placed', () => {
    expect(buildString(BANK, [], JOINER)).toBe('');
  });

  it('skips an index the bank does not have rather than writing "undefined"', () => {
    expect(buildString(BANK, [1, 99, 2], JOINER)).toBe('パンを');
  });
});

describe('acceptedAnswers', () => {
  it('lists the canonical answer first, then the alternates', () => {
    expect(acceptedAnswers(ITEM, JOINER)).toEqual(['パンをください', 'パンをお願いします']);
  });

  it('is just the canonical answer when there are no alternates', () => {
    const noAlts: SentenceItem = { en: ITEM.en, ans: ITEM.ans, note: ITEM.note };
    expect(acceptedAnswers(noAlts, JOINER)).toEqual(['パンをください']);
  });
});

describe('isCorrect', () => {
  it('accepts the canonical answer', () => {
    expect(isCorrect(ITEM, 'パンをください', JOINER)).toBe(true);
  });

  /* The reason judging is on the joined string: this alternate is built from a
     different set of tiles than the canonical answer. */
  it('accepts an alternate', () => {
    expect(isCorrect(ITEM, 'パンをお願いします', JOINER)).toBe(true);
  });

  it('rejects the right tiles in the wrong order', () => {
    expect(isCorrect(ITEM, 'をパンください', JOINER)).toBe(false);
  });

  it('rejects a wrong particle', () => {
    expect(isCorrect(ITEM, 'パンはください', JOINER)).toBe(false);
  });

  it('rejects a prefix of the answer, so a half-built sentence is not correct', () => {
    expect(isCorrect(ITEM, 'パンを', JOINER)).toBe(false);
  });

  it('rejects an empty answer line', () => {
    expect(isCorrect(ITEM, '', JOINER)).toBe(false);
  });
});

/* Nothing in the app is space-separated yet, so this is the only cover the
   non-empty joiner has. It is what a Spanish or French pack would rely on. */
describe('a space-separated language', () => {
  const SPACED_BANK: readonly Tile[] = [
    ['pan', 'pan'],
    ['un', 'un'],
    ['por favor', 'por favor'],
  ];

  const SPACED_ITEM: SentenceItem = {
    en: 'One bread, please.',
    ans: [['un', 'un'], ['pan', 'pan'], ['por favor', 'por favor']],
    alts: ['un pan'],
    note: 'Placeholder.',
  };

  it('joins the placed tiles with the separator', () => {
    expect(buildString(SPACED_BANK, [1, 0, 2], ' ')).toBe('un pan por favor');
  });

  it('leaves no doubled separator where an unresolved index was dropped', () => {
    expect(buildString(SPACED_BANK, [1, 99, 0], ' ')).toBe('un pan');
  });

  it('joins the canonical answer with the separator too', () => {
    expect(acceptedAnswers(SPACED_ITEM, ' ')).toEqual(['un pan por favor', 'un pan']);
    expect(isCorrect(SPACED_ITEM, 'un pan por favor', ' ')).toBe(true);
  });

  /* The joiner is not cosmetic: judged under Japanese's rules the same tiles
     build a different string, and the right answer would be marked wrong. */
  it('does not accept the answer run together without separators', () => {
    expect(isCorrect(SPACED_ITEM, 'unpanpor favor', ' ')).toBe(false);
  });
});
