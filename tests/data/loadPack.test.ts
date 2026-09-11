/* The tile layer of the pack loader.

   Inline lexicons, not the shipped Japanese — these test the rules, and a
   fixture that grows with the content would fail for unrelated reasons.

   Error messages are asserted, not just the throw: a bad pack takes the app
   down at import, which only helps if the message names the sentence. */

import { describe, expect, it } from 'vitest';

import type { PackFile, ScenarioEntry } from '../../src/data/loadPack';
import type { Tile } from '../../src/data/types';
import { TILE_SEPARATOR, loadPack, tileFor, tileList, tilesFor } from '../../src/data/loadPack';

const LEXICON = {
  パン: 'pan',
  を: 'o',
  ください: 'kudasai',
  二つ: 'futatsu',
};

describe('TILE_SEPARATOR', () => {
  /* Authored into every answer, so changing it is a content migration. */
  it('is the pipe', () => {
    expect(TILE_SEPARATOR).toBe('|');
  });
});

describe('tileFor', () => {
  it('pairs a text with its reading', () => {
    expect(tileFor(LEXICON, 'パン', 'bakery 01')).toEqual(['パン', 'pan']);
  });

  it('throws naming the text and where it was used', () => {
    expect(() => tileFor(LEXICON, 'メロンパン', 'bakery 03')).toThrow(
      /bakery 03.*メロンパン.*not in the lexicon/,
    );
  });

  it('throws on a lexicon entry with a blank reading', () => {
    expect(() => tileFor({ パン: '   ' }, 'パン', 'bakery 01')).toThrow(/empty reading/);
  });
});

describe('tilesFor', () => {
  it('splits an authored answer into tiles, in order', () => {
    expect(tilesFor(LEXICON, 'パン|を|ください', 'bakery 01')).toEqual([
      ['パン', 'pan'],
      ['を', 'o'],
      ['ください', 'kudasai'],
    ]);
  });

  it('reads a single-tile answer', () => {
    expect(tilesFor(LEXICON, 'パン', 'bakery 01')).toEqual([['パン', 'pan']]);
  });

  /* A repeated tile is ordinary, so nothing dedups. */
  it('keeps a repeated tile at both positions', () => {
    expect(tilesFor(LEXICON, '二つ|を|二つ', 'bakery 02')).toHaveLength(3);
  });

  it('allows an answer spaced out for legibility', () => {
    expect(tilesFor(LEXICON, 'パン | を | ください', 'bakery 01')).toEqual(
      tilesFor(LEXICON, 'パン|を|ください', 'bakery 01'),
    );
  });

  /* Dropping it would load a different sentence than the one written. */
  it.each([
    ['a doubled separator', 'パン||を'],
    ['a trailing separator', 'パン|を|'],
    ['a leading separator', '|パン|を'],
  ])('throws on %s', (_case, ans) => {
    expect(() => tilesFor(LEXICON, ans, 'bakery 01')).toThrow(/empty tile between separators/);
  });

  it('names the sentence when one of its tiles is unknown', () => {
    expect(() => tilesFor(LEXICON, 'パン|が|ください', 'bakery 01')).toThrow(
      /bakery 01.*"が".*not in the lexicon/,
    );
  });
});

describe('tileList', () => {
  it('expands a list of texts in the order given', () => {
    expect(tileList(LEXICON, ['を', 'パン'], 'grammar pool')).toEqual([
      ['を', 'o'],
      ['パン', 'pan'],
    ]);
  });

  it('is empty for an empty list', () => {
    expect(tileList(LEXICON, [], 'grammar pool')).toEqual([]);
  });

  it('names the pool when one of its texts is unknown', () => {
    expect(() => tileList(LEXICON, ['は'], 'grammar pool')).toThrow(
      /grammar pool.*"は".*not in the lexicon/,
    );
  });
});

/* ── loadPack ─────────────────────────────────────────────────────────────── */

/** A minimal pack, for a test to vary one part of. */
function file(scenario: Partial<ScenarioEntry> = {}): PackFile {
  return {
    code: 'xx',
    name: 'Test',
    joiner: '',
    fontStack: 'serif',
    lexicon: { パン: 'pan', を: 'o', ください: 'kudasai', 二つ: 'futatsu', ケーキ: 'keeki' },
    grammar: ['を', 'ください'],
    particles: { o: { tile: 'を', gloss: 'direct object' } },
    conjugations: { tai: { name: 'want to', note: 'stem + たい' } },
    scenarios: [
      {
        id: 'bakery',
        name: 'Bakery',
        blurb: 'At the counter.',
        items: [{ id: '01', en: 'Bread, please.', ans: 'パン|を|ください' }],
        ...scenario,
      },
    ],
  };
}

const firstScenario = (pack: PackFile) => loadPack(pack).scenarios[0]!;
const texts = (tiles: readonly Tile[]) => tiles.map((tile) => tile[0]);

