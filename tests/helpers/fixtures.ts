/* Building tiles, drill items and situations for tests.

   Fixtures used to be tuples — `['パン', 'pan']` — which were compact enough to
   write inline. A tile is now an object with four fields, three of which most
   tests do not care about, so writing one by hand at every site would bury the
   part that matters. These keep a fixture to roughly its old width:

     tile('パン', 'pan')                  → { id: 'noun:パン', newLanguageText: 'パン',
                                             reading: 'pan', type: 'noun' }
     tile('を', 'o', 'particle')          → { id: 'particle:を', … }

   `type` defaults to 'noun' because most fixtures are only ever asked to be
   distinct from one another; pass a real one where the test is about types. */

import type { DrillItem, DrillScenario, Tile } from '../../src/data/drill';
import type { TileType } from '../../src/data/schema';

/** One tile. The id is derived exactly as the content files derive it. */
export function tile(newLanguageText: string, reading: string, type: TileType = 'noun'): Tile {
  return { id: `${type}:${newLanguageText}`, newLanguageText, reading, type };
}

/** Several tiles from `[text, reading]` pairs, for an answer or a pool. */
export function tileList(...pairs: readonly (readonly [string, string])[]): Tile[] {
  return pairs.map(([text, reading]) => tile(text, reading));
}

/**
 * A drill item with the boilerplate filled in.
 *
 * Only `answer` is required; everything else has a placeholder, so a test that
 * cares about one field says only that field.
 */
export function drillItem(fields: Partial<DrillItem> & Pick<DrillItem, 'answer'>): DrillItem {
  return {
    id: 'test-01',
    promptText: 'A prompt.',
    alternates: [],
    note: 'A note.',
    tags: [],
    ...fields,
  };
}

/** The text of each tile, which is what most assertions actually compare. */
export const textsOf = (tiles: readonly Tile[]): string[] =>
  tiles.map((t) => t.newLanguageText);

/**
 * A situation with the boilerplate filled in. `items` and `words` default to
 * empty, so a test about home-screen copy says only what it is about.
 */
export function drillScenario(fields: Partial<DrillScenario> = {}): DrillScenario {
  return {
    id: 'test',
    name: 'Test',
    kicker: 'Set 01',
    blurb: 'A situation.',
    items: [],
    words: [],
    ...fields,
  };
}
