/* What is true of the Japanese pack alone. The checks every pack must pass are
   in languages.test.ts. */

import { describe, expect, it } from 'vitest';

import { JA, LANGUAGE, LANGUAGES } from '../../src/data/languages';

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

  /* No assertions on set sizes or situation names: they failed on every
     content edit and never caught a bug. */

  it('carries the near-miss particles the distractors rely on', () => {
    const texts = JA.grammar.map((t) => t[0]);
    for (const particle of ['は', 'が', 'を', 'に', 'で', 'も', 'へ']) {
      expect(texts).toContain(particle);
    }
  });
});
