/* What survives validation, and what is rejected.

   The rejections carry the weight: content is hand-edited, so every one of
   these is a mistake someone will actually make, and the contract is that it
   stops at the file it was made in rather than surfacing later as a missing
   tile or a dropped alternate. */

import { describe, expect, it } from 'vitest';

import { parseEntries, parseManifest } from '../../../src/data/import/validateRaw';

const ENTRY = {
  scenario: 'bakery',
  question: 'One bread, please.',
  answer: [
    ['パン', 'pan', 'noun'],
    ['を', 'o', 'particle'],
    ['ください', 'kudasai', 'verb'],
  ],
  note: 'を marks the direct object.',
};

const entry = (overrides: Record<string, unknown> = {}) => [{ ...ENTRY, ...overrides }];

const MANIFEST = {
  library: 'en2ja',
  grammar: [['を', 'o', 'particle']],
  scenarios: [
    {
      id: 'bakery',
      name: 'Bakery',
      blurb: 'Asking for items.',
      file: 'bakery.json',
      vocab: [['ケーキ', 'keeki', 'noun']],
    },
  ],
};

const manifest = (overrides: Record<string, unknown> = {}) => ({ ...MANIFEST, ...overrides });

describe('parseEntries', () => {
  it('accepts a minimal entry and carries every field through', () => {
    const [parsed] = parseEntries(entry(), 'bakery.json');
    expect(parsed).toEqual({
      scenario: 'bakery',
      question: 'One bread, please.',
      answer: [
        ['パン', 'pan', 'noun'],
        ['を', 'o', 'particle'],
        ['ください', 'kudasai', 'verb'],
      ],
      note: 'を marks the direct object.',
    });
  });

  /* Both are absent from most authored entries; requiring them would put
     "alts": [] on fifteen of the eighteen existing exercises. */
  it('leaves alts and tags off when they are not authored', () => {
    const [parsed] = parseEntries(entry(), 'bakery.json');
    expect(parsed).not.toHaveProperty('alts');
    expect(parsed).not.toHaveProperty('tags');
  });

  it('keeps alternates as tile sequences, one array per alternate', () => {
    const alts = [[['パン', 'pan', 'noun'], ['を', 'o', 'particle']]];
    const [parsed] = parseEntries(entry({ alts }), 'bakery.json');
    expect(parsed?.alts).toEqual(alts);
  });

  it('keeps tag groups as authored, for tags.ts to flatten later', () => {
    const [parsed] = parseEntries(entry({ tags: { particles: ['を'] } }), 'bakery.json');
    expect(parsed?.tags).toEqual({ particles: ['を'] });
  });

  it('names the file and the entry, 1-based, when something is wrong', () => {
    const entries = [{ ...ENTRY }, { ...ENTRY, note: '' }];
    expect(() => parseEntries(entries, 'bakery.json')).toThrow(/bakery\.json entry 2/);
  });

  /* The rule the architecture doc calls out by name: reject, do not default. */
  it('rejects a tile with no type', () => {
    const answer = [['パン', 'pan']];
    expect(() => parseEntries(entry({ answer }), 'bakery.json')).toThrow(/got 2 element\(s\)/);
  });

  it('rejects a tile whose type is not a known word class', () => {
    const answer = [['パン', 'pan', 'nown']];
    expect(() => parseEntries(entry({ answer }), 'bakery.json')).toThrow(
      /tile "パン" has type "nown"; expected one of: noun, verb/,
    );
  });

  it('rejects a tile with no reading', () => {
    const answer = [['パン', '', 'noun']];
    expect(() => parseEntries(entry({ answer }), 'bakery.json')).toThrow(/tile "パン" has no reading/);
  });

  /* "alt" instead of "alts" would otherwise parse cleanly and lose the
     alternate, which nothing downstream could notice. */
  it('rejects a misspelled field rather than ignoring it', () => {
    const entries = [{ ...ENTRY, alt: [] }];
    expect(() => parseEntries(entries, 'bakery.json')).toThrow(/unknown field "alt"/);
  });

  it('rejects an unknown tag group', () => {
    const tags = { particle: ['を'] };
    expect(() => parseEntries(entry({ tags }), 'bakery.json')).toThrow(
      /unknown field "particle".*particles, conjugations/s,
    );
  });

  it.each([
    { name: 'a missing note', overrides: { note: undefined }, pattern: /"note" must be a string/ },
    { name: 'an empty note', overrides: { note: '   ' }, pattern: /"note" must not be empty/ },
    { name: 'a missing scenario', overrides: { scenario: undefined }, pattern: /"scenario" must be a string/ },
    { name: 'an empty answer', overrides: { answer: [] }, pattern: /at least one tile/ },
    { name: 'an answer that is not an array', overrides: { answer: 'パンをください' }, pattern: /"answer" must be an array/ },
    { name: 'an empty alternate', overrides: { alts: [[]] }, pattern: /alts\[0\]: must have at least one tile/ },
  ])('rejects $name', ({ overrides, pattern }) => {
    expect(() => parseEntries(entry(overrides), 'bakery.json')).toThrow(pattern);
  });

  it('rejects a file that is not an array of entries', () => {
    expect(() => parseEntries(ENTRY, 'bakery.json')).toThrow(/expected an array of entries/);
  });

  it('accepts an empty file, which is a situation with nothing authored yet', () => {
    expect(parseEntries([], 'bakery.json')).toEqual([]);
  });
});

