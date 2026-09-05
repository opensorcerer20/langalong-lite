/* TEMPORARY — delete with the .ts content it checks against, at step 9.

   src/data/ja.json is being converted from src/data/ja/*.ts one part at a time.
   This asserts the two produce the same pack, so a conversion step can be
   reviewed by reading a green test rather than by proof-reading Japanese.

   It is a migration check, not a contract. Keeping it past the switch-over
   would pin the content to a copy of itself — the exact thing this roadmap is
   removing. It goes when src/data/ja/ does.

   Not yet covered: scenarios. Steps 7 and 8 add them. */

import { describe, expect, it } from 'vitest';

import RAW from '../../src/data/ja.json';
/* `../../src/data/ja` now resolves to ja.json, not to ja/index.ts — the file
   shadows the directory. Explicit while both exist; the directory goes at
   step 9, and `languages.ts` then imports the JSON directly. */
import { JA } from '../../src/data/ja/index';
import { loadPack } from '../../src/data/loadPack';

const loaded = loadPack(RAW);

describe('ja.json reproduces the ja pack', () => {
  it('declares the same code, name, joiner and font stack', () => {
    expect(loaded.code).toBe(JA.code);
    expect(loaded.name).toBe(JA.name);
    expect(loaded.joiner).toBe(JA.joiner);
    expect(loaded.fontStack).toBe(JA.fontStack);
  });

  /* Order matters as much as membership: buildBank draws distractors from this
     pool by index, so a reordered pool is a different app. */
  it('reproduces the grammar pool, tile for tile and in order', () => {
    expect(loaded.grammar).toEqual(JA.grammar);
  });

  it('reproduces every particle', () => {
    expect(loaded.particles).toEqual(JA.particles);
  });

  it('reproduces every conjugation pattern', () => {
    expect(loaded.conjugations).toEqual(JA.conjugations);
  });

  /* The lexicon is the one thing with no counterpart in the .ts files — there,
     a reading was written at each occurrence. Every text the pack uses has to
     be in it, or loadPack would have thrown above. This checks the other
     direction: an entry nothing uses is dead weight in a file meant to stay
     hand-editable. Scenario vocabulary arrives in steps 7 and 8, so for now the
     pack's texts are exactly the grammar pool's. */
  it('carries no lexicon entry the pack does not use', () => {
    const used = new Set(loaded.grammar.map((tile) => tile[0]));
    const unused = Object.keys(RAW.lexicon).filter((text) => !used.has(text));

    expect(unused, `unused lexicon entries: ${unused.join(', ')}`).toEqual([]);
  });
});
