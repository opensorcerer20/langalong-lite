/* What the import report claims.

   Inline fixtures, never the shipped pack — "first taught" is measured against
   the whole pack, so a test reading ja.json would fail the day someone tags an
   existing sentence with a particle. */

import { describe, expect, it } from 'vitest';

import { buildReport, formatReport } from '../../scripts/importReport';
import type { ImportFile } from '../../scripts/mergeImport';
import { mergeImport } from '../../scripts/mergeImport';
import type { PackFile } from '../../src/data/loadPack';

const PACK: PackFile = {
  code: 'xx',
  name: 'Test',
  joiner: '',
  fontStack: 'serif',
  lexicon: { パン: 'pan', を: 'o', ください: 'kudasai', です: 'desu' },
  grammar: ['を', 'です', 'ください'],
  particles: { o: { tile: 'を', gloss: 'direct object' }, mo: { tile: 'も', gloss: 'too' } },
  conjugations: { tai: { name: 'want to', note: 'stem + たい' } },
  scenarios: [
    {
      id: 'bakery',
      name: 'Bakery',
      blurb: 'At the counter.',
      items: [{ id: '01', en: 'Bread, please.', ans: 'パン|を|ください', teaches: ['o'] }],
    },
  ],
};

const CAFE: ImportFile = {
  lexicon: { ケーキ: 'keeki', も: 'mo', を: 'o' },
  scenario: {
    id: 'cafe',
    name: 'Café',
    blurb: 'Ordering.',
    words: ['ケーキ'],
    items: [
      { id: '01', en: 'Cake, please.', ans: 'ケーキ|を|ください', teaches: ['o'] },
      { id: '02', en: 'This too.', ans: 'ケーキ|も|ください', teaches: ['mo'] },
    ],
  },
};

function reportFor(pack: PackFile, file: ImportFile) {
  return buildReport(pack, file, mergeImport(pack, file));
}

describe('buildReport', () => {
  it('names the situation and the set number it lands on', () => {
    const report = reportFor(PACK, CAFE);
    expect(report.situationId).toBe('cafe');
    expect(report.situationName).toBe('Café');
    expect(report.kicker).toBe('Set 02');
    expect(report.created).toBe(true);
  });

  it('splits the import lexicon into new readings and restated ones', () => {
    const report = reportFor(PACK, CAFE);
    expect(report.lexiconNew).toEqual(['ケーキ', 'も']);
    expect(report.lexiconPresent).toEqual(['を']);
  });

  it('counts each grammar-pool tile the new answers use once', () => {
    /* を and ください appear in both sentences; も is not in the pool. */
    expect(reportFor(PACK, CAFE).reused).toEqual(['を', 'ください']);
  });

  /* The line the whole report exists for: is this import broadening coverage? */
  it('reports only grammar no sentence in the pack already teaches', () => {
    expect(reportFor(PACK, CAFE).firstTaught).toEqual(['mo']);
  });

  it('measures first-taught against the whole pack, not the situation', () => {
    const elsewhere: PackFile = {
      ...PACK,
      scenarios: [
        PACK.scenarios[0]!,
        { id: 'other', name: 'Other', blurb: '.', items: [{ id: '01', en: 'x', ans: 'パン', teaches: ['mo'] }] },
      ],
    };
    expect(reportFor(elsewhere, CAFE).firstTaught).toEqual([]);
  });

  it('carries the merge’s added, skipped and extra words through', () => {
    const again: ImportFile = { lexicon: {}, into: 'bakery', items: [
      { id: '01', en: 'EDITED', ans: 'パン' },
      { id: '02', en: 'New.', ans: 'パン|です' },
    ] };
    const report = reportFor(PACK, again);
    expect(report.added).toEqual(['02']);
    expect(report.skipped).toEqual(['01']);
    expect(report.created).toBe(false);
  });

  /* An import that only skips must not credit the skipped sentence's grammar
     to itself — nothing was added, so nothing was taught. */
  it('ignores sentences it skipped when reporting reuse and teaching', () => {
    const nothing: ImportFile = {
      lexicon: {},
      into: 'bakery',
      items: [{ id: '01', en: 'Bread, please.', ans: 'パン|を|ください', teaches: ['mo'] }],
    };
    const report = reportFor(PACK, nothing);
    expect(report.added).toEqual([]);
    expect(report.reused).toEqual([]);
    expect(report.firstTaught).toEqual([]);
  });
});

describe('formatReport', () => {
  const context = { source: 'content/cafe.json', target: 'src/data/ja.json' };

  it('says plainly that nothing was written', () => {
    const text = formatReport(reportFor(PACK, CAFE), context);
    expect(text).toContain('content/cafe.json → src/data/ja.json');
    expect(text).toMatch(/dry run/);
  });

  it('reports the counts the report gathered', () => {
    const text = formatReport(reportFor(PACK, CAFE), context);
    expect(text).toContain('cafe "Café" → Set 02 (new)');
    expect(text).toContain('2 added');
    expect(text).toContain('+2 new, 1 already present');
    expect(text).toContain('mo');
  });

  /* The footgun: edit a sentence, re-run, nothing happens. The report has to
     say so out loud, and say where to go instead. */
  it('explains what to do instead when sentences were skipped', () => {
    const again: ImportFile = {
      lexicon: {},
      into: 'bakery',
      items: [{ id: '01', en: 'EDITED', ans: 'パン' }],
    };
    const text = formatReport(reportFor(PACK, again), context);
    expect(text).toContain('01 — already in the pack');
    expect(text).toContain('edit src/data/ja.json to change a sentence');
  });

  it('says nothing about skipping when nothing was skipped', () => {
    expect(formatReport(reportFor(PACK, CAFE), context)).not.toContain('skipped');
  });
});
