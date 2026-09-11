/* Parsing a content file the compiler has never seen.

   Most tests here use inline fixtures and assert what the schema accepts or
   refuses. The last group reads files off disk — tests/fixtures/content/, never
   content/ja/ — because the schema being stricter than the interfaces it
   mirrors shows up only against a whole, valid file, and reading one is also
   the path the script itself takes. */

import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';
import { parseCoreFile, parseScenarioFile } from '../../scripts/contentSchema';

const SCENARIO = {
  id: 'bakery',
  name: 'Bakery',
  blurb: 'At the counter.',
  lexicon: { パン: 'pan' },
  items: [{ id: '01', en: 'Bread, please.', ans: 'パン|を|ください' }],
};

function refuse(value: unknown): string {
  try {
    parseScenarioFile(value, 'test.json');
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
  throw new Error('expected the parse to throw, and it did not');
}

describe('parseScenarioFile', () => {
  it('returns the file it was given when the shape is right', () => {
    expect(parseScenarioFile(SCENARIO, 'test.json')).toEqual(SCENARIO);
  });

  it('accepts a sentence with none of the optional fields', () => {
    expect(() => parseScenarioFile(SCENARIO, 'test.json')).not.toThrow();
  });

  it('accepts every optional field being present', () => {
    const full = {
      ...SCENARIO,
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
    };
    expect(() => parseScenarioFile(full, 'test.json')).not.toThrow();
  });
});

describe('parseScenarioFile — what it refuses', () => {
  it('names the path of a missing required field', () => {
    expect(refuse({ ...SCENARIO, blurb: undefined })).toContain('blurb');
  });

  it('names the path of a field of the wrong type, index included', () => {
    const numbered = { ...SCENARIO, items: [{ id: 1, en: 'x', ans: 'パン' }] };
    expect(refuse(numbered)).toContain('items.0.id');
  });

  /* The gap tsc leaves on a compiled-in file, closed here for a read one: a
     typo'd OPTIONAL key is legal TypeScript and silently drops the field. */
  it('refuses a typo in an optional key rather than dropping it', () => {
    const typo = {
      ...SCENARIO,
      items: [{ id: '01', en: 'x', ans: 'パン', nte: 'a note that would vanish' }],
    };
    expect(refuse(typo)).toContain('nte');
  });

  it('reports every problem in one go rather than the first', () => {
    const message = refuse({ id: 'x', lexicon: 'not an object' });
    expect(message).toContain('lexicon');
    expect(message).toContain('name');
    expect(message).toContain('items');
  });

  it('names the file it was reading', () => {
    expect(refuse(42)).toContain('test.json');
  });

  it('refuses a lexicon whose readings are not strings', () => {
    expect(refuse({ ...SCENARIO, lexicon: { パン: 3 } })).toContain('lexicon');
  });
});

describe('whole files, read the way the script reads them', () => {
  /* From the project root, which is where both vitest and the script run. */
  const read = (name: string): unknown =>
    JSON.parse(readFileSync(`tests/fixtures/content/${name}.json`, 'utf8'));

  /* Two shapes worth having on disk: one carrying every optional field, one
     carrying none. Between them they cover what a schema could wrongly demand. */
  it.each(['full', 'minimal'])('parses a %s scenario file', (name) => {
    expect(() => parseScenarioFile(read(name), `${name}.json`)).not.toThrow();
  });

  it('parses a core file', () => {
    expect(() => parseCoreFile(read('core'), 'core.json')).not.toThrow();
  });

  it('returns the file unchanged, so nothing is dropped on the way through', () => {
    const file = read('full');
    expect(parseScenarioFile(file, 'full.json')).toEqual(file);
  });
});
