/* Content integrity. These do not test code so much as they test the Japanese:
   they are the net that catches a typo in a new sentence before it reaches a
   learner as a drill that cannot be completed. */

import { describe, expect, it } from 'vitest';

import { GRAMMAR } from '../../src/data/grammar';
import { SCENARIOS } from '../../src/data/scenarios';
import { segmentLongestFirst } from '../../src/lib/segment';

describe('SCENARIOS', () => {
  it('ships the two situations in set order', () => {
    expect(SCENARIOS.map((s) => s.name)).toEqual(['Bakery', 'Train station']);
    expect(SCENARIOS.map((s) => s.kicker)).toEqual(['Set 01', 'Set 02']);
  });

  it('ships 10 bakery and 8 station sentences', () => {
    expect(SCENARIOS.map((s) => s.items.length)).toEqual([10, 8]);
  });
});

describe.each(SCENARIOS)('$name', (scenario) => {
  it('has a non-empty blurb and its own vocabulary', () => {
    expect(scenario.blurb).not.toBe('');
    expect(scenario.words.length).toBeGreaterThan(0);
  });

  describe.each(scenario.items)('$en', (item) => {
    it('has an English prompt and at least two tiles', () => {
      expect(item.en).not.toBe('');
      expect(item.ans.length).toBeGreaterThanOrEqual(2);
    });

    it('has a grammar note — it is what the learner sees after a second miss', () => {
      expect(item.note.trim()).not.toBe('');
    });

    it('has a kana and a romaji on every tile', () => {
      for (const tile of item.ans) {
        expect(tile).toHaveLength(2);
        expect(tile[0].trim()).not.toBe('');
        expect(tile[1].trim()).not.toBe('');
      }
    });

    /* The one that matters most. An alternate the vocabulary cannot spell would
       be accepted by check() but impossible to build from the bank — the drill
       would look broken with no way to tell why. */
    it('can build every alternate from tiles in play', () => {
      const vocab = [...item.ans, ...GRAMMAR, ...scenario.words];
      for (const alt of item.alts ?? []) {
        const { tiles, rest } = segmentLongestFirst(alt, vocab);
        expect(rest, `"${alt}" left "${rest}" unsegmented`).toBe('');
        expect(tiles.map((t) => t[0]).join('')).toBe(alt);
      }
    });

    it('does not list an alternate identical to the canonical answer', () => {
      const canonical = item.ans.map((t) => t[0]).join('');
      expect(item.alts ?? []).not.toContain(canonical);
    });
  });
});

describe('GRAMMAR', () => {
  it('holds no duplicate kana — a repeat would waste a distractor slot', () => {
    const kana = GRAMMAR.map((t) => t[0]);
    expect(new Set(kana).size).toBe(kana.length);
  });

  it('carries the near-miss particles the distractors rely on', () => {
    const kana = GRAMMAR.map((t) => t[0]);
    for (const particle of ['は', 'が', 'を', 'に', 'で', 'も', 'へ']) {
      expect(kana).toContain(particle);
    }
  });
});
