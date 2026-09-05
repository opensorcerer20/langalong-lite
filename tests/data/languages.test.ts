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

  describe('particles and conjugation patterns', () => {
    const particleIds = new Set(language.particles.map((p) => p.id));
    const patternIds = new Set(language.conjugations.map((c) => c.id));

    /* Same rule as a scenario or sentence id, for the same reason: these are
       storage key segments, so a change orphans everything recorded under the
       old one and a ":" would read back as a different key entirely. */
    it('gives every particle and pattern an id, unique and free of ":"', () => {
      for (const particle of language.particles) {
        expect(particle.id.trim(), `a particle has no id`).not.toBe('');
        expect(particle.id, `particle "${particle.id}" — ":" is the key separator`).not.toContain(':');
        expect(particle.gloss.trim(), `particle "${particle.id}" has no gloss`).not.toBe('');
      }
      expect(particleIds.size, 'two particles share an id').toBe(language.particles.length);

      for (const pattern of language.conjugations) {
        expect(pattern.id.trim(), 'a conjugation pattern has no id').not.toBe('');
        expect(pattern.id, `pattern "${pattern.id}" — ":" is the key separator`).not.toContain(':');
        expect(pattern.name.trim(), `pattern "${pattern.id}" has no name`).not.toBe('');
        expect(pattern.note.trim(), `pattern "${pattern.id}" has no note`).not.toBe('');
      }
      expect(patternIds.size, 'two patterns share an id').toBe(language.conjugations.length);
    });

    /* The two lists overlap by design and must not drift. The grammar pool is
       what the sentence drill draws distractors from, so particles.ts
       re-declares its tiles rather than the pool being derived from it — which
       is exactly the arrangement that lets them fall out of step, hence this. */
    it('declares every particle with the same tile the grammar pool holds', () => {
      const pool = new Map(language.grammar.map((tile) => [tile[0], tile[1]]));

      for (const { id, tile } of language.particles) {
        const [text, reading] = tile;
        expect(pool.has(text), `particle "${id}" (${text}) is not in the grammar pool`).toBe(true);
        expect(pool.get(text), `particle "${id}" (${text}) is read two ways`).toBe(reading);
      }
    });

    /* Two tests over `confusedWith` stood here — that every id resolved to a
       declared particle, and that the relation was symmetrical. The field is
       gone: nothing but these read it, it was authored for a particle exercise
       that does not exist, and symmetry meant adding one particle obliged you
       to edit others. Reinstate both alongside whatever the drill declares. */
  });

  /* Tags are what a later exercise selects on and what remediation reports
     against, so a tag naming something that does not exist is a drill that
     silently has nothing in it. */
  it('tags every sentence with particles and patterns the pack declares', () => {
    const particleIds = new Set(language.particles.map((p) => p.id));
    const patternIds = new Set(language.conjugations.map((c) => c.id));

    for (const { item, where } of everySentence) {
      for (const id of item.tags.particles) {
        expect(particleIds.has(id), `${where} is tagged with unknown particle "${id}"`).toBe(true);
      }
      for (const id of item.tags.conjugations) {
        expect(patternIds.has(id), `${where} is tagged with unknown pattern "${id}"`).toBe(true);
      }
      expect(new Set(item.tags.particles).size, `${where} repeats a particle tag`).toBe(
        item.tags.particles.length,
      );
      expect(new Set(item.tags.conjugations).size, `${where} repeats a pattern tag`).toBe(
        item.tags.conjugations.length,
      );
    }
  });

  /* A tagged particle the sentence does not contain would be a claim about
     grammar the learner never sees — and, once it is recorded, a row saying
     they got に right in a sentence with no に in it. The reverse is fine and
     expected: every sentence contains です and almost none are about it.

     An accepted alternate counts. Station 08 is tagged へ and answers with に,
     because the pair is the whole point of the sentence and either is correct;
     the bank seeds へ from the alternate, so the learner really can be shown
     it. Alternates are plain strings with no tile structure, so this is a
     substring test rather than a tile lookup — loose enough to admit a false
     positive, which is the right way round for a check whose job is to catch a
     tag naming grammar that is simply not there. */
  it('tags a sentence only with particles it actually puts in front of the learner', () => {
    const textOf = new Map(language.particles.map((p) => [p.id, p.tile[0]]));

    for (const { item, where } of everySentence) {
      const answer = new Set(item.ans.map((tile) => tile[0]));

      for (const id of item.tags.particles) {
        const text = textOf.get(id) ?? '';
        const inAlternate = (item.alts ?? []).some((alt) => alt.includes(text));
        expect(
          answer.has(text) || inAlternate,
          `${where} is tagged "${id}" but neither its answer nor its alternates use ${text}`,
        ).toBe(true);
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
