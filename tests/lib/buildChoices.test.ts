/* The options offered for one question.

   Determinism is the property worth pinning: the same question must present the
   same options in the same order every render, or a tile's position stops being
   a stable identity and the UI remounts under the learner's finger. */

import { describe, expect, it } from 'vitest';

import type { Tile } from '../../src/data/types';
import { buildChoices } from '../../src/lib/buildChoices';

const ANSWER: Tile = ['パン', 'pan'];

const POOL: readonly Tile[] = [
  ['ケーキ', 'keeki'],
  ['コーヒー', 'koohii'],
  ['袋', 'fukuro'],
  ['現金', 'genkin'],
  ['カード', 'kaado'],
  ['おすすめ', 'osusume'],
];

const texts = (tiles: readonly Tile[]) => tiles.map((tile) => tile[0]);

describe('buildChoices', () => {
  it('offers exactly the number of options asked for', () => {
    expect(buildChoices(ANSWER, POOL, 4, 0)).toHaveLength(4);
  });

  it('always includes the answer', () => {
    for (let index = 0; index < 6; index++) {
      expect(texts(buildChoices(ANSWER, POOL, 4, index)), `index ${index}`).toContain('パン');
    }
  });

  it('draws the rest from the pool', () => {
    const pool = new Set(texts(POOL));
    for (const [text] of buildChoices(ANSWER, POOL, 4, 0)) {
      if (text !== 'パン') expect(pool.has(text), `"${text}" is not from the pool`).toBe(true);
    }
  });

  /* Two identical options make one of them unanswerable. */
  it('never repeats an option', () => {
    for (let index = 0; index < 6; index++) {
      const choices = texts(buildChoices(ANSWER, POOL, 4, index));
      expect(new Set(choices).size, `index ${index}`).toBe(choices.length);
    }
  });

  it('does not offer the answer twice when the pool also holds it', () => {
    const choices = texts(buildChoices(ANSWER, [ANSWER, ...POOL], 4, 0));
    expect(choices.filter((text) => text === 'パン')).toHaveLength(1);
  });

  /* The identity guarantee the UI depends on. */
  it('is deterministic — the same question builds the same options in the same order', () => {
    expect(buildChoices(ANSWER, POOL, 4, 2)).toEqual(buildChoices(ANSWER, POOL, 4, 2));
  });

  it('varies by index, so consecutive questions do not draw the same distractors', () => {
    const first = texts(buildChoices(ANSWER, POOL, 4, 0));
    const second = texts(buildChoices(ANSWER, POOL, 4, 1));
    expect(first).not.toEqual(second);
  });

  /* Otherwise the answer sits first in every question and the exercise is a
     test of noticing that rather than of vocabulary. */
  it('does not leave the answer in the same slot every time', () => {
    const slots = new Set<number>();
    for (let index = 0; index < 8; index++) {
      slots.add(texts(buildChoices(ANSWER, POOL, 4, index)).indexOf('パン'));
    }
    expect(slots.size).toBeGreaterThan(1);
  });

  describe('when the pool cannot fill the question', () => {
    /* A short list is a thin question; a padded one would mean a repeated or
       empty option, which is a broken question. */
    it('returns what it can rather than repeating or inventing an option', () => {
      const choices = buildChoices(ANSWER, POOL.slice(0, 1), 4, 0);
      expect(texts(choices)).toHaveLength(2);
      expect(texts(choices)).toContain('パン');
    });

    it('still offers the answer when the pool is empty', () => {
      expect(buildChoices(ANSWER, [], 4, 0)).toEqual([ANSWER]);
    });
  });
});
