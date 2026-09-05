/* The bank generator, including a parity check against the prototype.

   prototype-banks.json was produced by running the original bankFor() in
   prototype/app.js over every item in both sets. It pins the exact tile order
   of all 18 banks, so any change to the draw stride or the shuffle arithmetic
   shows up here rather than as a silently different app. */

import {
  describe,
  expect,
  it,
} from 'vitest';

import { TILE_MULTIPLIER } from '../../src/config';
import type { DrillItem } from '../../src/data/drill';
import { LANGUAGE } from '../../src/data/languages';
import {
  buildBank,
  MIN_BANK_TILES,
} from '../../src/lib/buildBank';
import PROTOTYPE_BANKS from '../fixtures/prototype-banks.json';
import {
  drillItem,
  textsOf as texts,
  tile,
} from '../helpers/fixtures';

/* Driven off the fixture rather than off LANGUAGE.scenarios, because parity is
   a claim about the sets the prototype shipped — a situation added since then
   has nothing to be at parity with. Every pinned set must still have a scenario
   reproducing it; a set the prototype never had is simply not this test's
   business. */
describe('buildBank — parity with the prototype', () => {
  const fixtures = PROTOTYPE_BANKS as Record<string, string[][]>;

  it.each(Object.keys(fixtures))('reproduces every %s bank tile for tile', (name) => {
    const expected = fixtures[name];
    const scenario = LANGUAGE.scenarios.find((s) => s.name === name);
    expect(scenario, `the pack no longer ships a situation named "${name}"`).toBeDefined();
    if (!scenario) return;

    scenario.items.forEach((item, index) => {
      const bank = buildBank(
        item,
        index,
        { grammar: LANGUAGE.grammar, words: scenario.words },
        TILE_MULTIPLIER,
      );
      expect(texts(bank), `${name} item ${index}`).toEqual(expected?.[index]);
    });
  });
});

describe('buildBank', () => {
  const scenario = LANGUAGE.scenarios[0]!;
  const pools = { grammar: LANGUAGE.grammar, words: scenario.words };
  const bankFor = (item: DrillItem, index = 0, multiplier = TILE_MULTIPLIER) =>
    buildBank(item, index, pools, multiplier);

  it('is deterministic — the same item and index give the same bank', () => {
    const item = scenario.items[0]!;
    expect(texts(bankFor(item, 3))).toEqual(texts(bankFor(item, 3)));
  });

  it('varies the order by index, so consecutive items do not look alike', () => {
    const item = scenario.items[0]!;
    expect(texts(bankFor(item, 0))).not.toEqual(texts(bankFor(item, 1)));
  });

  it('always contains every tile the answer needs', () => {
    for (const item of scenario.items) {
      const bank = texts(bankFor(item));
      for (const answerTile of item.answer) {
        expect(bank).toContain(answerTile.newLanguageText);
      }
    }
  });

  it('never drops below the minimum size, however short the sentence', () => {
    const short = drillItem({
      promptText: 'Bread, please.',
      answer: [tile('パン', 'pan'), tile('を', 'o', 'particle')],
      note: 'Two tiles only.',
    });
    expect(bankFor(short).length).toBeGreaterThanOrEqual(MIN_BANK_TILES);
  });

  it('scales with the multiplier once past the minimum', () => {
    const long = scenario.items[5]!; /* 6 tiles */
    expect(bankFor(long, 0, 1.5).length).toBeLessThan(bankFor(long, 0, 4.5).length);
  });

  it('oversupplies by roughly the multiplier', () => {
    const long = scenario.items[5]!;
    expect(bankFor(long, 0, 3).length).toBe(Math.ceil(long.answer.length * 3));
  });

  it('holds no duplicate tile, so a tile index identifies one tile', () => {
    for (const [index, item] of scenario.items.entries()) {
      const bank = texts(bankFor(item, index));
      expect(new Set(bank).size, `item ${index}`).toBe(bank.length);
    }
  });

  it('seeds the tiles an alternate needs but the canonical answer lacks', () => {
    /* "これをもらいます" needs もらいます, which the canonical これをお願いします
       does not supply. */
    const item = scenario.items[6]!;
    const alternates = item.alternates.map((alt) => texts(alt).join(LANGUAGE.joiner));
    expect(alternates).toContain('これをもらいます');
    expect(texts(bankFor(item, 6))).toContain('もらいます');
  });

  it('does not run out when the pool is smaller than the target size', () => {
    const item = scenario.items[0]!;
    const tiny = { grammar: LANGUAGE.grammar.slice(0, 2), words: [] };
    const bank = buildBank(item, 0, tiny, TILE_MULTIPLIER);
    expect(bank.length).toBeLessThan(MIN_BANK_TILES);
    expect(texts(bank)).toEqual(expect.arrayContaining(texts(item.answer)));
  });
});
