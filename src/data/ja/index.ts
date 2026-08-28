/* The Japanese pack.

   This is the only file outside this folder that names Japanese: everything the
   rest of the app needs to know about the language is one of these eight fields.
   Adding a language means a sibling folder with an index like this one, and an
   entry in ../languages.ts. */

import type { LanguagePack } from '../types';
import { JA_CONJUGATIONS } from './conjugations';
import { JA_GRAMMAR } from './grammar';
import { JA_PARTICLES } from './particles';
import { JA_SCENARIOS } from './scenarios';

export const JA: LanguagePack = {
  code: 'ja',
  name: 'Japanese',
  /* Japanese is written without spaces, so tiles butt straight up against one
     another — パン + を + ください is パンをください, not "パン を ください". */
  joiner: '',
  /* Declared in src/styles/fonts.css, subset to the kana and kanji in use. */
  fontStack: "'Noto Sans JP'",
  grammar: JA_GRAMMAR,
  particles: JA_PARTICLES,
  conjugations: JA_CONJUGATIONS,
  scenarios: JA_SCENARIOS,
};
