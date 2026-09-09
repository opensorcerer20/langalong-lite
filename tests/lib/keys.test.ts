/* Key composition and the round trip back.

   These matter more than their size suggests: a key is the only link between a
   sentence in the content and everything ever recorded about it, so a change
   that alters the format silently orphans a learner's history. */

import { describe, expect, it } from 'vitest';

import type { Tile } from '../../src/data/types';
import { conjugationKey, itemKey, parseKey, particleKey, tileKey } from '../../src/lib/keys';

const PAN: Tile = ['パン', 'pan'];

describe('itemKey', () => {
  it('qualifies a local id with the pack code and the unit', () => {
    expect(itemKey('ja', 'bakery', '01')).toBe('ja:item:bakery:01');
  });

  it('keeps two packs apart for the same situation and sentence', () => {
    expect(itemKey('ja', 'bakery', '01')).not.toBe(itemKey('es', 'bakery', '01'));
  });
});

describe('tileKey', () => {
  it('keys on the tile text', () => {
    expect(tileKey('ja', PAN)).toBe('ja:tile:パン');
  });

  it('ignores the reading — one text is one row, however it is transliterated', () => {
    expect(tileKey('ja', ['パン', 'pan'])).toBe(tileKey('ja', ['パン', 'PAN']));
  });
});

describe('particleKey and conjugationKey', () => {
  it('key on the declared id, not on the text', () => {
    expect(particleKey('ja', 'wo')).toBe('ja:particle:wo');
    expect(conjugationKey('ja', 'te-form')).toBe('ja:conjugation:te-form');
  });

  /* The reason a particle is not stored as a tile. Knowing the word を and
     knowing when を is the right particle are different things, and a drill
     built to teach the second must not be scored against the first. */
  it('keeps a particle apart from the same particle as vocabulary', () => {
    expect(particleKey('ja', 'o')).not.toBe(tileKey('ja', ['を', 'o']));
  });
});

describe('parseKey', () => {
  it('reads an item key back into its parts', () => {
    expect(parseKey('ja:item:bakery:01')).toEqual({
      unit: 'item',
      languageCode: 'ja',
      scenarioId: 'bakery',
      itemId: '01',
    });
  });

  it('reads a tile key back into its parts', () => {
    expect(parseKey('ja:tile:パン')).toEqual({
      unit: 'tile',
      languageCode: 'ja',
      text: 'パン',
    });
  });

  it('reads a particle key back into its parts', () => {
    expect(parseKey('ja:particle:wo')).toEqual({
      unit: 'particle',
      languageCode: 'ja',
      particleId: 'wo',
    });
  });

  it('reads a conjugation key back into its parts', () => {
    expect(parseKey('ja:conjugation:te-form')).toEqual({
      unit: 'conjugation',
      languageCode: 'ja',
      patternId: 'te-form',
    });
  });

  it('round-trips every key the composers produce', () => {
    expect(parseKey(itemKey('ja', 'station', '08'))).toMatchObject({ scenarioId: 'station', itemId: '08' });
    expect(parseKey(tileKey('ja', PAN))).toMatchObject({ text: 'パン' });
    expect(parseKey(particleKey('ja', 'ni'))).toMatchObject({ particleId: 'ni' });
    expect(parseKey(conjugationKey('ja', 'tai'))).toMatchObject({ patternId: 'tai' });
  });

  /* The reason the unit sits in segment two rather than being inferred from how
     many segments there are. */
  it('does not mistake a situation called "tile" for vocabulary', () => {
    expect(parseKey(itemKey('ja', 'tile', '01'))).toMatchObject({ unit: 'item', scenarioId: 'tile' });
  });

  it('keeps a separator inside tile text, which is always the last field', () => {
    expect(parseKey('es:tile:a:b')).toEqual({ unit: 'tile', languageCode: 'es', text: 'a:b' });
  });

  /* Undefined rather than a throw: these arrive from a database that may hold
     rows written by an older version, where an unknown key is one to skip. */
  it('returns undefined for anything that is not a key', () => {
    for (const bad of [
      '',
      'ja',
      'ja:item',
      'ja:item:bakery',
      'ja:item:bakery:01:extra',
      'ja:tile:',
      'ja:streak:x',
      /* Unlike a tile, these take exactly one further segment: their ids are
         authored and the content tests reject one holding a separator. */
      'ja:particle:',
      'ja:particle:wo:extra',
      'ja:conjugation:',
      'ja:conjugation:te-form:extra',
    ]) {
      expect(parseKey(bad), `"${bad}" should not parse`).toBeUndefined();
    }
  });
});
