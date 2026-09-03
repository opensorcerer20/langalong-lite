/* The en2ja library: an English speaker learning Japanese.

   Which file supplies which part of the store:

     tiles.ts          ──► EN2JA_CONTENT.tiles           every tile, deduped
     tiles.ts          ──► EN2JA_CONTENT.grammarTileIds  shared pool, as ids
     scenarios.ts      ──► EN2JA_CONTENT.scenarios       + kicker/blurb/vocab
     exercises/*.ts    ──► EN2JA_CONTENT.exercises       concatenated in
                                                         home-screen set order

   Then one more step, which is the only thing this file does that the others
   do not:

     EN2JA_CONTENT (ids)  ─ resolveLibrary ─►  EN2JA (tiles)

   Adding a situation: a file under exercises/, an entry in scenarios.ts, its
   tiles in tiles.ts. Nothing here changes but the import list. */

import type { DrillLanguage, DrillPack } from '../drill';
import { resolveLibrary } from '../resolve';
import type { ContentStore } from '../schema';
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
 */
export const EN2JA_LANGUAGE: DrillLanguage = {
  code: 'ja',
  name: 'Japanese',
  /* Japanese is written without spaces, so tiles butt straight up against one
     another — パン + を + ください is パンをください, not "パン を ください". */
  joiner: '',
  /* Declared in src/styles/fonts.css, subset to the kana and kanji in use. */
  fontStack: "'Noto Sans JP'",
};

/**
 * The library, resolved into a pack the drill can run on.
 *
 * Resolution happens once, here, at module load. A content mistake — an id
 * naming a tile that is not in the registry — throws before the app renders
 * anything, rather than surfacing as a broken drill later.
 */
export const EN2JA: DrillPack = resolveLibrary(EN2JA_CONTENT, EN2JA_LANGUAGE);
