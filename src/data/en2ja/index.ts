/* The en2ja library: an English speaker learning Japanese.

   Everything here is content at rest — three tables and the pool, exactly as
   docs/japanese-app-content-architecture.md describes them. Nothing is
   resolved, so an exercise still holds tile ids rather than tiles; turning this
   into something the drill can run on is resolve.ts's job.

   Adding a situation means a file under exercises/, an entry in scenarios.ts,
   and its tiles in tiles.ts. Nothing here changes but the import list. */

import type { ContentStore } from '../schema';
import type { LanguagePack } from '../types';
import { BAKERY_EXERCISES } from './exercises/bakery';
import { STATION_EXERCISES } from './exercises/station';
import { EN2JA_SCENARIOS } from './scenarios';
import { EN2JA_GRAMMAR_TILE_IDS, EN2JA_TILES } from './tiles';

export const EN2JA_CONTENT: ContentStore = {
  library: 'en2ja',
  scenarios: EN2JA_SCENARIOS,
  tiles: EN2JA_TILES,
  exercises: [...BAKERY_EXERCISES, ...STATION_EXERCISES],
  grammarTileIds: EN2JA_GRAMMAR_TILE_IDS,
};

/**
 * The facts about Japanese that are not content: how its script joins, and what
 * renders it. They belong to the language rather than to any situation, which
 * is why they sit beside the store instead of inside it.
 *
 * Typed as the pack minus the two fields resolve.ts fills in, so the two halves
 * cannot drift apart without a type error.
 */
export const EN2JA_LANGUAGE: Omit<LanguagePack, 'grammar' | 'scenarios'> = {
  code: 'ja',
  name: 'Japanese',
  /* Japanese is written without spaces, so tiles butt straight up against one
     another — パン + を + ください is パンをください, not "パン を ください". */
  joiner: '',
  /* Declared in src/styles/fonts.css, subset to the kana and kanji in use. */
  fontStack: "'Noto Sans JP'",
};
