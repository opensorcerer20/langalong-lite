/* Content integrity, run over every pack the app ships.

   These do not test code so much as they test the content: they are the net
   that catches a typo in a new sentence before it reaches a learner as a drill
   that cannot be completed. Driving them off LANGUAGES rather than off one
   language means a pack added later inherits the whole net for free.

   Anything true only of Japanese belongs in ja.test.ts, not here. */

import { describe, expect, it } from 'vitest';

import { TILE_MULTIPLIER } from '../../src/config';
import { LANGUAGES } from '../../src/data/languages';
import { buildBank } from '../../src/lib/buildBank';

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
    const ids = language.grammar.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  describe.each(language.scenarios)('$name', (scenario) => {
    it('has a non-empty blurb and its own vocabulary', () => {
      expect(scenario.blurb).not.toBe('');
      expect(scenario.words.length).toBeGreaterThan(0);
    });

    describe.each(scenario.items)('$promptText', (item) => {
      it('has a native-language prompt and at least two tiles', () => {
        expect(item.promptText).not.toBe('');
        expect(item.answer.length).toBeGreaterThanOrEqual(2);
      });

      it('has a grammar note — it is what the learner sees after a second miss', () => {
        expect(item.note.trim()).not.toBe('');
      });

      it('has a text and a reading on every tile', () => {
        for (const tile of item.answer) {
          expect(tile.newLanguageText.trim()).not.toBe('');
          expect(tile.reading.trim()).not.toBe('');
        }
      });

      /* The one that matters most. An accepted answer the bank cannot build
         would be judged correct by check() but impossible to assemble — the
         drill would look broken with no way to tell why. buildBank seeds an
         alternate's tiles precisely so this holds; the test is what proves it
         still does. */
      it('can build every alternate from the bank it is offered', () => {
        const bank = buildBank(
          item,
          0,
          { grammar: language.grammar, words: scenario.words },
          TILE_MULTIPLIER,
        );
        const available = new Set(bank.map((t) => t.id));
        for (const alternate of item.alternates) {
          expect(alternate.length, 'an alternate with no tiles is never buildable')
            .toBeGreaterThan(0);
          for (const tile of alternate) {
            expect(available, `${tile.id} is missing from the bank`).toContain(tile.id);
          }
        }
      });

      it('does not list an alternate identical to the canonical answer', () => {
        const sentence = (tiles: readonly { newLanguageText: string }[]) =>
          tiles.map((t) => t.newLanguageText).join(language.joiner);
        const canonical = sentence(item.answer);
        expect(item.alternates.map(sentence)).not.toContain(canonical);
      });
    });
  });
});
