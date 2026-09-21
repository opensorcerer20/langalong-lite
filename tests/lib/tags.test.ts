/* Deriving a sentence's vocabulary.

   The rule is one line — "the answer tiles that are not in the grammar pool" —
   and the tests are about the edges that line has: repeats, a sentence made
   entirely of function words, and the pool being the thing that decides. */

import { describe, expect, it } from 'vitest';

import { LANGUAGE } from '../../src/data/languages';
import type { SentenceItem, Tile } from '../../src/data/types';
import { getVocabIn } from '../../src/lib/tags';

const GRAMMAR: readonly Tile[] = [
  ['は', 'wa'],
  ['を', 'o'],
  ['です', 'desu'],
];

const item = (ans: readonly Tile[]): SentenceItem => ({
  id: '01',
  en: 'A prompt.',
  ans,
  note: 'A note.',
  tags: { particles: [], conjugations: [] },
});

const texts = (tiles: readonly Tile[]) => tiles.map((tile) => tile[0]);

describe('getVocabIn', () => {
  it('keeps the content words and drops the grammar pool', () => {
    const sentence = item([
      ['パン', 'pan'],
      ['を', 'o'],
      ['ください', 'kudasai'],
    ]);
    expect(texts(getVocabIn(sentence, GRAMMAR))).toEqual(['パン', 'ください']);
  });

  it('keeps the answer’s order', () => {
    const sentence = item([
      ['ケーキ', 'keeki'],
      ['は', 'wa'],
      ['パン', 'pan'],
    ]);
    expect(texts(getVocabIn(sentence, GRAMMAR))).toEqual(['ケーキ', 'パン']);
  });

  /* One word used twice is one word, so a situation lists it as one distractor. */
  it('returns a repeated word once', () => {
    const sentence = item([
      ['パン', 'pan'],
      ['と', 'to'],
      ['パン', 'pan'],
    ]);
    expect(texts(getVocabIn(sentence, GRAMMAR))).toEqual(['パン', 'と']);
  });

  it('is empty when the sentence is all function words', () => {
    expect(
      getVocabIn(
        item([
          ['は', 'wa'],
          ['です', 'desu'],
        ]),
        GRAMMAR,
      ),
    ).toEqual([]);
  });

  /* The pool is the whole definition, so each pack decides what counts as
     vocabulary. */
  it('follows the pool it is given, not a fixed idea of a function word', () => {
    const sentence = item([
      ['パン', 'pan'],
      ['を', 'o'],
    ]);
    expect(texts(getVocabIn(sentence, []))).toEqual(['パン', 'を']);
  });

  it('carries the reading through, so the result is usable as tiles', () => {
    const [first] = getVocabIn(
      item([
        ['パン', 'pan'],
        ['を', 'o'],
      ]),
      GRAMMAR,
    );
    expect(first).toEqual(['パン', 'pan']);
  });

  describe('over the shipped content', () => {
    /* Every sentence contributes at least one distractor word. */
    it('finds vocabulary in every sentence of every situation', () => {
      for (const scenario of LANGUAGE.scenarios) {
        for (const sentence of scenario.items) {
          const vocab = getVocabIn(sentence, LANGUAGE.grammar);
          expect(
            vocab.length,
            `${scenario.name} · ${sentence.id} has no vocabulary`,
          ).toBeGreaterThan(0);
        }
      }
    });

    it('never returns a grammar-pool tile', () => {
      const pool = new Set(LANGUAGE.grammar.map((tile) => tile[0]));
      for (const scenario of LANGUAGE.scenarios) {
        for (const sentence of scenario.items) {
          for (const [text] of getVocabIn(sentence, LANGUAGE.grammar)) {
            expect(pool.has(text), `"${text}" is in the grammar pool`).toBe(false);
          }
        }
      }
    });
  });
});
