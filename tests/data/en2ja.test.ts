/* What is true of the en2ja pack specifically.

   The shape checks every pack has to pass live in languages.test.ts. This file
   is for the things that are Japanese's business alone: the sets it ships, the
   particles its distractors depend on, and the fact that it is written without
   spaces. A second language gets a file like this one of its own. */

import {
  describe,
  expect,
  it,
} from 'vitest';

import { EN2JA } from '../../src/data/en2ja';
import {
  LANGUAGE,
  LANGUAGES,
} from '../../src/data/languages';

describe('the en2ja pack', () => {
  it('is the language the app currently drills', () => {
    expect(LANGUAGE).toBe(EN2JA);
    expect(LANGUAGES).toContain(EN2JA);
  });

  it('is written without spaces, so its tiles join directly', () => {
    expect(EN2JA.joiner).toBe('');
  });

  it('asks for the vendored Japanese face declared in src/styles/fonts.css', () => {
    expect(EN2JA.fontStack).toContain('Noto Sans JP');
  });

  it('ships the two situations in set order', () => {
    expect(EN2JA.scenarios.map((s) => s.name)).toEqual(['Bakery', 'Train station']);
    expect(EN2JA.scenarios.map((s) => s.kicker)).toEqual(['Set 01', 'Set 02']);
  });

  it('ships 10 bakery and 8 station sentences', () => {
    expect(EN2JA.scenarios.map((s) => s.items.length)).toEqual([10, 8]);
  });

  it('carries the near-miss particles the distractors rely on', () => {
    const texts = EN2JA.grammar.map((t) => t.newLanguageText);
    for (const particle of ['は', 'が', 'を', 'に', 'で', 'も', 'へ']) {
      expect(texts).toContain(particle);
    }
  });
});
