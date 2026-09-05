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

  /* Exact set sizes were asserted here — [10, 8] — and, alongside them, the
     exact situation list: ['Bakery', 'Train station'] and its kickers. Both
     failed every time content was written and neither ever indicated a bug, so
     both are gone. That each set is non-empty, internally sound and uniquely
     identified is languages.test.ts's job, and it does not care how many
     situations there are. */

  it('carries the near-miss particles the distractors rely on', () => {
    const texts = JA.grammar.map((t) => t[0]);
    for (const particle of ['は', 'が', 'を', 'に', 'で', 'も', 'へ']) {
      expect(texts).toContain(particle);
    }
  });
});
