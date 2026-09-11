/* Working out which characters the font subset has to carry.

   Inline fixtures — this asserts how the character set is derived, and content
   is free to change without failing it. */

import { describe, expect, it } from 'vitest';

import { compareSubsets, japaneseCharacters, woff2UrlIn } from '../../scripts/fontSubset';
import type { PackFile } from '../../src/data/loadPack';

const PACK: PackFile = {
  code: 'xx',
  name: 'Test',
  joiner: '',
  fontStack: 'serif',
  lexicon: { パン: 'pan', を: 'o' },
  grammar: ['を'],
  particles: { o: { tile: 'を', gloss: 'the direct object — softer than に' } },
  conjugations: { tai: { name: 'want to', note: 'verb stem + たい' } },
  scenarios: [
    {
      id: 'bakery',
      name: 'Bakery',
      blurb: 'At the counter.',
      words: ['袋'],
      items: [
        {
          id: '01',
          en: 'Bread, please.',
          ans: 'パン|を',
          alts: ['パンをください'],
          note: '「を」marks it.',
        },
      ],
    },
  ],
};

describe('japaneseCharacters', () => {
  const characters = japaneseCharacters(PACK);

  it('collects the tiles a learner has to read', () => {
    for (const character of ['パ', 'ン', 'を', '袋']) {
      expect(characters).toContain(character);
    }
  });

  /* Notes and glosses put Japanese on screen exactly as an answer does. */
  it('collects Japanese out of notes, glosses and alternates', () => {
    expect(characters).toContain('に'); // only in a particle gloss
    expect(characters).toContain('た'); // only in a conjugation note
    expect(characters).toContain('く'); // only in an alternate
  });

  it('collects CJK punctuation, which needs a glyph like anything else', () => {
    expect(characters).toContain('「');
  });

  it('leaves the latin alone, since another face renders it', () => {
    for (const character of ['B', 'a', 'p', '.', ' ']) {
      expect(characters).not.toContain(character);
    }
  });

  it('holds each character once, in code-point order', () => {
    expect(new Set(characters).size).toBe(characters.length);
    expect([...characters].sort((a, b) => a.codePointAt(0)! - b.codePointAt(0)!)).toEqual(
      characters,
    );
  });

  it('finds nothing in a pack with no Japanese in it', () => {
    const latin: PackFile = {
      ...PACK,
      lexicon: {},
      grammar: [],
      particles: {},
      conjugations: {},
      scenarios: [],
    };
    expect(japaneseCharacters(latin)).toEqual([]);
  });
});

describe('woff2UrlIn', () => {
  /* The real shape of a cut subset: a query string, and no file extension. */
  const KIT = 'https://fonts.gstatic.com/l/font?kit=-F62fjtqLzI2&skey=72472b0eb&v=v56';
  const css = `@font-face {\n  font-family: 'Noto Sans JP';\n  src: url(${KIT}) format('woff2');\n}`;

  it('finds the file even though its url has no extension', () => {
    expect(woff2UrlIn(css)).toBe(KIT);
  });

  /* What actually comes back without a browser User-Agent: nine static faces,
     none of them woff2. Vendoring a TrueType here would be a silent downgrade. */
  it('refuses a stylesheet of static truetype faces', () => {
    const truetype = css.replace("format('woff2')", "format('truetype')").repeat(9);
    expect(() => woff2UrlIn(truetype)).toThrow(/User-Agent/);
  });

  it('refuses a stylesheet with no font in it at all', () => {
    expect(() => woff2UrlIn('/* nothing here */')).toThrow(/no woff2/);
  });

  it('refuses to choose when several faces are offered', () => {
    expect(() => woff2UrlIn(css + css)).toThrow(/2 woff2 faces/);
  });
});

describe('compareSubsets', () => {
  it('reports what the pack gained and what it no longer needs', () => {
    expect(compareSubsets(['あ', 'い'], ['い', 'う'])).toEqual({ added: ['う'], removed: ['あ'] });
  });

  it('reports nothing either way when the subset is unchanged', () => {
    expect(compareSubsets(['あ'], ['あ'])).toEqual({ added: [], removed: [] });
  });

  it('treats a missing previous subset as everything being new', () => {
    expect(compareSubsets([], ['あ'])).toEqual({ added: ['あ'], removed: [] });
  });
});
