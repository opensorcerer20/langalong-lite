/* Merging an import file into a pack.

   Inline fixtures, never the shipped pack — a merge test that failed because
   someone added a sentence would be the exact thing the rest of the suite has
   been getting away from. */

import {
  describe,
  expect,
  it,
} from 'vitest';

import type { ImportFile } from '../../scripts/mergeImport';
import { mergeImport } from '../../scripts/mergeImport';
import type { PackFile } from '../../src/data/loadPack';

const PACK: PackFile = {
  code: 'xx',
  name: 'Test',
  joiner: '',
  fontStack: 'serif',
  lexicon: { パン: 'pan', を: 'o', ください: 'kudasai' },
  grammar: ['を', 'ください'],
  particles: { o: { tile: 'を', gloss: 'direct object' } },
  conjugations: { tai: { name: 'want to', note: 'stem + たい' } },
  scenarios: [
    {
      id: 'bakery',
      name: 'Bakery',
      blurb: 'At the counter.',
      words: ['パン'],
      items: [{ id: '01', en: 'Bread, please.', ans: 'パン|を|ください' }],
    },
  ],
};

const NEW_SITUATION: ImportFile = {
  lexicon: { ケーキ: 'keeki' },
  scenario: {
    id: 'cafe',
    name: 'Café',
    blurb: 'Ordering.',
    items: [{ id: '01', en: 'Cake, please.', ans: 'ケーキ|を|ください' }],
  },
};

const MORE_EXERCISES: ImportFile = {
  lexicon: { ケーキ: 'keeki' },
  into: 'bakery',
  items: [{ id: '02', en: 'Cake, please.', ans: 'ケーキ|を|ください' }],
};

describe('mergeImport — a situation the pack does not have', () => {
  it('appends it after the situations already there', () => {
    const { pack, created } = mergeImport(PACK, NEW_SITUATION);
    expect(pack.scenarios.map((s) => s.id)).toEqual(['bakery', 'cafe']);
    expect(created).toBe(true);
  });

  it('folds the import’s readings into the lexicon', () => {
    expect(mergeImport(PACK, NEW_SITUATION).pack.lexicon).toEqual({
      パン: 'pan',
      を: 'o',
      ください: 'kudasai',
      ケーキ: 'keeki',
    });
  });

  it('leaves the rest of the pack alone', () => {
    const { pack } = mergeImport(PACK, NEW_SITUATION);
    expect(pack.grammar).toBe(PACK.grammar);
    expect(pack.particles).toBe(PACK.particles);
    expect(pack.code).toBe('xx');
  });

  /* A failed import must leave nothing half-applied, and the caller keeps the
     original to diff against. */
  it('does not mutate the pack it was given', () => {
    const before = structuredClone(PACK);
    mergeImport(PACK, NEW_SITUATION);
    expect(PACK).toEqual(before);
  });
});

/* The re-run case: an import file is kept as the record of what was imported,
   so appending a sentence to it and running it again has to be safe. */
describe('mergeImport — a situation the pack already has', () => {
  const again: ImportFile = {
    lexicon: {},
    scenario: {
      id: 'bakery',
      name: 'RENAMED',
      blurb: 'REWRITTEN',
      words: ['パン', 'ケーキ'],
      items: [
        { id: '01', en: 'EDITED PROMPT', ans: 'パン|を' },
        { id: '02', en: 'Cake, please.', ans: 'パン|ください' },
      ],
    },
  };

  it('keeps the situation name and blurb', () => {
    const situation = mergeImport(PACK, again).pack.scenarios[0]!;
    expect(situation.name).toBe('Bakery');
    expect(situation.blurb).toBe('At the counter.');
  });

  it('adds the sentences it does not already have', () => {
    const result = mergeImport(PACK, again);
    expect(result.created).toBe(false);
    expect(result.added).toEqual(['02']);
    expect(result.pack.scenarios[0]!.items.map((i) => i.id)).toEqual(['01', '02']);
  });

  /* The footgun this guards: edit an existing sentence, re-run, and nothing
     happens. It must at least be said out loud. */
  it('leaves an existing sentence untouched and reports it as skipped', () => {
    const result = mergeImport(PACK, again);
    expect(result.skipped).toEqual(['01']);
    expect(result.pack.scenarios[0]!.items[0]!.en).toBe('Bread, please.');
  });

  /* Extras are the one field that unions: new sentences bring new distractor
     vocabulary, and adding to the list rewrites nothing. */
  it('unions the distractor extras rather than replacing them', () => {
    const result = mergeImport(PACK, again);
    expect(result.pack.scenarios[0]!.words).toEqual(['パン', 'ケーキ']);
    expect(result.wordsAdded).toEqual(['ケーキ']);
  });

  it('adds nothing at all when the same file is run twice', () => {
    const once = mergeImport(PACK, NEW_SITUATION).pack;
    const twice = mergeImport(once, NEW_SITUATION);

    expect(twice.added).toEqual([]);
    expect(twice.skipped).toEqual(['01']);
    expect(twice.pack).toEqual(once);
  });
});

describe('mergeImport — the terse "into" form', () => {
  it('appends to that situation and no other', () => {
    const { pack, created } = mergeImport(PACK, MORE_EXERCISES);
    expect(pack.scenarios).toHaveLength(1);
    expect(pack.scenarios[0]!.items.map((i) => i.id)).toEqual(['01', '02']);
    expect(created).toBe(false);
  });

  it('names the situations it knows when "into" matches none', () => {
    const wrong = { ...MORE_EXERCISES, into: 'bakry' };
    expect(() => mergeImport(PACK, wrong)).toThrow(/"bakry" names no situation.*"bakery"/s);
  });

  it('skips an id the situation already uses rather than failing', () => {
    const overlap = { ...MORE_EXERCISES, items: [{ id: '01', en: 'Again.', ans: 'パン|を' }] };
    expect(mergeImport(PACK, overlap).skipped).toEqual(['01']);
  });
});

describe('mergeImport — what is still an error', () => {
  /* A repeat inside one import is a slip, not a re-run: one of the two would be
     dropped and nothing would say which. */
  it('refuses two sentences sharing an id within the same import', () => {
    const twice = {
      ...NEW_SITUATION,
      scenario: {
        ...NEW_SITUATION.scenario,
        items: [
          { id: '01', en: 'One.', ans: 'ケーキ|を' },
          { id: '01', en: 'Two.', ans: 'パン|を' },
        ],
      },
    };
    expect(() => mergeImport(PACK, twice)).toThrow(/two sentences with id "01"/);
  });

  it('accepts an import that repeats a reading the pack already has', () => {
    const repeats = { ...NEW_SITUATION, lexicon: { ケーキ: 'keeki', パン: 'pan' } };
    expect(mergeImport(PACK, repeats).pack.lexicon['パン']).toBe('pan');
  });

  /* The conflict with consequences past this run: progress is keyed on the
     text, so quietly rewriting its reading would strand a learner's history. */
  it('refuses an import that reads an existing text differently', () => {
    const disagrees = { ...NEW_SITUATION, lexicon: { パン: 'pann' } };
    expect(() => mergeImport(PACK, disagrees)).toThrow(
      /"パン" is read "pan" in the pack but "pann" in the import/,
    );
  });
});
