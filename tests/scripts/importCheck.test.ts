/* Checking a candidate situation file against a pack.

   Inline fixtures, never the shipped content — "first taught" is measured
   against every other situation, so a test reading content/ja/ would fail the
   day someone tags an existing sentence with a particle. */

import { describe, expect, it } from 'vitest';

import { checkImport, formatReport } from '../../scripts/importCheck';
import type { CoreFile, ScenarioFile } from '../../src/data/assemblePack';

const CORE: CoreFile = {
  code: 'xx',
  name: 'Test',
  joiner: '',
  fontStack: 'serif',
  lexicon: { を: 'o', ください: 'kudasai', も: 'mo' },
  grammar: ['を', 'ください', 'も'],
  particles: { o: { tile: 'を', gloss: 'direct object' }, mo: { tile: 'も', gloss: 'too' } },
  conjugations: { tai: { name: 'want to', note: 'stem + たい' } },
};

const BAKERY: ScenarioFile = {
  id: 'bakery',
  name: 'Bakery',
  blurb: 'At the counter.',
  lexicon: { パン: 'pan' },
  items: [{ id: '01', en: 'Bread, please.', ans: 'パン|を|ください', teaches: ['o'] }],
};

const CAFE: ScenarioFile = {
  id: 'cafe',
  name: 'Café',
  blurb: 'Ordering.',
  lexicon: { ケーキ: 'keeki', を: 'o' },
  words: ['コーヒー'],
  items: [
    { id: '01', en: 'Cake, please.', ans: 'ケーキ|を|ください', teaches: ['o'] },
    { id: '02', en: 'This too.', ans: 'ケーキ|も|ください', teaches: ['mo'] },
  ],
};

const check = (candidate: ScenarioFile, scenarios: readonly ScenarioFile[] = [BAKERY]) =>
  checkImport(CORE, scenarios, candidate);

describe('checkImport — a situation the pack does not list', () => {
  it('reports where it would land', () => {
    const { report } = check(CAFE);
    expect(report.situationId).toBe('cafe');
    expect(report.situationName).toBe('Café');
    expect(report.lessonNum).toBe('02');
    expect(report.replacing).toBe(false);
    expect(report.sentences).toBe(2);
  });

  it('appends it to the pack it hands back', () => {
    expect(check(CAFE).pack.scenarios.map((s) => s.id)).toEqual(['bakery', 'cafe']);
  });

  it('splits its lexicon into new readings and restated ones', () => {
    const { report } = check(CAFE);
    expect(report.lexiconNew).toEqual(['ケーキ']);
    expect(report.lexiconPresent).toEqual(['を']);
  });

  it('counts each grammar-pool tile its answers use once', () => {
    expect(check(CAFE).report.reused).toEqual(['を', 'ください', 'も']);
  });

  /* The line the report exists for: is this broadening coverage? */
  it('reports only grammar no other situation teaches', () => {
    expect(check(CAFE).report.firstTaught).toEqual(['mo']);
  });

  it('lists the distractors it adds beyond its own answers', () => {
    expect(check(CAFE).report.extraWords).toEqual(['コーヒー']);
  });
});

/* Re-checking a file the pack already lists has to work, or the command is
   useful exactly once per situation. */
describe('checkImport — a situation the pack already lists', () => {
  it('stands in for the existing one instead of colliding with it', () => {
    const { pack, report } = check(CAFE, [BAKERY, CAFE]);
    expect(report.replacing).toBe(true);
    expect(pack.scenarios.map((s) => s.id)).toEqual(['bakery', 'cafe']);
  });

  it('keeps its position, so the set number does not move', () => {
    const { report } = check(BAKERY, [BAKERY, CAFE]);
    expect(report.lessonNum).toBe('01');
  });

  it('still measures first taught against the other situations only', () => {
    expect(check(CAFE, [BAKERY, CAFE]).report.firstTaught).toEqual(['mo']);
  });

  it('picks up an edit to the file rather than the version in the pack', () => {
    const edited: ScenarioFile = { ...CAFE, name: 'Coffee shop' };
    expect(check(edited, [BAKERY, CAFE]).report.situationName).toBe('Coffee shop');
  });
});

describe('checkImport — what it leaves to loadPack', () => {
  /* A missing reading is loadPack's throw, naming the sentence. Checking it
     here as well would be a second set of rules to keep in step. */
  it('hands back a pack a missing reading makes unloadable', () => {
    const missing: ScenarioFile = {
      id: 'x',
      name: 'X',
      blurb: '.',
      lexicon: {},
      items: [{ id: '01', en: 'x', ans: '肉' }],
    };
    expect(() => check(missing)).not.toThrow();
  });
});

describe('formatReport', () => {
  it('says where the file is not yet listed', () => {
    const text = formatReport(check(CAFE).report, 'content/ja/cafe.json');
    expect(text).toContain('content/ja/cafe.json');
    expect(text).toContain('cafe "Café" → Set 02');
    expect(text).toContain('Not listed in src/data/languages.ts yet');
  });

  it('says when it is already listed', () => {
    const text = formatReport(check(CAFE, [BAKERY, CAFE]).report, 'content/ja/cafe.json');
    expect(text).toContain('Already listed in src/data/languages.ts.');
  });

  it('reports the counts it gathered', () => {
    const text = formatReport(check(CAFE).report, 'content/ja/cafe.json');
    expect(text).toContain('+1 new, 1 already present');
    expect(text).toContain('3 tiles already in the grammar pool');
    expect(text).toContain('mo');
  });

  it('says so plainly when nothing new is taught', () => {
    const elsewhere: ScenarioFile = { ...CAFE, id: 'other' };
    const text = formatReport(check(CAFE, [BAKERY, CAFE, elsewhere]).report, 'x.json');
    expect(text).toContain('nothing new');
  });
});
