/* Generating the tile bank for one drill item.

   The bank is deliberately oversupplied — roughly `multiplier` times the tiles
   the answer needs — so a correct sentence cannot be brute-forced by
   elimination. It is built in four steps:

     1. the answer's own tiles;
     2. any extra tile the accepted alternates need, so every accepted answer is
        actually buildable — パンをお願いします needs お願いします, which the
        canonical パンをください does not supply;
     3. distractors drawn from the grammar pool plus the scene's vocabulary,
        until the bank reaches its target size;
     4. a shuffle.

   Steps 3 and 4 are deterministic functions of the item's index — no RNG. The
   same item always produces the same bank in the same order, which is what lets
   the UI treat a tile's position as a stable identity across re-renders. The
   arithmetic below is arbitrary but must not be "tidied": changing it reshuffles
   every bank in the app. */

import type { DrillItem, Tile } from '../data/drill';

/** No bank is ever smaller than this, however short the sentence. */
export const MIN_BANK_TILES = 12;

/** The two pools distractors are drawn from, in the order they are drawn. */
export interface BankPools {
  /** Particles, endings and question words shared by every situation. */
  readonly grammar: readonly Tile[];
  /** The current situation's own vocabulary. */
  readonly words: readonly Tile[];
}

/**
 * Build the tile bank for `item`.
 *
 * @param index      The item's position in its set. Seeds the deterministic
 *                   draw and shuffle — two items with the same index and pools
 *                   produce the same bank.
 * @param multiplier Distractor density; see TILE_MULTIPLIER in src/config.ts.
 */
export function buildBank(
  item: DrillItem,
  index: number,
  pools: BankPools,
  multiplier: number,
): Tile[] {
  const need = Math.max(MIN_BANK_TILES, Math.ceil(item.answer.length * multiplier));

  /* Keyed by the tile's id: a tile already in the bank is never added again,
     and is excluded from the distractor pool below. */
  const used = new Set<string>(item.answer.map((tile) => tile.id));
  const bank: Tile[] = [...item.answer];

  /* 2. Seed whatever the alternates need and the canonical answer lacks. The
        alternates arrive as tiles, so there is nothing to work out here — an
        alternate used to be a written-out string that had to be split back
        into tiles against the vocabulary in play before it could be seeded. */
  for (const alternate of item.alternates) {
    for (const tile of alternate) {
      if (!used.has(tile.id)) {
        used.add(tile.id);
        bank.push(tile);
      }
    }
  }

  /* 3. Fill with distractors. Drawing by index and removing as we go means a
        tile is never drawn twice, and the stride keeps consecutive draws from
        clustering in one part of the pool. */
  const pool = [...pools.grammar, ...pools.words].filter((tile) => !used.has(tile.id));
  let draw = 0;
  while (bank.length < need && pool.length > 0) {
    const [tile] = pool.splice((index * 7 + draw * 13 + 3) % pool.length, 1);
    if (tile) bank.push(tile);
    draw++;
  }

  /* 4. Fisher–Yates with a fixed sequence in place of a random one, so the
        answer's tiles do not sit in order at the front of the bank. */
  for (let k = bank.length - 1; k > 0; k--) {
    const j = (k * 31 + index * 17 + 5) % (k + 1);
    const a = bank[k];
    const b = bank[j];
    if (a && b) {
      bank[k] = b;
      bank[j] = a;
    }
  }

  return bank;
}
