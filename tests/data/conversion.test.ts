/* TEMPORARY — delete with the .ts content it checks against, at step 9.

   src/data/ja.json is being converted from src/data/ja/*.ts one part at a time.
   This asserts the two produce the same pack, so a conversion step can be
   reviewed by reading a green test rather than by proof-reading Japanese.

   It is a migration check, not a contract. Keeping it past the switch-over
   would pin the content to a copy of itself — the exact thing this roadmap is
   removing. It goes when src/data/ja/ does.

   One field is deliberately *not* asserted equal: a situation's `words`. It is
   derived now — the content tiles of its own answers, plus listed extras — and
   the hand-written lists it replaces were not always complete. See the tests at
   the bottom for what is asserted instead.

   The whole pack is covered now — every field of every situation. */

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
     hand-editable. */
  it('carries no lexicon entry the pack does not use', () => {
    const used = new Set([
      ...loaded.grammar.map((tile) => tile[0]),
      ...loaded.scenarios.flatMap((scenario) => [
        ...scenario.words.map((tile) => tile[0]),
        ...scenario.items.flatMap((item) => item.ans.map((tile) => tile[0])),
      ]),
    ]);
    const unused = Object.keys(RAW.lexicon).filter((text) => !used.has(text));

    expect(unused, `unused lexicon entries: ${unused.join(', ')}`).toEqual([]);
  });
});

/* Every situation, paired with its counterpart in the .ts pack. */
const CONVERTED = [0, 1];

describe.each(CONVERTED)('ja.json reproduces situation %i', (index) => {
  const from = loaded.scenarios[index]!;
  const to = JA.scenarios[index]!;

  it('keeps its id, name, blurb and set number', () => {
    expect(from.id).toBe(to.id);
    expect(from.name).toBe(to.name);
    expect(from.blurb).toBe(to.blurb);
    /* Derived from position now; the .ts pack wrote it out. */
    expect(from.kicker).toBe(to.kicker);
  });

  it('reproduces every sentence exactly — prompt, tiles, alternates, note, tags', () => {
    expect(from.items).toEqual(to.items);
  });

  /* `words` is the one field allowed to differ, and it differs upward: the
     derived list is every content tile the situation's answers use, plus the
     extras. A hand-written list could omit a word its own sentences answered
     with — and did — leaving that tile unable to appear as a distractor
     anywhere else in the set. */
  it('keeps every word the hand-written list had', () => {
    const derived = from.words.map((tile) => tile[0]);
    const written = to.words.map((tile) => tile[0]);

    expect(derived).toEqual(expect.arrayContaining(written));
  });

  it('adds only words the situation’s own answers use', () => {
    const written = new Set(to.words.map((tile) => tile[0]));
    const inAnswers = new Set(from.items.flatMap((item) => item.ans.map((tile) => tile[0])));
    const added = from.words.map((tile) => tile[0]).filter((text) => !written.has(text));

    for (const text of added) {
      expect(inAnswers.has(text), `"${text}" is new but no answer uses it`).toBe(true);
    }
  });
});
