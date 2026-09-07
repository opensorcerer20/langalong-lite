/* Parsing a content file the compiler has never seen.

   Two kinds of test here. Most use inline fixtures and assert what the schema
   accepts or refuses. The last group parses the real content files — not as
   convenient examples, but because "the schema accepts what the app ships" is
   the property that catches a schema stricter than the interfaces it mirrors,
   which no inline fixture can. */

import { describe, expect, it } from 'vitest';

import JA_BAKERY from '../../content/ja/bakery.json';
import JA_CORE from '../../content/ja/core.json';
import JA_STATION from '../../content/ja/station.json';
import { parseCoreFile, parseSituationFile } from '../../scripts/contentSchema';

const SITUATION = {
  lexicon: { パン: 'pan' },
  scenario: {
    id: 'bakery',
    name: 'Bakery',
    blurb: 'At the counter.',
    items: [{ id: '01', en: 'Bread, please.', ans: 'パン|を|ください' }],
  },
};

function refuse(value: unknown): string {
  try {
    parseSituationFile(value, 'test.json');
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
  throw new Error('expected the parse to throw, and it did not');
}

describe('parseSituationFile', () => {
  it('returns the file it was given when the shape is right', () => {
    expect(parseSituationFile(SITUATION, 'test.json')).toEqual(SITUATION);
  });

  it('accepts a sentence with none of the optional fields', () => {
    expect(() => parseSituationFile(SITUATION, 'test.json')).not.toThrow();
  });

  it('accepts every optional field being present', () => {
    const full = {
      ...SITUATION,
      scenario: {
        ...SITUATION.scenario,
        words: ['ケーキ'],
        items: [
          {
            id: '01',
            en: 'Bread, please.',
            ans: 'パン|を|ください',
            alts: ['パンをお願いします'],
            note: 'を marks the object.',
            teaches: ['o'],
          },
        ],
      },
    };
    expect(() => parseSituationFile(full, 'test.json')).not.toThrow();
  });
});

describe('parseSituationFile — what it refuses', () => {
  it('names the path of a missing required field', () => {
    const noBlurb = { ...SITUATION, scenario: { ...SITUATION.scenario, blurb: undefined } };
    expect(refuse(noBlurb)).toContain('scenario.blurb');
  });

  it('names the path of a field of the wrong type, index included', () => {
    const numbered = {
      ...SITUATION,
      scenario: { ...SITUATION.scenario, items: [{ id: 1, en: 'x', ans: 'パン' }] },
    };
    expect(refuse(numbered)).toContain('scenario.items.0.id');
  });

  /* The gap tsc leaves on a compiled-in file, closed here for a read one: a
     typo'd OPTIONAL key is legal TypeScript and silently drops the field. */
  it('refuses a typo in an optional key rather than dropping it', () => {
    const typo = {
      ...SITUATION,
      scenario: {
        ...SITUATION.scenario,
        items: [{ id: '01', en: 'x', ans: 'パン', nte: 'a note that would vanish' }],
      },
    };
    expect(refuse(typo)).toContain('nte');
  });

  it('reports every problem in one go rather than the first', () => {
    const broken = { lexicon: 'not an object', scenario: { id: 'x' } };
    const message = refuse(broken);
    expect(message).toContain('lexicon');
    expect(message).toContain('scenario.name');
    expect(message).toContain('scenario.items');
  });

  it('names the file it was reading', () => {
    expect(refuse(42)).toContain('test.json');
  });

  it('refuses a lexicon whose readings are not strings', () => {
    expect(refuse({ ...SITUATION, lexicon: { パン: 3 } })).toContain('lexicon');
  });
});

describe('the shipped content files', () => {
  /* If a schema above asks for more than the app does, this is what says so. */
  it.each([
    ['bakery', JA_BAKERY],
    ['station', JA_STATION],
  ])('parses content/ja/%s.json', (name, file) => {
    expect(() => parseSituationFile(file, `content/ja/${name}.json`)).not.toThrow();
  });

  it('parses content/ja/core.json', () => {
    expect(() => parseCoreFile(JA_CORE, 'content/ja/core.json')).not.toThrow();
  });
});
