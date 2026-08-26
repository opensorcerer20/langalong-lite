/* What is true of the Japanese pack specifically.

   The shape checks every pack has to pass live in languages.test.ts. This file
   is for the things that are Japanese's business alone: the sets it ships, the
   particles its distractors depend on, and the fact that it is written without
   spaces. A second language gets a file like this one of its own. */

import { describe, expect, it } from 'vitest';

import { JA } from '../../src/data/ja';
import { LANGUAGE, LANGUAGES } from '../../src/data/languages';

describe('the ja pack', () => {
  it('is the language the app currently drills', () => {
    expect(LANGUAGE).toBe(JA);
    expect(LANGUAGES).toContain(JA);
  });

  it('is written without spaces, so its tiles join directly', () => {
    expect(JA.joiner).toBe('');
  });

  it('asks for the vendored Japanese face declared in src/styles/fonts.css', () => {
    expect(JA.fontStack).toContain('Noto Sans JP');
  });

  it('ships the two situations in set order', () => {
    expect(JA.scenarios.map((s) => s.name)).toEqual(['Bakery', 'Train station']);
    expect(JA.scenarios.map((s) => s.kicker)).toEqual(['Set 01', 'Set 02']);
  });

  it('ships 10 bakery and 8 station sentences', () => {
    expect(JA.scenarios.map((s) => s.items.length)).toEqual([10, 8]);
  });

  it('carries the near-miss particles the distractors rely on', () => {
    const texts = JA.grammar.map((t) => t[0]);
    for (const particle of ['は', 'が', 'を', 'に', 'で', 'も', 'へ']) {
      expect(texts).toContain(particle);
    }
  });
});
