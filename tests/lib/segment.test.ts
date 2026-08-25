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

const kana = (tiles: readonly Tile[]) => tiles.map((t) => t[0]);

describe('segmentLongestFirst', () => {
  it('splits a sentence into its tiles in order', () => {
    const { tiles, rest } = segmentLongestFirst('パンをください', VOCAB);
    expect(kana(tiles)).toEqual(['パン', 'を', 'ください']);
    expect(rest).toBe('');
  });

  /* The reason the match is longest-first: お and 願いします are both in the
     vocabulary, so a first-match scan would split お願いします in two. */
  it('prefers the longest tile when a shorter one also matches', () => {
    const { tiles } = segmentLongestFirst('パンをお願いします', VOCAB);
    expect(kana(tiles)).toEqual(['パン', 'を', 'お願いします']);
  });

  it('reports the remainder instead of throwing when nothing matches', () => {
    const { tiles, rest } = segmentLongestFirst('パンをZZZ', VOCAB);
    expect(kana(tiles)).toEqual(['パン', 'を']);
    expect(rest).toBe('ZZZ');
  });

  it('returns the whole text as the remainder when the first tile fails', () => {
    expect(segmentLongestFirst('ZZZ', VOCAB)).toEqual({ tiles: [], rest: 'ZZZ' });
  });

  it('keeps repeats — deduping is the caller’s job', () => {
    const { tiles } = segmentLongestFirst('パンパン', VOCAB);
    expect(kana(tiles)).toEqual(['パン', 'パン']);
  });

  it('handles empty input and empty vocabulary', () => {
    expect(segmentLongestFirst('', VOCAB)).toEqual({ tiles: [], rest: '' });
    expect(segmentLongestFirst('パン', [])).toEqual({ tiles: [], rest: 'パン' });
  });
});
