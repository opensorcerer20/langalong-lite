/* Content integrity, run over every pack the app ships.

   These do not test code so much as they test the content: they are the net
   that catches a typo in a new sentence before it reaches a learner as a drill
   that cannot be completed. Driving them off LANGUAGES rather than off one
   language means a pack added later inherits the whole net for free.

   Anything true only of Japanese belongs in en2ja.test.ts, not here. */

import {
  describe,
  expect,
  it,
} from 'vitest';

import { TILE_MULTIPLIER } from '../../src/config';
import type {
  DrillPack,
  Tile,
} from '../../src/data/drill';
import { LANGUAGES } from '../../src/data/languages';
import { buildBank } from '../../src/lib/buildBank';

/**
 * Every tile a pack can put in front of a learner, from all four places one
 * can reach the drill:
 *
 *   pack.grammar[]                       shared distractor pool
 *   scenario.words[]                     per-situation distractors
 *   item.answer[]                        canonical answers
 *   item.alternates[][]                  accepted alternates
 */
function everyTile(language: DrillPack): Tile[] {
  return [
    ...language.grammar,
    ...language.scenarios.flatMap((scenario) => [
      ...scenario.words,
      ...scenario.items.flatMap((item) => [...item.answer, ...item.alternates.flat()]),
    ]),
  ];
}

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

  /* The three checks below are the tile registry's own integrity, seen from
     the resolved side. They matter because a tile's id is what buildBank
     deduplicates on and what revealPlacement matches on — so an id that does
     not say what the tile is, or two tiles that look alike but are not, break
     the drill in ways no other test would notice. */

  it('gives every tile an id that matches its own type and text', () => {
    for (const tile of everyTile(language)) {
      expect(tile.id, `${tile.newLanguageText} carries an id that is not its own`).toBe(
        `${tile.type}:${tile.newLanguageText}`,
      );
    }
  });

  /* The lint the content architecture doc recommends. Two tiles reading alike
     but typed differently would be two ids, so the bank could hold both and
     show the learner what looks like the same tile twice — and "Show me the
     answer" would then have to pick between them by id, invisibly. */
  it('never gives one piece of text two different types', () => {
    const typesByText = new Map<string, Set<string>>();
    for (const tile of everyTile(language)) {
      const seen = typesByText.get(tile.newLanguageText) ?? new Set<string>();
      seen.add(tile.type);
      typesByText.set(tile.newLanguageText, seen);
    }
    for (const [text, types] of typesByText) {
      expect([...types], `"${text}" is typed ${[...types].join(' and ')}`).toHaveLength(1);
    }
  });

  it('never gives one piece of text two different readings', () => {
    const readingsByText = new Map<string, Set<string>>();
    for (const tile of everyTile(language)) {
      const seen = readingsByText.get(tile.newLanguageText) ?? new Set<string>();
      seen.add(tile.reading);
      readingsByText.set(tile.newLanguageText, seen);
    }
    for (const [text, readings] of readingsByText) {
      expect([...readings], `"${text}" reads as ${[...readings].join(' and ')}`).toHaveLength(1);
    }
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
