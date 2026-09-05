/* The tile layer of the pack loader.

   Inline lexicons, not the shipped Japanese — these test the rules, and a
   fixture that grows with the content would fail for unrelated reasons.

   Error messages are asserted, not just the throw: a bad pack takes the app
   down at import, which only helps if the message names the sentence. */

import { describe, expect, it } from 'vitest';

import { TILE_SEPARATOR, tileFor, tileList, tilesFor } from '../../src/data/loadPack';

const LEXICON = {
  パン: 'pan',
  を: 'o',
  ください: 'kudasai',
  二つ: 'futatsu',
};

describe('TILE_SEPARATOR', () => {
  /* Authored into every answer, so changing it is a content migration. */
  it('is the pipe', () => {
    expect(TILE_SEPARATOR).toBe('|');
  });
});

describe('tileFor', () => {
  it('pairs a text with its reading', () => {
    expect(tileFor(LEXICON, 'パン', 'bakery 01')).toEqual(['パン', 'pan']);
  });

  it('throws naming the text and where it was used', () => {
    expect(() => tileFor(LEXICON, 'メロンパン', 'bakery 03')).toThrow(
      /bakery 03.*メロンパン.*not in the lexicon/,
    );
  });

  it('throws on a lexicon entry with a blank reading', () => {
    expect(() => tileFor({ パン: '   ' }, 'パン', 'bakery 01')).toThrow(/empty reading/);
  });
});

describe('tilesFor', () => {
  it('splits an authored answer into tiles, in order', () => {
    expect(tilesFor(LEXICON, 'パン|を|ください', 'bakery 01')).toEqual([
      ['パン', 'pan'],
      ['を', 'o'],
      ['ください', 'kudasai'],
    ]);
  });

  it('reads a single-tile answer', () => {
    expect(tilesFor(LEXICON, 'パン', 'bakery 01')).toEqual([['パン', 'pan']]);
  });

  /* A repeated tile is ordinary, so nothing dedups. */
  it('keeps a repeated tile at both positions', () => {
    expect(tilesFor(LEXICON, '二つ|を|二つ', 'bakery 02')).toHaveLength(3);
  });

  it('allows an answer spaced out for legibility', () => {
    expect(tilesFor(LEXICON, 'パン | を | ください', 'bakery 01')).toEqual(
      tilesFor(LEXICON, 'パン|を|ください', 'bakery 01'),
    );
  });

  /* Dropping it would load a different sentence than the one written. */
  it.each([
    ['a doubled separator', 'パン||を'],
    ['a trailing separator', 'パン|を|'],
    ['a leading separator', '|パン|を'],
  ])('throws on %s', (_case, ans) => {
    expect(() => tilesFor(LEXICON, ans, 'bakery 01')).toThrow(/empty tile between separators/);
  });

  it('names the sentence when one of its tiles is unknown', () => {
    expect(() => tilesFor(LEXICON, 'パン|が|ください', 'bakery 01')).toThrow(
      /bakery 01.*"が".*not in the lexicon/,
    );
  });
});

describe('tileList', () => {
  it('expands a list of texts in the order given', () => {
    expect(tileList(LEXICON, ['を', 'パン'], 'grammar pool')).toEqual([
      ['を', 'o'],
      ['パン', 'pan'],
    ]);
  });

  it('is empty for an empty list', () => {
    expect(tileList(LEXICON, [], 'grammar pool')).toEqual([]);
  });

  it('names the pool when one of its texts is unknown', () => {
    expect(() => tileList(LEXICON, ['は'], 'grammar pool')).toThrow(
      /grammar pool.*"は".*not in the lexicon/,
    );
  });
});
