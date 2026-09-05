import { describe, expect, it } from 'vitest';

import type { Tile } from '../../src/data/types';
import { segmentLongestFirst } from '../../src/lib/segment';

const VOCAB: readonly Tile[] = [
  ['パン', 'pan'],
  ['を', 'o'],
  ['ください', 'kudasai'],
  ['お', 'o'],
  ['願いします', 'negaishimasu'],
  ['お願いします', 'onegaishimasu'],
];

const texts = (tiles: readonly Tile[]) => tiles.map((t) => t[0]);

/* The fixture is Japanese, which is written without spaces. */
const JOINER = '';

describe('segmentLongestFirst', () => {
  it('splits a sentence into its tiles in order', () => {
    const { tiles, rest } = segmentLongestFirst('パンをください', VOCAB, JOINER);
    expect(texts(tiles)).toEqual(['パン', 'を', 'ください']);
    expect(rest).toBe('');
  });

  /* The reason the match is longest-first: お and 願いします are both in the
     vocabulary, so a first-match scan would split お願いします in two. */
  it('prefers the longest tile when a shorter one also matches', () => {
    const { tiles } = segmentLongestFirst('パンをお願いします', VOCAB, JOINER);
    expect(texts(tiles)).toEqual(['パン', 'を', 'お願いします']);
  });

  it('reports the remainder instead of throwing when nothing matches', () => {
    const { tiles, rest } = segmentLongestFirst('パンをZZZ', VOCAB, JOINER);
    expect(texts(tiles)).toEqual(['パン', 'を']);
    expect(rest).toBe('ZZZ');
  });

  it('returns the whole text as the remainder when the first tile fails', () => {
    expect(segmentLongestFirst('ZZZ', VOCAB, JOINER)).toEqual({ tiles: [], rest: 'ZZZ' });
  });

  it('keeps repeats — deduping is the caller’s job', () => {
    const { tiles } = segmentLongestFirst('パンパン', VOCAB, JOINER);
    expect(texts(tiles)).toEqual(['パン', 'パン']);
  });

  it('handles empty input and empty vocabulary', () => {
    expect(segmentLongestFirst('', VOCAB, JOINER)).toEqual({ tiles: [], rest: '' });
    expect(segmentLongestFirst('パン', [], JOINER)).toEqual({ tiles: [], rest: 'パン' });
  });
});

/* No shipped language is space-separated yet, so this block is the only cover
   the non-empty joiner path has. */
describe('segmentLongestFirst with a space-separated language', () => {
  const SPACED: readonly Tile[] = [
    ['un', 'un'],
    ['una', 'una'],
    ['pan', 'pan'],
    ['por favor', 'por favor'],
  ];

  it('steps over the separator between tiles', () => {
    const { tiles, rest } = segmentLongestFirst('un pan por favor', SPACED, ' ');
    expect(texts(tiles)).toEqual(['un', 'pan', 'por favor']);
    expect(rest).toBe('');
  });

  /* Longest-first matters just as much here: "un" prefixes "una", so a
     first-match scan would take "un" and choke on the leftover "a". */
  it('still prefers the longest tile when a shorter one also matches', () => {
    const { tiles, rest } = segmentLongestFirst('una pan', SPACED, ' ');
    expect(texts(tiles)).toEqual(['una', 'pan']);
    expect(rest).toBe('');
  });

  it('reports the remainder with its leading separator consumed', () => {
    const { tiles, rest } = segmentLongestFirst('un zzz', SPACED, ' ');
    expect(texts(tiles)).toEqual(['un']);
    expect(rest).toBe('zzz');
  });
});
