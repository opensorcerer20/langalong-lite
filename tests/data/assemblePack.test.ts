/* Assembling a pack from a core file and per-situation files.

   Inline fixtures, never the shipped content — these assert how assembly
   behaves, and content is free to change without failing them. */

import {
  describe,
  expect,
  it,
} from 'vitest';

import type {
  CoreFile,
  SituationFile,
} from '../../src/data/assemblePack';
import { assemblePack } from '../../src/data/assemblePack';

const CORE: CoreFile = {
  code: 'xx',
  name: 'Test',
  joiner: '',
  fontStack: 'serif',
  lexicon: { を: 'o', ください: 'kudasai' },
  grammar: ['を', 'ください'],
  particles: { o: { tile: 'を', gloss: 'direct object' } },
  conjugations: { tai: { name: 'want to', note: 'stem + たい' } },
};

const BAKERY: SituationFile = {
  lexicon: { パン: 'pan' },
  scenario: {
    id: 'bakery',
    name: 'Bakery',
    blurb: 'At the counter.',
    items: [{ id: '01', en: 'Bread, please.', ans: 'パン|を|ください' }],
  },
};

const CAFE: SituationFile = {
  lexicon: { ケーキ: 'keeki' },
  scenario: {
    id: 'cafe',
    name: 'Café',
    blurb: 'Ordering.',
    items: [{ id: '01', en: 'Cake, please.', ans: 'ケーキ|を|ください' }],
  },
};

describe('assemblePack', () => {
  it('keeps the situations in the order it was given them', () => {
    const pack = assemblePack(CORE, [BAKERY, CAFE]);
    expect(pack.scenarios.map((scenario) => scenario.id)).toEqual(['bakery', 'cafe']);
  });

  it('folds every situation reading into one lexicon', () => {
    expect(assemblePack(CORE, [BAKERY, CAFE]).lexicon).toEqual({
      を: 'o',
      ください: 'kudasai',
      パン: 'pan',
      ケーキ: 'keeki',
    });
  });

  it('carries the core through unchanged', () => {
    const pack = assemblePack(CORE, [BAKERY]);
    expect(pack.code).toBe('xx');
    expect(pack.grammar).toBe(CORE.grammar);
    expect(pack.particles).toBe(CORE.particles);
    expect(pack.conjugations).toBe(CORE.conjugations);
  });

  it('assembles an empty pack from no situations at all', () => {
    const pack = assemblePack(CORE, []);
    expect(pack.scenarios).toEqual([]);
    expect(pack.lexicon).toBe(CORE.lexicon);
  });

  /* 友達 belongs to every situation that uses it, and each states its reading. */
  it('accepts two situations giving a shared word the same reading', () => {
    const also: SituationFile = { ...CAFE, lexicon: { ケーキ: 'keeki', パン: 'pan' } };
    expect(assemblePack(CORE, [BAKERY, also]).lexicon['パン']).toBe('pan');
  });

  it('does not mutate the lexicons it was given', () => {
    assemblePack(CORE, [BAKERY, CAFE]);
    expect(CORE.lexicon).toEqual({ を: 'o', ください: 'kudasai' });
    expect(BAKERY.lexicon).toEqual({ パン: 'pan' });
  });
});

describe('assemblePack — what it refuses', () => {
  /* Progress is keyed on the text, so taking one reading silently would attach
     a learner's history to a word that now reads differently. */
  it('refuses two files that read the same text differently', () => {
    const disagrees: SituationFile = { ...CAFE, lexicon: { パン: 'pann' } };
    expect(() => assemblePack(CORE, [BAKERY, disagrees])).toThrow(
      /"パン" is read "pan" already and "pann" in "cafe"/,
    );
  });

  it('refuses a situation that contradicts the core', () => {
    const disagrees: SituationFile = { ...CAFE, lexicon: { を: 'wo' } };
    expect(() => assemblePack(CORE, [disagrees])).toThrow(/"を" is read "o" already/);
  });

  /* Situation ids are storage keys — a repeat would merge two situations'
     progress, and only one of them would ever be drilled. */
  it('refuses two situation files sharing an id', () => {
    const twice: SituationFile = { ...CAFE, scenario: { ...CAFE.scenario, id: 'bakery' } };
    expect(() => assemblePack(CORE, [BAKERY, twice])).toThrow(
      /two situation files both use the id "bakery"/,
    );
  });

  it('refuses two sentences sharing an id inside one situation', () => {
    const twice: SituationFile = {
      ...BAKERY,
      scenario: {
        ...BAKERY.scenario,
        items: [
          { id: '01', en: 'One.', ans: 'パン' },
          { id: '01', en: 'Two.', ans: 'を' },
        ],
      },
    };
    expect(() => assemblePack(CORE, [twice])).toThrow(/"bakery" has two sentences with id "01"/);
  });
});
