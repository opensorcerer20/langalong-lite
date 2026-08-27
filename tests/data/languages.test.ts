/* Content integrity, run over every pack the app ships.

   These do not test code so much as they test the content: they are the net
   that catches a typo in a new sentence before it reaches a learner as a drill
   that cannot be completed. Driving them off LANGUAGES rather than off one
   language means a pack added later inherits the whole net for free.

   One test per invariant, looping over the content — not one test per sentence.
   A pack is a few hundred sentences eventually, and a describe.each over the
   items would report that as a few hundred tests all making the same check.
   What a failure has to tell you is which sentence broke, and that is what the
   assertion message carries; see `where` below.

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
  /* Every sentence in the pack, each paired with the situation it came from and
     a label naming both — the id and the prompt, so the label still identifies
     the sentence when the failure is that one of those two is missing. */
  const everySentence = language.scenarios.flatMap((scenario) =>
    scenario.items.map((item) => ({
      scenario,
      item,
      where: `${scenario.name} · ${item.id} "${item.en}"`,
    })),
  );

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

  /* Progress is stored against a composed key, and parseKey splits it on the
     separator. An id containing one would read back as a different scenario. */
  it('gives every situation an id, unique within the pack and free of ":"', () => {
    const ids = language.scenarios.map((s) => s.id);
    for (const scenario of language.scenarios) {
      expect(scenario.id.trim(), `"${scenario.name}" has no id`).not.toBe('');
      expect(scenario.id, `"${scenario.name}" — ":" is the storage key separator`).not.toContain(
        ':',
      );
    }
    expect(new Set(ids).size, 'two situations share an id').toBe(ids.length);
  });

  it('gives every situation a blurb and its own vocabulary', () => {
    for (const scenario of language.scenarios) {
      expect(scenario.blurb, `"${scenario.name}" has no blurb`).not.toBe('');
      expect(scenario.words.length, `"${scenario.name}" has no vocabulary`).toBeGreaterThan(0);
    }
  });

  it('gives every sentence an id, unique within its situation and free of ":"', () => {
    for (const scenario of language.scenarios) {
      const ids = scenario.items.map((item) => item.id);
      for (const item of scenario.items) {
        const where = `${scenario.name} "${item.en}"`;
        expect(item.id.trim(), `${where} has no id`).not.toBe('');
        expect(item.id, `${where} — ":" is the storage key separator`).not.toContain(':');
      }
      expect(new Set(ids).size, `"${scenario.name}" repeats a sentence id`).toBe(ids.length);
    }
  });

  /* The invariant the tile-level history depends on. Two tiles sharing text but
     spelling the reading differently would collapse into one row, and the
     learner's record for パン would silently be a record of two things. */
  it('reads a given tile text exactly one way, everywhere it appears', () => {
    const readings = new Map<string, string>();
    const everyTile = [
      ...language.grammar,
      ...language.scenarios.flatMap((s) => [...s.words, ...s.items.flatMap((i) => i.ans)]),
    ];

    for (const [text, reading] of everyTile) {
      const seen = readings.get(text);
      if (seen === undefined) readings.set(text, reading);
      else expect(reading, `"${text}" is read both "${seen}" and "${reading}"`).toBe(seen);
    }
  });

  it('gives every sentence an English prompt and at least two tiles', () => {
    for (const { item, where } of everySentence) {
      expect(item.en, `${where} has no prompt`).not.toBe('');
      expect(item.ans.length, `${where} is a single tile`).toBeGreaterThanOrEqual(2);
    }
  });

  it('gives every sentence a grammar note — it is what a second miss shows', () => {
    for (const { item, where } of everySentence) {
      expect(item.note.trim(), `${where} has no note`).not.toBe('');
    }
  });

  it('has a text and a reading on every answer tile', () => {
    for (const { item, where } of everySentence) {
      for (const tile of item.ans) {
        expect(tile, `${where} has a malformed tile`).toHaveLength(2);
        expect(tile[0].trim(), `${where} has a tile with no text`).not.toBe('');
        expect(tile[1].trim(), `${where} — "${tile[0]}" has no reading`).not.toBe('');
      }
    }
  });

  /* The one that matters most. An alternate the vocabulary cannot spell would be
     accepted by check() but impossible to build from the bank — the drill would
     look broken with no way to tell why. */
  it('can build every alternate from tiles in play', () => {
    for (const { scenario, item, where } of everySentence) {
      const vocab = [...item.ans, ...language.grammar, ...scenario.words];
      for (const alt of item.alts ?? []) {
        const { tiles, rest } = segmentLongestFirst(alt, vocab, language.joiner);
        expect(rest, `${where} — "${alt}" left "${rest}" unsegmented`).toBe('');
        expect(tiles.map((t) => t[0]).join(language.joiner), `${where} — "${alt}"`).toBe(alt);
      }
    }
  });

  it('lists no alternate identical to the canonical answer', () => {
    for (const { item, where } of everySentence) {
      const canonical = item.ans.map((t) => t[0]).join(language.joiner);
      expect(item.alts ?? [], `${where} repeats its canonical answer as an alternate`).not.toContain(
        canonical,
      );
    }
  });
});
