/* Content integrity, run over every pack the app ships.

   These do not test code so much as they test the content: they are the net
   that catches a typo in a new sentence before it reaches a learner as a drill
   that cannot be completed. Driving them off LANGUAGES rather than off one
   language means a pack added later inherits the whole net for free.

   Anything true only of Japanese belongs in ja.test.ts, not here. */

import { describe, expect, it } from 'vitest';

import { LANGUAGES } from '../../src/data/languages';
import { segmentLongestFirst } from '../../src/lib/segment';

describe('LANGUAGES', () => {
  it('ships at least one pack — the app has nothing to drill otherwise', () => {
    expect(LANGUAGES.length).toBeGreaterThan(0);
  });

  it('holds no duplicate code, since the code is the pack’s identity', () => {
    const codes = LANGUAGES.map((language) => language.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe.each(LANGUAGES)('$name', (language) => {
  it('declares a code, a name and a font stack', () => {
    expect(language.code.trim()).not.toBe('');
    expect(language.name.trim()).not.toBe('');
    expect(language.fontStack.trim()).not.toBe('');
  });

  it('has a grammar pool and at least one situation', () => {
    expect(language.grammar.length).toBeGreaterThan(0);
    expect(language.scenarios.length).toBeGreaterThan(0);
  });

  it('holds no duplicate in the grammar pool — a repeat wastes a distractor slot', () => {
    const texts = language.grammar.map((t) => t[0]);
    expect(new Set(texts).size).toBe(texts.length);
  });

  describe.each(language.scenarios)('$name', (scenario) => {
    it('has a non-empty blurb and its own vocabulary', () => {
      expect(scenario.blurb).not.toBe('');
      expect(scenario.words.length).toBeGreaterThan(0);
    });

    describe.each(scenario.items)('$en', (item) => {
      it('has an English prompt and at least two tiles', () => {
        expect(item.en).not.toBe('');
        expect(item.ans.length).toBeGreaterThanOrEqual(2);
      });

      it('has a grammar note — it is what the learner sees after a second miss', () => {
        expect(item.note.trim()).not.toBe('');
      });

      it('has a text and a reading on every tile', () => {
        for (const tile of item.ans) {
          expect(tile).toHaveLength(2);
          expect(tile[0].trim()).not.toBe('');
          expect(tile[1].trim()).not.toBe('');
        }
      });

      /* The one that matters most. An alternate the vocabulary cannot spell
         would be accepted by check() but impossible to build from the bank —
         the drill would look broken with no way to tell why. */
      it('can build every alternate from tiles in play', () => {
        const vocab = [...item.ans, ...language.grammar, ...scenario.words];
        for (const alt of item.alts ?? []) {
          const { tiles, rest } = segmentLongestFirst(alt, vocab, language.joiner);
          expect(rest, `"${alt}" left "${rest}" unsegmented`).toBe('');
          expect(tiles.map((t) => t[0]).join(language.joiner)).toBe(alt);
        }
      });

      it('does not list an alternate identical to the canonical answer', () => {
        const canonical = item.ans.map((t) => t[0]).join(language.joiner);
        expect(item.alts ?? []).not.toContain(canonical);
      });
    });
  });
});