describe('parseManifest', () => {
  it('accepts a minimal manifest and carries every field through', () => {
    expect(parseManifest(manifest(), 'library.json')).toEqual(MANIFEST);
  });

  it('preserves vocab order, which decides every bank in the set', () => {
    const vocab = [
      ['ケーキ', 'keeki', 'noun'],
      ['パン', 'pan', 'noun'],
      ['コーヒー', 'koohii', 'noun'],
    ];
    const scenarios = [{ ...MANIFEST.scenarios[0], vocab }];
    expect(parseManifest(manifest({ scenarios }), 'library.json').scenarios[0]?.vocab).toEqual(vocab);
  });

  it('accepts a situation that offers no distractors of its own', () => {
    const scenarios = [{ ...MANIFEST.scenarios[0], vocab: [] }];
    expect(parseManifest(manifest({ scenarios }), 'library.json').scenarios[0]?.vocab).toEqual([]);
  });

  it('rejects two situations sharing an id', () => {
    const scenarios = [MANIFEST.scenarios[0], { ...MANIFEST.scenarios[0], name: 'Second' }];
    expect(() => parseManifest(manifest({ scenarios }), 'library.json')).toThrow(
      /two scenarios share the id "bakery"/,
    );
  });

  it('names the situation by index when one of them is wrong', () => {
    const scenarios = [MANIFEST.scenarios[0], { ...MANIFEST.scenarios[0], id: 'station', blurb: '' }];
    expect(() => parseManifest(manifest({ scenarios }), 'library.json')).toThrow(
      /library\.json scenarios\[1\]: "blurb" must not be empty/,
    );
  });

  it.each([
    { name: 'an empty grammar pool', overrides: { grammar: [] }, pattern: /"grammar" must not be empty/ },
    { name: 'no situations', overrides: { scenarios: [] }, pattern: /"scenarios" must not be empty/ },
    { name: 'a missing library id', overrides: { library: undefined }, pattern: /"library" must be a string/ },
    { name: 'an unknown field', overrides: { language: {} }, pattern: /unknown field "language"/ },
  ])('rejects $name', ({ overrides, pattern }) => {
    expect(() => parseManifest(manifest(overrides), 'library.json')).toThrow(pattern);
  });

  it('rejects a manifest that is not an object', () => {
    expect(() => parseManifest([], 'library.json')).toThrow(/library\.json: expected an object/);
  });
});