describe('loadPack — the pack itself', () => {
  it('carries the declared fields through unchanged', () => {
    const pack = loadPack(file());
    expect(pack.code).toBe('xx');
    expect(pack.name).toBe('Test');
    expect(pack.joiner).toBe('');
    expect(pack.fontStack).toBe('serif');
  });

  it('expands the grammar pool in the order authored', () => {
    expect(texts(loadPack(file()).grammar)).toEqual(['を', 'ください']);
  });

  it('folds a particle’s key in as its id, and expands its tile', () => {
    expect(loadPack(file()).particles).toEqual([
      { id: 'o', tile: ['を', 'o'], gloss: 'direct object' },
    ]);
  });

  it('folds a pattern’s key in as its id', () => {
    expect(loadPack(file()).conjugations).toEqual([
      { id: 'tai', name: 'want to', note: 'stem + たい' },
    ]);
  });

  /* teaches resolves an id by which registry holds it, so an id in both would
     land in whichever happened to be checked first. */
  it('refuses an id declared as both a particle and a pattern', () => {
    const clash = { ...file(), conjugations: { o: { name: 'clash', note: '…' } } };
    expect(() => loadPack(clash)).toThrow(/both a particle and a conjugation/);
  });
});

describe('loadPack — sentences', () => {
  it('expands the answer into tiles', () => {
    expect(firstScenario(file()).items[0]!.ans).toEqual([
      ['パン', 'pan'],
      ['を', 'o'],
      ['ください', 'kudasai'],
    ]);
  });

  /* An absent optional field must stay absent, not become undefined —
     exactOptionalPropertyTypes makes those different things. */
  it('leaves an unwritten note and alts absent rather than undefined', () => {
    const item = firstScenario(file()).items[0]!;
    expect('note' in item).toBe(false);
    expect('alts' in item).toBe(false);
  });

  it('carries a note and alts through when they are written', () => {
    const item = firstScenario(
      file({
        items: [
          {
            id: '01',
            en: 'Bread.',
            ans: 'パン|を',
            note: 'を marks it.',
            alts: ['パンをください'],
          },
        ],
      }),
    ).items[0]!;

    expect(item.note).toBe('を marks it.');
    expect(item.alts).toEqual(['パンをください']);
  });
});

describe('loadPack — teaches', () => {
  const taggedWith = (teaches: string[]) =>
    firstScenario(file({ items: [{ id: '01', en: 'Bread.', ans: 'パン|を', teaches }] })).items[0]!
      .tags;

  it('sorts each id into the registry that declares it', () => {
    expect(taggedWith(['o', 'tai'])).toEqual({ particles: ['o'], conjugations: ['tai'] });
  });

  it('is two empty lists when nothing is taught', () => {
    expect(taggedWith([])).toEqual({ particles: [], conjugations: [] });
  });

  it('defaults to empty when the field is not written at all', () => {
    expect(firstScenario(file()).items[0]!.tags).toEqual({ particles: [], conjugations: [] });
  });

  it('throws naming the sentence and the unknown id', () => {
    expect(() => taggedWith(['ni'])).toThrow(/bakery 01.*"ni".*declares nowhere/);
  });
});

describe('loadPack — derived words', () => {
  it('takes the content words out of the situation’s own answers', () => {
    /* パン only: を and ください are in the grammar pool, so they are already
       distractors for every situation. */
    expect(texts(firstScenario(file()).words)).toEqual(['パン']);
  });

  it('appends the extras a situation lists', () => {
    expect(texts(firstScenario(file({ words: ['ケーキ'] })).words)).toEqual(['パン', 'ケーキ']);
  });

  /* Otherwise a new sentence using ケーキ would turn an existing words entry
     into a duplicate — content growth breaking content already written. */
  it('drops an extra the answers already supply, rather than failing', () => {
    expect(texts(firstScenario(file({ words: ['パン'] })).words)).toEqual(['パン']);
  });

  it('drops an extra already in the grammar pool', () => {
    expect(texts(firstScenario(file({ words: ['ください'] })).words)).toEqual(['パン']);
  });

  it('keeps a word used by two sentences only once', () => {
    const twice = file({
      items: [
        { id: '01', en: 'Bread.', ans: 'パン|を' },
        { id: '02', en: 'Bread again.', ans: 'パン|ください' },
      ],
    });
    expect(texts(firstScenario(twice).words)).toEqual(['パン']);
  });

  it('names the situation when an extra is not in the lexicon', () => {
    expect(() => loadPack(file({ words: ['メロンパン'] }))).toThrow(
      /bakery words.*メロンパン.*not in the lexicon/,
    );
  });
});

describe('loadPack — kicker', () => {
  it('numbers situations from their position, zero-padded', () => {
    const many = file();
    const pack = loadPack({
      ...many,
      scenarios: [many.scenarios[0]!, { ...many.scenarios[0]!, id: 'station' }],
    });
    expect(pack.scenarios.map((scenario) => scenario.kicker)).toEqual(['Set 01', 'Set 02']);
  });
});
